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
} from '@/types';
import { dataStore } from '@/lib/data-store';
import { isSupabaseConfigured } from '@/lib/supabase/client';

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

  // Crypto Tipping
  sendCryptoTip: (data: {
    postId: string;
    recipientId: string;
    amountUsd: number;
    cryptoAmount: number;
    currency: 'USDT' | 'SOL' | 'ETH' | 'BTC';
    message?: string;
  }) => CryptoTip;
  getCryptoTips: (postId?: string) => CryptoTip[];

  // Super Admin Management
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  toggleUserBan: (userId: string) => boolean;
  deletePost: (postId: string) => boolean;

  // Auth
  login: (username: string) => boolean;
  logout: () => void;

  // Core Actions
  refreshPosts: () => void;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => boolean;
  toggleFollow: (profileId: string) => boolean;
  isFollowing: (profileId: string) => boolean;
  addComment: (postId: string, content: string) => Comment;
  deleteComment: (commentId: string) => boolean;
  createPost: (data: {
    externalUrl: string;
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

  const setCurrentUser = (user: Profile) => {
    dataStore.setCurrentUser(user);
    setCurrentUserState(user);
    refreshPosts();
    setNotifications(dataStore.getNotifications());
  };

  const login = (username: string): boolean => {
    const profiles = dataStore.getAllProfiles();
    const found = profiles.find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    const defaultUser = dataStore.getAllProfiles()[1] || INITIAL_PROFILES[1];
    setCurrentUser(defaultUser);
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
        updateUserRole,
        toggleUserBan,
        deletePost,
        login,
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

