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
  PostMedia,
} from '@/types';
import { dataStore, GUEST_USER, INITIAL_PROFILES } from '@/lib/data-store';
import { mapDbPostToPost } from '@/lib/post-mapper';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import {
  DEFAULT_PLATFORM_SETTINGS,
  normalizePlatformSettings,
  PlatformSettings,
} from '@/lib/platform-settings';
import { withEffectiveRole } from '@/lib/roles';

interface AppContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  availableProfiles: Profile[];
  totalMembersCount: number;
  posts: Post[];
  events: HipHopEvent[];
  notifications: Notification[];
  unreadNotifsCount: number;
  unreadMessagesCount: number;
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
  referredUsers: Profile[];
  referralStats: { count: number; props: number };
  refreshReferrals: () => Promise<void>;

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

  // Platform settings (Panel Super Admin)
  platformSettings: PlatformSettings;
  refreshPlatformSettings: () => Promise<void>;
  updatePlatformSettings: (
    next: PlatformSettings
  ) => Promise<{ success: boolean; error?: string }>;

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
  addComment: (postId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<boolean>;
  createPost: (data: {
    externalUrl?: string;
    description: string;
    tags?: string[];
    contentType?: ContentType;
    provider?: any;
    metadata?: any;
    media?: PostMedia[];
  }) => Post;
  createEvent: (data: any) => HipHopEvent;
  deleteEvent: (eventIdOrSlug: string) => boolean;
  createReport: (data: any) => Report;
  markNotificationsAsRead: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  incrementViews: (postId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Deterministic SSR-safe initial state so server-rendered HTML and client initial pass match 100%
  const [currentUser, setCurrentUserState] = useState<Profile>(GUEST_USER);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('para_ti');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<HipHopEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [totalMembersCount, setTotalMembersCount] = useState<number>(INITIAL_PROFILES.length);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(
    DEFAULT_PLATFORM_SETTINGS
  );
  const isSupabaseConnected = isSupabaseConfigured();

  const syncProfilesState = useCallback(() => {
    const all = dataStore.getAllProfiles();
    setAvailableProfiles([...all]);
    setTotalMembersCount(all.length);
  }, []);


  // Geographic Location state (default Mendoza, Argentina for SSR)
  const [userLocation, setUserLocationState] = useState<string>('Mendoza, Argentina');

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
      // Leer la emisora activa del store evita reproducir la anterior cuando
      // changeStation() y toggleRadio() se llaman en el mismo click.
      const activeStation = dataStore.getActiveRadioStation() || currentStation;
      if (!audioRef.current.src || audioRef.current.src !== activeStation.stream_url) {
        audioRef.current.src = activeStation.stream_url;
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
  const [balance, setBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Hydrate client-side persisted state after initial SSR mount cleanly without hydration mismatch
  useEffect(() => {
    const user = dataStore.getCurrentUser();
    setCurrentUserState(user);

    const all = dataStore.getAllProfiles();
    setAvailableProfiles([...all]);
    setTotalMembersCount(all.length);

    if (typeof window !== 'undefined') {
      const savedLoc = localStorage.getItem('larvaz_user_location');
      if (savedLoc) setUserLocationState(savedLoc);
    }

    setBalance(dataStore.getUserBalance(user.id));
    setWithdrawals(dataStore.getUserWithdrawals(user.id));
  }, []);

  const refreshBalance = (userId: string = currentUser.id) => {
    setBalance(dataStore.getUserBalance(userId));
    setWithdrawals(dataStore.getUserWithdrawals(userId));
  };

  // ── Ajustes globales de la plataforma ────────────────────────────────────
  const refreshPlatformSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const payload = await res.json();
      if (payload?.settings) {
        setPlatformSettings(normalizePlatformSettings(payload.settings));
      }
    } catch {
      // se mantienen los valores por defecto
    }
  }, []);

  useEffect(() => {
    refreshPlatformSettings();
  }, [refreshPlatformSettings]);

  const updatePlatformSettings = async (
    next: PlatformSettings
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase no está configurado.' };
      }
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        return { success: false, error: 'Necesitás iniciar sesión como administrador.' };
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: next }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, error: payload?.error || 'No se pudo guardar la configuración.' };
      }
      if (payload?.settings) {
        setPlatformSettings(normalizePlatformSettings(payload.settings));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: String(err?.message || err) };
    }
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
        if (profile.is_banned) {
          try {
            await supabase.auth.signOut();
          } catch {
            // cerramos la sesión local igualmente
          }
          dataStore.mergeProfiles([profile]);
          dataStore.setCurrentUser(GUEST_USER);
          syncProfilesState();
          setCurrentUserState(GUEST_USER);
          return;
        }

        const effectiveProfile = withEffectiveRole(profile);
        dataStore.mergeProfiles([effectiveProfile]);
        syncProfilesState();
        setCurrentUser(effectiveProfile);
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
          avatar_url: authUser.user_metadata?.avatar_url || '',
          location: authUser.user_metadata?.location || userLocation || 'Mendoza, Argentina',
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };

        try {
          await fetch('/api/profiles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProf),
          });
        } catch {}

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

  // currentUser ref — para evitar stale closures en listeners de DM
  const currentUserRef2 = React.useRef<Profile>(currentUser);
  useEffect(() => { currentUserRef2.current = currentUser; }, [currentUser]);

  // Ref al canal WebSocket suscrito para enviar broadcasts sin recrear canales duplicados
  const syncChannelRef = React.useRef<any>(null);
  const autoSyncedIdsRef = React.useRef<Set<string>>(new Set());
  const autoSyncedEventIdsRef = React.useRef<Set<string>>(new Set());

  const mapEventFromDB = useCallback((e: any): HipHopEvent => {
    const organizer: Profile = e.profiles || {
      id: e.organizer_id,
      username: 'organizador',
      full_name: e.organizer_name || 'Organizador Larvaz',
      avatar_url: '',
      role: 'user',
      is_banned: false,
      created_at: e.created_at,
    };

    return {
      id: e.id ? String(e.id) : 'event-' + e.created_at,
      organizer_id: e.organizer_id,
      title: e.title || '',
      slug: e.slug || String(e.id),
      description: e.description || '',
      flyer_url: e.flyer_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop',
      start_date: e.start_date,
      end_date: e.end_date || undefined,
      timezone: e.timezone || 'America/Argentina/Buenos_Aires',
      location: e.location || 'Mendoza, Argentina',
      is_online: Boolean(e.is_online),
      organizer_name: e.organizer_name || organizer.full_name,
      ticket_url: e.ticket_url || undefined,
      tags: Array.isArray(e.tags) ? e.tags : ['hiphop', 'cultura'],
      created_at: e.created_at,
      organizer,
    };
  }, []);

  const mapPostFromDB = useCallback((p: any): Post => {
    return mapDbPostToPost(p);
  }, []);

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
        } else if (event.data?.type === 'NEW_EVENT' && event.data.event) {
          dataStore.addExternalEvent(event.data.event);
          setEvents(dataStore.getEvents());
        } else if (event.data?.type === 'SYNC_EVENTS') {
          dataStore.reloadEvents();
          setEvents(dataStore.getEvents());
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
      if (e.key === 'larvaz_events') {
        dataStore.reloadEvents();
        setEvents(dataStore.getEvents());
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

    // ── Usa API routes server-side (service_role key) → bypasea RLS totalmente ──
    const fetchSupabasePosts = async () => {
      try {
        const res = await fetch(`/api/feed?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { posts: dbPosts } = await res.json();
        const dbList = Array.isArray(dbPosts) ? dbPosts : [];

        if (dbList.length > 0) {
          const mappedPosts: Post[] = dbList.map(mapPostFromDB);
          dataStore.mergePosts(mappedPosts);

          // Extraer y sincronizar comentarios de la comunidad para que todos los vean
          const allDbComments: Comment[] = [];
          for (const rawPost of dbList) {
            if (Array.isArray(rawPost.comments)) {
              for (const c of rawPost.comments) {
                if (!c.is_hidden) {
                  allDbComments.push({
                    id: String(c.id),
                    post_id: String(c.post_id || rawPost.id),
                    user_id: c.user_id,
                    content: c.content || '',
                    is_hidden: false,
                    created_at: c.created_at,
                    author: c.profiles || {
                      id: c.user_id,
                      username: 'artista',
                      full_name: 'Artista Larvaz',
                      avatar_url: '',
                      role: 'user',
                      is_banned: false,
                      created_at: c.created_at,
                    },
                  });
                }
              }
            }
          }
          if (allDbComments.length > 0) {
            dataStore.mergeComments(allDbComments);
          }

          refreshPostsRef.current();
          setRadioStations([...dataStore.getRadioStations()]);
          setCommunityTracks([...dataStore.getCommunityTracks()]);
        }

        // Auto-sincronizar cualquier publicación local que haya quedado sin subir a Supabase
        const syncedIds = new Set<string>(dbList.map((p: any) => String(p.id)));
        const unsynced = dataStore.getUnsyncedLocalPosts(syncedIds);
        for (const localPost of unsynced) {
          if (autoSyncedIdsRef.current.has(localPost.id)) continue;
          autoSyncedIdsRef.current.add(localPost.id);
          try {
            const syncRes = await fetch('/api/post', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: localPost.id,
                user_id: localPost.user_id,
                author_username: localPost.author?.username,
                author_name: localPost.author?.full_name,
                author_avatar: localPost.author?.avatar_url,
                author_location: localPost.author?.location || (localPost.metadata as any)?.location,
                author_disciplines: localPost.author?.artistic_disciplines,
                description: localPost.description || '',
                content_type: localPost.content_type || 'text',
                tags: localPost.tags || ['hiphop'],
                external_url: localPost.external_url || '',
                normalized_url: localPost.normalized_url || null,
                provider: localPost.provider || 'generic',
                metadata: localPost.metadata || null,
                created_at: localPost.created_at,
              }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData?.post?.id && String(syncData.post.id) !== localPost.id) {
                dataStore.replacePostId(localPost.id, String(syncData.post.id));
              }
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Error fetching posts via API:', err);
      }
    };

    const fetchSupabaseProfiles = async () => {
      try {
        const res = await fetch(`/api/profiles?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { profiles: dbProfiles } = await res.json();
        if (dbProfiles && dbProfiles.length > 0) {
          dataStore.mergeProfiles(dbProfiles);
          syncProfilesState();
        }
      } catch (err) {
        console.warn('Error fetching profiles via API:', err);
      }
    };

    const fetchSupabaseEvents = async () => {
      try {
        const res = await fetch(`/api/events?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { events: dbEvents } = await res.json();
        const dbList = Array.isArray(dbEvents) ? dbEvents : [];

        if (dbList.length > 0) {
          const mappedEvents: HipHopEvent[] = dbList.map(mapEventFromDB);
          dataStore.mergeEvents(mappedEvents);
          setEvents(dataStore.getEvents());
        }

        // Auto-sincronizar cualquier evento local creado previamente que no esté aún en Supabase
        const syncedEventKeys = new Set<string>();
        for (const ev of dbList) {
          if (ev.id) syncedEventKeys.add(String(ev.id));
          if (ev.slug) syncedEventKeys.add(String(ev.slug));
        }

        const unsyncedEvents = dataStore.getUnsyncedLocalEvents(syncedEventKeys);
        for (const localEv of unsyncedEvents) {
          const evKey = localEv.slug || localEv.id;
          if (autoSyncedEventIdsRef.current.has(evKey)) continue;
          autoSyncedEventIdsRef.current.add(evKey);
          try {
            await fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: localEv.id,
                organizer_id: localEv.organizer_id,
                organizer_username: localEv.organizer?.username,
                organizer_name: localEv.organizer_name || localEv.organizer?.full_name,
                organizer_avatar: localEv.organizer?.avatar_url,
                title: localEv.title,
                slug: localEv.slug,
                description: localEv.description,
                flyer_url: localEv.flyer_url,
                start_date: localEv.start_date,
                end_date: localEv.end_date || null,
                timezone: localEv.timezone || 'America/Argentina/Buenos_Aires',
                location: localEv.location,
                is_online: localEv.is_online || false,
                ticket_url: localEv.ticket_url || null,
                tags: localEv.tags || ['hiphop', 'cultura'],
                created_at: localEv.created_at,
              }),
            });
          } catch {}
        }
      } catch (err) {
        console.warn('Error fetching events via API:', err);
      }
    };

    fetchSupabasePosts();
    fetchSupabaseProfiles();
    fetchSupabaseEvents();

    // 1. Sincronización Realtime por WebSocket Broadcast + postgres_changes
    const syncChannel = supabase
      .channel('larvaz_live_relay')
      .on(
        'broadcast',
        { event: 'NEW_POST' },
        (event: any) => {
          if (event?.payload?.post) {
            dataStore.mergePosts([event.payload.post]);
            refreshPostsRef.current();
          }
          fetchSupabasePosts();
        }
      )
      .on(
        'broadcast',
        { event: 'NEW_EVENT' },
        (event: any) => {
          if (event?.payload?.event) {
            dataStore.mergeEvents([event.payload.event]);
            setEvents(dataStore.getEvents());
          }
          fetchSupabaseEvents();
        }
      )
      .on(
        'broadcast',
        { event: 'dm' },
        (event: any) => {
          try {
            const parsed = event.payload;
            if (!parsed?.text) return;
            const me = currentUserRef2.current;
            if (!me) return;

            const isForMe =
              parsed.recipient_id === me.id ||
              (parsed.recipient_username &&
                parsed.recipient_username.toLowerCase() === me.username.toLowerCase());
            const isFromMe =
              parsed.sender_id === me.id ||
              (parsed.sender_username &&
                parsed.sender_username.toLowerCase() === me.username.toLowerCase());

            if (isForMe && !isFromMe) {
              setUnreadMessagesCount((prev) => prev + 1);

              const newNotif: Notification = {
                id: 'notif-msg-' + Date.now(),
                user_id: me.id,
                actor_id: parsed.sender_id,
                type: 'mention',
                actor: {
                  id: parsed.sender_id,
                  username: parsed.sender_username || 'artista',
                  full_name: parsed.sender_name || parsed.sender_username || 'Compa Larvaz',
                  avatar_url: parsed.sender_avatar || '',
                  role: 'user',
                  is_banned: false,
                  created_at: new Date().toISOString(),
                },
                read: false,
                created_at: new Date().toISOString(),
              };
              setNotifications((prev) => [newNotif, ...prev]);
            }
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchSupabasePosts();
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchSupabasePosts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchSupabaseEvents();
        }
      )
      .subscribe();

    syncChannelRef.current = syncChannel;

    // 2. Refresco periódico en background (cada 6s) y al volver a enfocar la pestaña
    const intervalId = setInterval(() => {
      fetchSupabasePosts();
      fetchSupabaseEvents();
    }, 6000);

    const onFocus = () => {
      fetchSupabasePosts();
      fetchSupabaseProfiles();
      fetchSupabaseEvents();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      syncChannelRef.current = null;
      supabase.removeChannel(syncChannel);
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [supabase, isSupabaseConnected]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!platformSettings.features.registrationsEnabled) {
      return {
        success: false,
        error: 'El registro está temporalmente cerrado. Volvé a intentarlo más tarde.',
      };
    }

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

        // Registrar el referido también en el servidor (notifications como fuente de verdad)
        if (data.referralCode) {
          try {
            await fetch('/api/referrals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                referrer: data.referralCode,
                referred_id: authData.user.id,
                referred_username: cleanUsername,
                referred_name: data.fullName,
                referred_avatar: authData.user.user_metadata?.avatar_url || '',
              }),
            });
          } catch {
            // el registro local sigue funcionando como respaldo
          }
        }

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
      avatar_url: '',
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
    refreshReferrals();
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('larvaz_conversations');
        localStorage.removeItem('larvaz_direct_messages');
        // Limpiar todas las claves de conversaciones de usuarios para máxima privacidad
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('larvaz_conversations_') || k.startsWith('larvaz_direct_messages_')) {
            localStorage.removeItem(k);
          }
        });
      } catch {}
    }
    setCurrentUser(GUEST_USER);
  };

  const [referredUsers, setReferredUsers] = useState<Profile[]>([]);
  const [referralStats, setReferralStats] = useState<{ count: number; props: number }>({
    count: 0,
    props: 0,
  });

  const refreshReferrals = useCallback(async () => {
    const local = dataStore.getReferredUsers(currentUser.username);
    const localStats = dataStore.updateReferralStats(currentUser.username);
    const merged = new Map<string, Profile>();
    local.forEach((p) => merged.set(p.id, p));
    setReferredUsers(Array.from(merged.values()));
    setReferralStats({
      count: localStats.count,
      props: localStats.props,
    });

    if (!currentUser.username || currentUser.is_guest) return;

    try {
      const res = await fetch(
        `/api/referrals?username=${encodeURIComponent(currentUser.username)}&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json();
      const remote: Profile[] = Array.isArray(data?.referredUsers) ? data.referredUsers : [];
      remote.forEach((p) => merged.set(p.id, p));
      const list = Array.from(merged.values());
      setReferredUsers(list);

      const count = Math.max(Number(data?.count) || 0, list.length);
      setReferralStats({
        count,
        props: Number(data?.props) || count * 50,
      });
    } catch {
      // el conteo local queda como respaldo
    }
  }, [currentUser.username, currentUser.is_guest]);

  useEffect(() => {
    refreshReferrals();
  }, [refreshReferrals]);

  const getReferredUsers = (): Profile[] => {
    if (referredUsers.length > 0) return referredUsers;
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

    if (isSupabaseConnected) {
      fetch('/api/post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          action: res.userHasLiked ? 'like' : 'unlike',
          user_id: currentUser.id,
        }),
      }).catch(() => {});
    }
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

  const getAccessToken = async (): Promise<string> => {
    if (!supabase) return '';
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || '';
    } catch {
      return '';
    }
  };

  const addComment = async (postId: string, content: string): Promise<Comment> => {
    const clean = content.trim();
    const token = await getAccessToken();
    const isPersistable = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      postId
    );

    if (token && isPersistable && platformSettings.features.commentsEnabled) {
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ post_id: postId, content: clean }),
        });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload?.comment) {
          dataStore.mergeComments([payload.comment as Comment]);
          dataStore.adjustPostCommentsCount(postId, 1);
          refreshPosts();
          return payload.comment as Comment;
        }
      } catch {
        // si el servidor falla, se conserva el comentario localmente
      }
    }

    const comment = dataStore.addComment(postId, clean);
    refreshPosts();
    return comment;
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    const token = await getAccessToken();
    const isPersistable = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      commentId
    );

    if (token && isPersistable) {
      try {
        const res = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return false;
        dataStore.removeComment(commentId);
        refreshPosts();
        return true;
      } catch {
        return false;
      }
    }

    const res = dataStore.deleteComment(commentId, currentUser.id);
    if (res) refreshPosts();
    return res;
  };

  const createPost = (data: any) => {
    const media = Array.isArray(data.media) ? data.media : data.metadata?.media;
    const metadata = media?.length
      ? { ...(data.metadata || {}), media }
      : data.metadata;
    const newPost = dataStore.createPost({ ...data, media, metadata });
    autoSyncedIdsRef.current.add(newPost.id);
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

    // ── Sincronizar en Supabase via API route (service_role → bypasea RLS) ──
    if (isSupabaseConnected) {
      (async () => {
        try {
          // Resolver el user_id real si existe sesión activa
          let targetUserId = currentUser.id;
          if (supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
              targetUserId = sessionData.session.user.id;
            }
          }

          // Si es visitante genérico no sincronizar a BD
          if (currentUser.is_guest && currentUser.id === 'user-guest') {
            return;
          }

          const res = await fetch('/api/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: newPost.id,
              user_id: targetUserId,
              author_username: currentUser.username,
              author_name: currentUser.full_name,
              author_avatar: currentUser.avatar_url,
              author_location: userLocation || currentUser.location || 'Mendoza, Argentina',
              author_disciplines: currentUser.artistic_disciplines || '',
              description: newPost.description || '',
              content_type: newPost.content_type || 'text',
              tags: newPost.tags || ['hiphop'],
              external_url: newPost.external_url || '',
              normalized_url: newPost.normalized_url || null,
              provider: newPost.provider || 'generic',
              metadata: newPost.metadata || null,
              created_at: newPost.created_at,
            }),
          });

          if (res.ok) {
            const result = await res.json();
            const createdPostData = result.post || result;
            if (createdPostData?.id) {
              const canonicalPost = mapPostFromDB(createdPostData);
              if (String(createdPostData.id) !== newPost.id) {
                dataStore.replacePostId(newPost.id, String(createdPostData.id));
              }
              dataStore.mergePosts([canonicalPost]);
              refreshPosts();

              // Difundir inmediatamente por WebSocket a todos los usuarios conectados en cualquier dispositivo
              if (syncChannelRef.current) {
                try {
                  await syncChannelRef.current.send({
                    type: 'broadcast',
                    event: 'NEW_POST',
                    payload: { post_id: canonicalPost.id, post: canonicalPost },
                  });
                } catch {}
              }

              // Re-fetch el feed completo para confirmar sincronización global
              const feedRes = await fetch(`/api/feed?t=${Date.now()}`, { cache: 'no-store' });
              if (feedRes.ok) {
                const { posts: dbPosts } = await feedRes.json();
                if (dbPosts?.length) {
                  const mapped = dbPosts.map(mapPostFromDB);
                  dataStore.mergePosts(mapped);
                  refreshPosts();
                }
              }
            }
          } else {
            const errBody = await res.json().catch(() => ({}));
            console.warn('Error al guardar post via API:', errBody);
          }
        } catch (err) {
          console.warn('Error al guardar post:', err);
        }
      })();
    }

    return newPost;
  };

  const createEvent = (data: any) => {
    const ev = dataStore.createEvent(data);
    autoSyncedEventIdsRef.current.add(ev.slug || ev.id);
    setEvents(dataStore.getEvents());

    // Difundir a otras pestañas locales
    if (typeof window !== 'undefined') {
      try {
        const ch = new BroadcastChannel('larvaz_community_sync');
        ch.postMessage({ type: 'NEW_EVENT', event: ev });
        ch.close();
      } catch {}
    }

    // Persistir en Supabase via API route para que todos los usuarios de la comunidad puedan ver y acceder al evento
    if (isSupabaseConnected) {
      (async () => {
        try {
          let targetOrganizerId = currentUser.id;
          if (supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
              targetOrganizerId = sessionData.session.user.id;
            }
          }

          const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: ev.id,
              organizer_id: targetOrganizerId,
              organizer_username: currentUser.username,
              organizer_name: ev.organizer_name || currentUser.full_name,
              organizer_avatar: currentUser.avatar_url,
              title: ev.title,
              slug: ev.slug,
              description: ev.description,
              flyer_url: ev.flyer_url,
              start_date: ev.start_date,
              end_date: ev.end_date || null,
              timezone: ev.timezone || 'America/Argentina/Buenos_Aires',
              location: ev.location,
              is_online: ev.is_online || false,
              ticket_url: ev.ticket_url || null,
              tags: ev.tags || ['hiphop', 'cultura'],
              created_at: ev.created_at,
            }),
          });

          if (res.ok) {
            const result = await res.json();
            const createdEvData = result.event || result;
            if (createdEvData?.id) {
              const canonicalEv = mapEventFromDB(createdEvData);
              dataStore.mergeEvents([canonicalEv]);
              setEvents(dataStore.getEvents());

              if (syncChannelRef.current) {
                try {
                  await syncChannelRef.current.send({
                    type: 'broadcast',
                    event: 'NEW_EVENT',
                    payload: { event_id: canonicalEv.id, event: canonicalEv },
                  });
                } catch {}
              }

              const eventsRes = await fetch(`/api/events?t=${Date.now()}`, { cache: 'no-store' });
              if (eventsRes.ok) {
                const { events: dbEvents } = await eventsRes.json();
                if (dbEvents?.length) {
                  dataStore.mergeEvents(dbEvents.map(mapEventFromDB));
                  setEvents(dataStore.getEvents());
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error al guardar evento:', err);
        }
      })();
    }

    return ev;
  };

  const deleteEvent = (eventIdOrSlug: string) => {
    const res = dataStore.deleteEvent(eventIdOrSlug);
    if (res) {
      setEvents(dataStore.getEvents());
      if (isSupabaseConnected) {
        fetch(`/api/events?id=${encodeURIComponent(eventIdOrSlug)}&slug=${encodeURIComponent(eventIdOrSlug)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }
    return res;
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
    if (res) {
      refreshPosts();
      if (isSupabaseConnected) {
        fetch(`/api/post?id=${encodeURIComponent(postId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }
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
        unreadMessagesCount,
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
        referredUsers,
        referralStats,
        refreshReferrals,
        sendCryptoTip,
        getCryptoTips,
        balance,
        withdrawals,
        requestWithdrawal,
        updateUserRole,
        toggleUserBan,
        deletePost,
        platformSettings,
        refreshPlatformSettings,
        updatePlatformSettings,
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
        deleteEvent,
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

