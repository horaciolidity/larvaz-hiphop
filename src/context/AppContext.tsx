'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  UserRole,
  WithdrawalRequest,
} from '@/types';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

interface AppContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  availableProfiles: Profile[];
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

  // Radio Streaming
  isRadioPlaying: boolean;
  currentStation: RadioStation;
  radioStations: RadioStation[];
  toggleRadio: () => void;
  changeStation: (stationId: string) => void;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<Profile>(dataStore.getCurrentUser());
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('para_ti');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<HipHopEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isSupabaseConnected = isSupabaseConfigured();

  // Radio streaming state
  const [radioStations] = useState<RadioStation[]>(dataStore.getRadioStations());
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
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const refreshPosts = () => {
    const fetched = dataStore.getPosts({
      filter: feedFilter,
      contentType: contentTypeFilter === 'all' ? undefined : contentTypeFilter,
    });
    setPosts(fetched);
  };

  useEffect(() => {
    refreshPosts();
    setEvents(dataStore.getEvents());
    setNotifications(dataStore.getNotifications());
  }, [feedFilter, contentTypeFilter, currentUser]);

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
        .single();

      if (profile) {
        setCurrentUser(profile);
      } else {
        const newProf: Profile = {
          id: authUser.id,
          username:
            authUser.user_metadata?.username ||
            authUser.email?.split('@')[0] ||
            'artista_' + authUser.id.substring(0, 5),
          full_name: authUser.user_metadata?.full_name || 'Artista Larvaz',
          bio: 'Creador en la comunidad Larvaz Hip-Hop.',
          avatar_url:
            authUser.user_metadata?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          role: 'user',
          is_banned: false,
          created_at: new Date().toISOString(),
        };
        await supabase.from('profiles').insert(newProf);
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
  }): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (isSupabaseConnected && supabase && data.password) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
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
            : '¡Cuenta creada! Revisa tu correo si requiere confirmación de cuenta.',
        };
      }
    }

    // Local fallback
    const newProfile: Profile = {
      id: 'user-' + Date.now(),
      username: data.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
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
    };
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
    const all = dataStore.getAllProfiles();
    const defaultUser = all[1] || all[0];
    if (defaultUser) {
      setCurrentUser(defaultUser);
    }
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

  const updateProfile = (data: Partial<Profile>) => {
    const updated = dataStore.updateProfile(data);
    setCurrentUserState(updated);
    refreshPosts();
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
        availableProfiles: dataStore.getAllProfiles(),
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
        isRadioPlaying,
        currentStation,
        radioStations,
        toggleRadio,
        changeStation,
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

