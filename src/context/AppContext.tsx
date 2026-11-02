'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Profile,
  Post,
  Comment,
  HipHopEvent,
  Notification,
  FeedFilter,
  ContentType,
  Report,
  CryptoTip,
  RadioStation,
  RadioTrack,
  UserRole,
  WithdrawalRequest,
} from '@/types';
import { dataStore, GUEST_USER } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

interface AppContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  availableProfiles: Profile[];
  totalMembersCount: number;
  posts: Post[];
  events: HipHopEvent[];
  notifications: Notification[];
  unreadNotifsCount: number;
  feedFilter: FeedFilter;
  setFeedFilter: (f: FeedFilter) => void;
  contentTypeFilter: ContentType | 'all';
  setContentTypeFilter: (ct: ContentType | 'all') => void;
  isSupabaseConnected: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // Geographic Location
  userLocation: string;
  setUserLocation: (loc: string) => void;

  // Radio Streaming & Community Tracks
  isRadioPlaying: boolean;
  currentStation: RadioStation;
  radioStations: RadioStation[];
  communityTracks: RadioTrack[];
  toggleRadio: () => void;
  changeStation: (stationId: string) => void;
  playCommunityTrack: (track: RadioTrack) => void;

  // Referrals
  getReferredUsers: () => Profile[];

  // Crypto Tipping, Balance & Withdrawals
  sendCryptoTip: (data: {
    postId: string;
    recipientId: string;
    amountUsd: number;
    cryptoAmount: number;
    currency: 'USDT' | 'SOL' | 'ETH' | 'BTC';
    message?: string;
  }) => CryptoTip;
  getCryptoTips: (postId?: string) => CryptoTip[];
  balance: number;
  withdrawals: WithdrawalRequest[];
  requestWithdrawal: (data: {
    amountUsdc: number;
    walletAddress: string;
    network: 'Solana' | 'Polygon' | 'Ethereum';
  }) => { success: boolean; error?: string; withdrawal?: WithdrawalRequest };

  // Super Admin Management
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  toggleUserBan: (userId: string) => boolean;
  deletePost: (postId: string) => boolean;

  // Auth (Supabase + Local fallback)
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password?: string;
    fullName: string;
    username: string;
    referralCode?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;

  // Core Actions
  refreshPosts: () => void;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => boolean;
  toggleFollow: (profileId: string) => boolean;
  isFollowing: (profileId: string) => boolean;
  addComment: (postId: string, content: string) => Comment;
  deleteComment: (commentId: string) => boolean;
  createPost: (data: {
    externalUrl?: string;
    description: string;
    tags?: string[];
    contentType?: ContentType;
    provider?: any;
    metadata?: any;
  }) => Post;
  createEvent: (data: any) => HipHopEvent;
  createReport: (data: any) => Report;
  markNotificationsAsRead: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  incrementViews: (postId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<Profile>(dataStore.getCurrentUser());
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('para_ti');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<HipHopEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(() => dataStore.getAllProfiles());
  const [totalMembersCount, setTotalMembersCount] = useState<number>(() => dataStore.getAllProfiles().length);
  const isSupabaseConnected = isSupabaseConfigured();

  const syncProfilesState = useCallback(() => {
    const all = dataStore.getAllProfiles();
    setAvailableProfiles([...all]);
    setTotalMembersCount(all.length);
  }, []);


  // Geographic Location state (default Mendoza, Argentina)
  const [userLocation, setUserLocationState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('larvaz_user_location');
      if (saved) return saved;
    }
    return 'Mendoza, Argentina';
  });

  const setUserLocation = (loc: string) => {
    setUserLocationState(loc);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('larvaz_user_location', loc);
      } catch { }
    }
  };

  // Auto-detect location gently on first visit if not saved
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('larvaz_user_location')) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
              );
              const data = await res.json();
              const city = data.address?.city || data.address?.town || data.address?.state || 'Mendoza';
              const country = data.address?.country || 'Argentina';
              setUserLocation(`${city}, ${country}`);
            } catch {
              // remains Mendoza, Argentina
            }
          },
          () => { },
          { timeout: 5000 }
        );
      }
    }
  }, []);

  // Radio streaming state & community uploaded tracks
  const [radioStations, setRadioStations] = useState<RadioStation[]>(dataStore.getRadioStations());
  const [communityTracks, setCommunityTracks] = useState<RadioTrack[]>(dataStore.getCommunityTracks());
  const [currentStation, setCurrentStation] = useState<RadioStation>(dataStore.getActiveRadioStation());
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Initialize Audio element on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audio.preload = 'none';
      audioRef.current = audio;

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  const toggleRadio = () => {
    if (!audioRef.current) return;
    if (isRadioPlaying) {
      audioRef.current.pause();
      setIsRadioPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src !== currentStation.stream_url) {
        audioRef.current.src = currentStation.stream_url;
      }
      audioRef.current
        .play()
        .then(() => setIsRadioPlaying(true))
        .catch(() => {
          // If browser restricts autoplay or stream error, still set state
          setIsRadioPlaying(true);
        });
    }
  };

  const changeStation = (stationId: string) => {
    const newStation = dataStore.setActiveRadioStation(stationId);
    setCurrentStation(newStation);
    if (audioRef.current) {
      audioRef.current.src = newStation.stream_url;
      if (isRadioPlaying) {
        audioRef.current.play().catch(() => { });
      }
    }
  };

  const playCommunityTrack = (track: RadioTrack) => {
    const commStation = dataStore.setActiveRadioStation('station-comunidad-larvaz');
    commStation.current_track = {
      title: track.title,
      artist: track.artist,
      album_art: track.album_art,
    };
    setCurrentStation({ ...commStation });
    if (audioRef.current) {
      if (
        track.audio_url &&
        (track.audio_url.endsWith('.mp3') ||
          track.audio_url.endsWith('.wav') ||
          track.audio_url.endsWith('.ogg') ||
          track.audio_url.startsWith('https://listen.181fm'))
      ) {
        audioRef.current.src = track.audio_url;
      } else {
        audioRef.current.src = commStation.stream_url;
      }
      audioRef.current
        .play()
        .then(() => setIsRadioPlaying(true))
        .catch(() => setIsRadioPlaying(true));
    }
  };

  // Use refs so realtime callbacks always see latest filter values (avoids stale closure)
  const feedFilterRef = React.useRef(feedFilter);
  const contentTypeFilterRef = React.useRef(contentTypeFilter);
  useEffect(() => { feedFilterRef.current = feedFilter; }, [feedFilter]);
  useEffect(() => { contentTypeFilterRef.current = contentTypeFilter; }, [contentTypeFilter]);

  const refreshPosts = useCallback(() => {
    const fetched = dataStore.getPosts({
      filter: feedFilterRef.current,
      contentType: contentTypeFilterRef.current === 'all' ? undefined : contentTypeFilterRef.current,
    });
    setPosts(fetched);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshPosts();
    setEvents(dataStore.getEvents());
    setNotifications(dataStore.getNotifications());
  }, [feedFilter, contentTypeFilter, currentUser, refreshPosts]);

  const supabase = createClient();
  const [balance, setBalance] = useState<number>(dataStore.getUserBalance(currentUser.id));
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(dataStore.getUserWithdrawals(currentUser.id));

  const refreshBalance = (userId: string = currentUser.id) => {
    setBalance(dataStore.getUserBalance(userId));
    setWithdrawals(dataStore.getUserWithdrawals(userId));
  };

  const syncSupabaseProfile = async (authUser: any) => {
    if (!supabase) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        dataStore.mergeProfiles([profile]);
        syncProfilesState();
        setCurrentUser(profile);
      } else {
        const username =
          authUser.user_metadata?.username ||
          authUser.email?.split('@')[0] ||
          'artista_' + authUser.id.substring(0, 5);

        const newProf: Profile = {
          id: authUser.id,
          username,
          full_name: authUser.user_metadata?.full_name || 'Artista Larvaz',
          bio: 'Creador en la comunidad Larvaz Hip-Hop.',
          avatar_url:
            authUser.user_metadata?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          location: authUser.user_metadata?.location || userLocation || 'Mendoza, Argentina',
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await supabase.from('profiles').upsert(newProf);
        if (upsertErr) {
          console.warn('Error upserting profile in Supabase:', upsertErr);
        }
        dataStore.mergeProfiles([newProf]);
        syncProfilesState();
        setCurrentUser(newProf);
      }
    } catch (err) {
      console.warn('Error syncing profile:', err);
    }
  };

  // Auth listener for Supabase
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSupabaseProfile(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        syncSupabaseProfile(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // refreshPosts ref so broadcast/realtime callbacks always call the latest version
  const refreshPostsRef = React.useRef(refreshPosts);
  useEffect(() => { refreshPostsRef.current = refreshPosts; }, [refreshPosts]);

  // syncProfilesState ref — prevents stale closure inside BroadcastChannel handler
  const syncProfilesStateRef = React.useRef(syncProfilesState);
  useEffect(() => { syncProfilesStateRef.current = syncProfilesState; }, [syncProfilesState]);

  // Cross-tab real-time sync via BroadcastChannel & LocalStorage events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('larvaz_community_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_POST' && event.data.post) {
          dataStore.addExternalPost(event.data.post);
          refreshPostsRef.current();
        } else if (event.data?.type === 'SYNC_FEED') {
          dataStore.reloadPosts();
          refreshPostsRef.current();
        } else if (event.data?.type === 'NEW_PROFILE' && event.data.profile) {
          dataStore.addProfile(event.data.profile);
          syncProfilesStateRef.current();
        } else if (event.data?.type === 'SYNC_PROFILES') {
          dataStore.reloadProfiles();
          syncProfilesStateRef.current();
        }
      };
    } catch { }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'larvaz_posts') {
        dataStore.reloadPosts();
        refreshPostsRef.current();
      }
      if (e.key === 'larvaz_profiles') {
        dataStore.reloadProfiles();
        syncProfilesStateRef.current();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Supabase Real-Time synchronization for posts & community profiles
  useEffect(() => {
    if (!supabase || !isSupabaseConnected) return;

    const fetchSupabasePosts = async () => {
      try {
        const { data: dbPosts, error } = await supabase
          .from('posts')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false })
          .limit(50); // Límite económico para cuidar la cuota gratuita

        if (!error && dbPosts && dbPosts.length > 0) {
          const mappedPosts: Post[] = dbPosts.map((p: any) => {
            const author = p.profiles || {
              id: p.user_id,
              username: 'artista_' + (p.user_id ? String(p.user_id).substring(0, 5) : 'comunitario'),
              full_name: 'Artista Comunitario',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              role: 'user',
              is_banned: false,
              created_at: p.created_at,
            };

            return {
              id: p.id ? String(p.id) : 'post-' + p.created_at,
              user_id: p.user_id,
              external_url: p.external_url || undefined,
              normalized_url: p.normalized_url || undefined,
              provider: p.provider || (p.external_url ? 'generic' : 'generic'),
              content_type: p.content_type || 'text',
              description: p.description || '',
              tags: Array.isArray(p.tags) ? p.tags : [],
              likes_count: p.likes_count || 0,
              comments_count: p.comments_count || 0,
              is_hidden: p.is_hidden || false,
              created_at: p.created_at,
              author,
              metadata: p.metadata,
              user_has_liked: false,
              user_has_bookmarked: false,
              views_count: p.views_count || 1,
            };
          });

          dataStore.mergePosts(mappedPosts);
          refreshPostsRef.current();
        }
      } catch (err) {
        console.warn('Error fetching Supabase posts:', err);
      }
    };

    const fetchSupabaseProfiles = async () => {
      try {
        const { data: dbProfiles, error } = await supabase.from('profiles').select('*').limit(100);
        if (!error && dbProfiles && dbProfiles.length > 0) {
          dataStore.mergeProfiles(dbProfiles);
          syncProfilesState();
        }
      } catch (err) {
        console.warn('Error fetching Supabase profiles:', err);
      }
    };

    fetchSupabasePosts();
    fetchSupabaseProfiles();

    // Suscripción Realtime ultra-liviana (usa payload directo, costo 0 queries extra)
    const syncChannel = supabase
      .channel('public:posts_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const p = payload.new;
            const newPost: Post = {
              id: p.id ? String(p.id) : 'post-' + Date.now(),
              user_id: p.user_id,
              external_url: p.external_url || undefined,
              normalized_url: p.normalized_url || undefined,
              provider: p.provider || (p.external_url ? 'generic' : 'generic'),
              content_type: p.content_type || 'text',
              description: p.description || '',
              tags: Array.isArray(p.tags) ? p.tags : [],
              likes_count: p.likes_count || 0,
              comments_count: p.comments_count || 0,
              is_hidden: p.is_hidden || false,
              created_at: p.created_at || new Date().toISOString(),
              author: dataStore.getProfileById(p.user_id) || {
                id: p.user_id,
                username: 'artista_' + String(p.user_id).substring(0, 5),
                full_name: 'Artista Comunitario',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                role: 'user',
                is_banned: false,
                created_at: p.created_at || new Date().toISOString(),
              },
              metadata: p.metadata,
              user_has_liked: false,
              user_has_bookmarked: false,
              views_count: 1,
            };
            dataStore.addExternalPost(newPost);
            // Broadcast to other local tabs too
            try {
              const bc = new BroadcastChannel('larvaz_community_sync');
              bc.postMessage({ type: 'NEW_POST', post: newPost });
              bc.close();
            } catch { }
            refreshPostsRef.current();
          } else {
            fetchSupabasePosts();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            dataStore.addProfile(payload.new);
            syncProfilesState();
          } else {
            fetchSupabaseProfiles();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
    };
  }, [isSupabaseConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCurrentUser = (user: Profile) => {
    dataStore.setCurrentUser(user);
    setCurrentUserState(user);
    refreshPosts();
    setNotifications(dataStore.getNotifications());
    refreshBalance(user.id);
  };

  const login = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanInput = usernameOrEmail.trim();

    // 1. Supabase Auth if configured
    if (isSupabaseConnected && supabase && password) {
      let emailToLogin = cleanInput;
      if (!emailToLogin.includes('@')) {
        // Query profile by username to retrieve email
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', cleanInput)
            .maybeSingle();

          if (prof && (prof as any).email) {
            emailToLogin = (prof as any).email;
          }
        } catch {
          // continue with input
        }
      }

      if (emailToLogin.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToLogin,
          password: password,
        });
        if (error) {
          return {
            success: false,
            error:
              error.message === 'Invalid login credentials'
                ? 'Credenciales incorrectas. Verifica tu usuario/correo y contraseña.'
                : error.message,
          };
        }
        if (data.user) {
          await syncSupabaseProfile(data.user);
          return { success: true };
        }
      } else {
        return {
          success: false,
          error: 'Por favor ingresa un correo electrónico válido o nombre de usuario registrado.',
        };
      }
    }

    // 2. Local profile matching (when running offline/local store)
    const profiles = dataStore.getAllProfiles();
    const cleanSearch = cleanInput.toLowerCase().replace('@', '');
    const found = profiles.find(
      (p) =>
        p.username.toLowerCase() === cleanSearch ||
        p.full_name.toLowerCase().includes(cleanSearch)
    );
    if (found) {
      dataStore.addProfile(found); // ensure is_custom flag & re-save
      syncProfilesState();
      setCurrentUser(found);
      return { success: true };
    }

    return {
      success: false,
      error: 'Usuario o credenciales no encontrados. Por favor verifica tus datos.',
    };
  };

  const register = async (data: {
    email: string;
    password?: string;
    fullName: string;
    username: string;
    referralCode?: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> => {
    const cleanUsername = data.username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (isSupabaseConnected && supabase && data.password) {
      const redirectOrigin =
        typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
          ? 'https://larvaz-hiphop.vercel.app'
          : (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://larvaz-hiphop.vercel.app'));
      const emailRedirectTo = `${redirectOrigin.replace(/\/+$/, '')}/auth/callback`;
      const userLoc = userLocation || dataStore.getCurrentUser().location || 'Mendoza, Argentina';

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo,
          data: {
            username: cleanUsername,
            full_name: data.fullName,
            location: userLoc,
            referral_code: 'larvaz-' + cleanUsername,
            referred_by: data.referralCode,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (authData.user) {
        await syncSupabaseProfile(authData.user);
        return {
          success: true,
          message: authData.session
            ? '¡Bienvenido! Sesión iniciada con éxito.'
            : '¡Cuenta creada! Revisa tu correo y haz clic en validar para acceder a la comunidad.',
        };
      }
    }

    // Local registration
    const newProfile: Profile = {
      id: 'custom-' + Date.now(),
      username: cleanUsername,
      full_name: data.fullName.trim(),
      bio: 'Nuevo creador y apasionado de la cultura hip-hop en Larvaz.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      artistic_disciplines: 'MC / Hip Hop',
      role: 'user',
      is_banned: false,
      created_at: new Date().toISOString(),
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      referral_code: 'larvaz-' + cleanUsername,
      referrals_count: 0,
      referral_props_earned: 0,
      is_guest: false,
    };

    if (data.referralCode) {
      dataStore.registerReferral(data.referralCode, newProfile);
    }

    // Save profile into store list and notify other tabs
    dataStore.addProfile(newProfile);
    syncProfilesState();
    if (typeof window !== 'undefined') {
      try {
        const bc = new BroadcastChannel('larvaz_community_sync');
        bc.postMessage({ type: 'NEW_PROFILE', profile: newProfile });
        bc.close();
      } catch { }
    }

    setCurrentUser(newProfile);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConnected && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error signing out:', e);
      }
    }
    setCurrentUser(GUEST_USER);
  };

  const getReferredUsers = (): Profile[] => {
    return dataStore.getReferredUsers(currentUser.username);
  };

  const requestWithdrawal = (data: {
    amountUsdc: number;
    walletAddress: string;
    network: 'Solana' | 'Polygon' | 'Ethereum';
  }) => {
    const res = dataStore.requestWithdrawal({
      userId: currentUser.id,
      amountUsdc: data.amountUsdc,
      walletAddress: data.walletAddress,
      network: data.network,
    });
    if (res.success) {
      refreshBalance(currentUser.id);
    }
    return res;
  };

  const updateProfile = async (data: Partial<Profile>) => {
    const updated = dataStore.updateProfile(data);
    setCurrentUserState({ ...updated });
    refreshPosts();

    // Sincronizar en base de datos Supabase si la sesión está activa
    if (isSupabaseConnected && supabase && updated && !updated.is_guest) {
      try {
        await supabase.from('profiles').upsert({
          id: updated.id,
          username: updated.username,
          full_name: updated.full_name,
          bio: updated.bio,
          avatar_url: updated.avatar_url,
          banner_url: updated.banner_url,
          location: updated.location,
          website: updated.website,
          portfolio_url: updated.portfolio_url,
          artistic_disciplines: updated.artistic_disciplines,
          role: updated.role,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Error al sincronizar perfil con Supabase:', err);
      }
    }
  };

  const incrementViews = (postId: string): number => {
    const views = dataStore.incrementViews(postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, views_count: views } : p))
    );
    return views;
  };

  const toggleLike = (postId: string) => {
    const res = dataStore.toggleLike(postId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: res.likesCount, user_has_liked: res.userHasLiked }
          : p
      )
    );
  };

  const toggleBookmark = (postId: string) => {
    const bookmarked = dataStore.toggleBookmark(postId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, user_has_bookmarked: bookmarked } : p
      )
    );
    return bookmarked;
  };

  const toggleFollow = (profileId: string) => {
    const following = dataStore.toggleFollow(profileId);
    refreshPosts();
    return following;
  };

  const isFollowing = (profileId: string) => {
    return dataStore.isFollowing(profileId);
  };

  const addComment = (postId: string, content: string) => {
    const comment = dataStore.addComment(postId, content);
    refreshPosts();
    return comment;
  };

  const deleteComment = (commentId: string) => {
    const res = dataStore.deleteComment(commentId, currentUser.id);
    if (res) refreshPosts();
    return res;
  };

  const createPost = (data: any) => {
    const newPost = dataStore.createPost(data);
    refreshPosts();
    setRadioStations([...dataStore.getRadioStations()]);
    setCommunityTracks([...dataStore.getCommunityTracks()]);

    // Broadcast in real-time to other local tabs/windows
    if (typeof window !== 'undefined') {
      try {
        const ch = new BroadcastChannel('larvaz_community_sync');
        ch.postMessage({ type: 'NEW_POST', post: newPost });
        ch.close();
      } catch { }
    }

    // Sincronizar publicación en Supabase si está disponible
    if (isSupabaseConnected && supabase) {
      (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUser = sessionData?.session?.user;
          const targetUserId =
            authUser?.id ||
            (currentUser.id && currentUser.id.length === 36 && currentUser.id.includes('-')
              ? currentUser.id
              : null);

          if (targetUserId) {
            const { data: inserted, error } = await supabase
              .from('posts')
              .insert({
                user_id: targetUserId,
                external_url: newPost.external_url || 'https://larvaz-hiphop.vercel.app',
                normalized_url: newPost.normalized_url || null,
                provider: newPost.provider || 'generic',
                content_type: newPost.content_type || 'text',
                description: newPost.description || '',
                tags: newPost.tags || [],
                created_at: newPost.created_at,
              })
              .select('id')
              .single();

            if (error) {
              console.warn('Error al guardar post en Supabase:', error);
            } else if (inserted?.id) {
              newPost.id = inserted.id;
              dataStore.saveToStorage();
              refreshPosts();
            }
          }
        } catch (err) {
          console.warn('Error al guardar post en Supabase:', err);
        }
      })();
    }

    return newPost;
  };

  const createEvent = (data: any) => {
    const ev = dataStore.createEvent(data);
    setEvents(dataStore.getEvents());
    return ev;
  };

  const createReport = (data: any) => {
    return dataStore.createReport(data);
  };

  const markNotificationsAsRead = () => {
    dataStore.markNotificationsAsRead();
    setNotifications([...dataStore.getNotifications()]);
  };

  // Crypto Tipping
  const sendCryptoTip = (data: {
    postId: string;
    recipientId: string;
    amountUsd: number;
    cryptoAmount: number;
    currency: 'USDT' | 'SOL' | 'ETH' | 'BTC';
    message?: string;
  }) => {
    const tip = dataStore.sendCryptoTip(data);
    refreshPosts();
    return tip;
  };

  const getCryptoTips = (postId?: string) => {
    return dataStore.getCryptoTips(postId);
  };

  // Super Admin actions
  const updateUserRole = (userId: string, newRole: UserRole) => {
    const res = dataStore.updateUserRole(userId, newRole);
    if (res) {
      setCurrentUserState({ ...dataStore.getCurrentUser() });
      refreshPosts();
    }
    return res;
  };

  const toggleUserBan = (userId: string) => {
    const res = dataStore.toggleUserBan(userId);
    if (res) {
      setCurrentUserState({ ...dataStore.getCurrentUser() });
      refreshPosts();
    }
    return res;
  };

  const deletePost = (postId: string) => {
    const res = dataStore.deletePost(postId);
    if (res) refreshPosts();
    return res;
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableProfiles,
        totalMembersCount,
        posts,
        events,
        notifications,
        unreadNotifsCount,
        feedFilter,
        setFeedFilter,
        contentTypeFilter,
        setContentTypeFilter,
        isSupabaseConnected,
        isAdmin,
        isSuperAdmin,
        userLocation,
        setUserLocation,
        isRadioPlaying,
        currentStation,
        radioStations,
        communityTracks,
        toggleRadio,
        changeStation,
        playCommunityTrack,
        getReferredUsers,
        sendCryptoTip,
        getCryptoTips,
        balance,
        withdrawals,
        requestWithdrawal,
        updateUserRole,
        toggleUserBan,
        deletePost,
        login,
        register,
        logout,
        refreshPosts,
        toggleLike,
        toggleBookmark,
        toggleFollow,
        isFollowing,
        addComment,
        deleteComment,
        createPost,
        createEvent,
        createReport,
        markNotificationsAsRead,
        updateProfile,
        incrementViews,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

