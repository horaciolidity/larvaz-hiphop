'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Smile,
  MoreVertical,
  Phone,
  Circle,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';

const CHAT_RELAY_POST_ID = '36f632cc-0195-46fb-ae22-ce2dea03376c';

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_username: string;
  participant_name: string;
  participant_avatar: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
}

// Initial demo conversations
const DEMO_CONVS: Conversation[] = [
  {
    id: 'conv-1',
    participant_id: 'user-graffiti-krew',
    participant_username: 'kronos_graff',
    participant_name: 'Kronos Muro Libre',
    participant_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    last_message: 'Cuando nos juntamos para el próximo muro?',
    last_message_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread_count: 2,
    is_online: true,
  },
  {
    id: 'conv-2',
    participant_id: 'user-dj-raw',
    participant_username: 'dj_frecuencia',
    participant_name: 'DJ Frecuencia Raw',
    participant_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    last_message: 'Te mando el beat esta noche bro',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unread_count: 0,
    is_online: true,
  },
  {
    id: 'conv-3',
    participant_id: 'user-mc-asfalto',
    participant_username: 'rimas_del_sur',
    participant_name: 'Lírica & Asfalto',
    participant_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    last_message: 'Ese freestyle en el cypher estuvo brutal 🔥',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unread_count: 1,
    is_online: false,
  },
];

const DEMO_MESSAGES: Record<string, DirectMessage[]> = {
  'conv-1': [
    {
      id: 'm1', conversation_id: 'conv-1', sender_id: 'user-graffiti-krew',
      content: 'Ey! Vi tu post del mural en Barracas. Está de otro nivel hermano 🔥',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), read: true,
    },
    {
      id: 'm2', conversation_id: 'conv-1', sender_id: 'user-larvaz-admin',
      content: 'Gracias crack! Fue una noche larga pero valió la pena.',
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(), read: true,
    },
    {
      id: 'm3', conversation_id: 'conv-1', sender_id: 'user-graffiti-krew',
      content: 'Cuando nos juntamos para el próximo muro?',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false,
    },
  ],
  'conv-2': [
    {
      id: 'm4', conversation_id: 'conv-2', sender_id: 'user-larvaz-admin',
      content: 'Bro, ese set que hiciste en la Clínica de Turntablism estuvo increíble',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), read: true,
    },
    {
      id: 'm5', conversation_id: 'conv-2', sender_id: 'user-dj-raw',
      content: 'Gracias! Tengo un beat guardado que creo que va perfecto para tu próximo video',
      created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(), read: true,
    },
    {
      id: 'm6', conversation_id: 'conv-2', sender_id: 'user-dj-raw',
      content: 'Te mando el beat esta noche bro',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), read: true,
    },
  ],
  'conv-3': [
    {
      id: 'm7', conversation_id: 'conv-3', sender_id: 'user-mc-asfalto',
      content: 'Ese freestyle en el cypher estuvo brutal 🔥',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), read: false,
    },
  ],
};

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 1000 * 60) return 'ahora';
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h`;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function getConvId(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join('_');
}

function MensajesContent() {
  const { currentUser, availableProfiles } = useApp();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('larvaz_conversations');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Only show demo conversations for mock admin user, guests see empty inbox
    return DEMO_CONVS;
  });

  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('larvaz_direct_messages');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEMO_MESSAGES;
  });
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Keep a ref so BroadcastChannel handler always sees the latest activeConv
  const activeConvRef = useRef<Conversation | null>(null);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('larvaz_conversations', JSON.stringify(conversations));
      } catch {}
    }
  }, [conversations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('larvaz_direct_messages', JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Cross-tab / cross-window real-time synchronization for messages
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('larvaz_messages_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_DM' && event.data.message) {
          const incoming: DirectMessage = event.data.message;
          const convId = incoming.conversation_id;
          const senderProfile = event.data.senderProfile;

          setMessages((prev) => ({
            ...prev,
            [convId]: [...(prev[convId] || []), incoming],
          }));

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === convId);
            if (exists) {
              return prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      last_message: incoming.content,
                      last_message_at: incoming.created_at,
                      unread_count: activeConvRef.current?.id === convId ? 0 : (c.unread_count || 0) + 1,
                    }
                  : c
              );
            } else if (senderProfile) {
              const newC: Conversation = {
                id: convId,
                participant_id: senderProfile.id,
                participant_username: senderProfile.username,
                participant_name: senderProfile.full_name,
                participant_avatar: senderProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                last_message: incoming.content,
                last_message_at: incoming.created_at,
                unread_count: 1,
                is_online: true,
              };
              return [newC, ...prev];
            }
            return prev;
          });
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'larvaz_direct_messages' && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'larvaz_conversations' && e.newValue) {
        try {
          setConversations(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Supabase Real-Time messages listener for cross-device DM sync
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // ── Carga inicial: fetch mensajes del relay via API route (bypasa RLS) ──
    const fetchRelayMessages = async () => {
      try {
        const myId = currentUser.id;
        const myUsername = currentUser.username.toLowerCase();

        // Buscar conversaciones reales (no demos) y cargar sus mensajes
        const realConvs = conversations.filter(c => !c.id.startsWith('conv-'));
        for (const conv of realConvs) {
          const res = await fetch(`/api/chat?conv_id=${encodeURIComponent(conv.id)}&limit=50`);
          if (!res.ok) continue;
          const { messages: msgs } = await res.json().catch(() => ({ messages: [] }));
          if (msgs && msgs.length > 0) {
            const directMsgs: DirectMessage[] = msgs.map((m: any) => ({
              id: m.msg_id || m.comment_id,
              conversation_id: m.conv_id,
              sender_id: m.sender_id,
              content: m.text,
              created_at: m.ts || m.db_ts,
              read: true,
            }));
            setMessages(prev => {
              const existing = prev[conv.id] || [];
              const merged = [...existing];
              for (const dm of directMsgs) {
                if (!merged.some(m => m.id === dm.id)) merged.push(dm);
              }
              merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              return { ...prev, [conv.id]: merged };
            });
          }
        }

        // Si el usuario tiene conversaciones que aún no están en la lista,
        // buscarlas: generamos los conv_ids con todos los perfiles disponibles
        // (sólo si hay menos de 10 para no hacer flood de requests)
        if (realConvs.length === 0) {
          // Es usuario nuevo sin conversaciones — no hay nada que cargar
        }
      } catch (err) {
        console.warn('Error cargando mensajes del relay:', err);
      }
    };

    fetchRelayMessages();

    // ── Listener Realtime: sin filter SQL (lo chequeamos en JS) para evitar drops silenciosos ──
    const supabase = createClient();
    if (!supabase) return;

    const realtimeChannel = supabase
      .channel('chat_relay_v3_' + currentUser.id.slice(0, 8))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          // Sin filter SQL — chequeamos post_id en JS
        },
        (payload: any) => {
          try {
            if (!payload.new?.content) return;
            if (payload.new.post_id !== CHAT_RELAY_POST_ID) return;

            const parsed = JSON.parse(payload.new.content);
            if (!parsed.conv_id || !parsed.text) return;

            const myId = currentUser.id;
            const myUsername = currentUser.username.toLowerCase();

            // ¿Es un mensaje mío o de mi conversación activa?
            const isMyConv =
              parsed.sender_id === myId ||
              parsed.recipient_id === myId ||
              (parsed.sender_username && parsed.sender_username.toLowerCase() === myUsername) ||
              (parsed.recipient_username && parsed.recipient_username.toLowerCase() === myUsername) ||
              (activeConvRef.current && activeConvRef.current.id === parsed.conv_id);

            if (!isMyConv) return;

            const incoming: DirectMessage = {
              id: parsed.msg_id || payload.new.id,
              conversation_id: parsed.conv_id,
              sender_id: parsed.sender_id,
              content: parsed.text,
              created_at: parsed.ts || new Date().toISOString(),
              read: activeConvRef.current?.id === parsed.conv_id,
            };

            // Solo agregar si no lo envié yo (evitar duplicado)
            const isFromMe = parsed.sender_id === myId;

            setMessages(prev => {
              const list = prev[parsed.conv_id] || [];
              if (list.some(m => m.id === incoming.id)) return prev;
              return { ...prev, [parsed.conv_id]: [...list, incoming] };
            });

            setConversations(prev => {
              const exists = prev.find(c => c.id === parsed.conv_id);
              if (exists) {
                return prev.map(c =>
                  c.id === parsed.conv_id
                    ? {
                        ...c,
                        last_message: incoming.content,
                        last_message_at: incoming.created_at,
                        unread_count: activeConvRef.current?.id === parsed.conv_id ? 0 : (c.unread_count || 0) + (isFromMe ? 0 : 1),
                      }
                    : c
                );
              } else if (!isFromMe) {
                // Nueva conversación entrante
                const newC: Conversation = {
                  id: parsed.conv_id,
                  participant_id: parsed.sender_id,
                  participant_username: parsed.sender_username || 'artista',
                  participant_name: parsed.sender_username || 'Compa Larvaz',
                  participant_avatar: '',
                  last_message: incoming.content,
                  last_message_at: incoming.created_at,
                  unread_count: 1,
                  is_online: true,
                };
                return [newC, ...prev];
              }
              return prev;
            });
          } catch (e) {
            console.warn('Error parsing incoming chat relay comment:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [currentUser.id, currentUser.username]);

  // Handle auto-open by query param ?user=username
  useEffect(() => {
    if (targetUserParam) {
      const match = availableProfiles.find(
        (p) =>
          p.username.toLowerCase() === targetUserParam.toLowerCase() ||
          p.id.toLowerCase() === targetUserParam.toLowerCase()
      );
      if (match) {
        startNewConversation(match);
      }
    }
  }, [targetUserParam, availableProfiles]);

  useEffect(() => {
    if (activeConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Mark as read
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
      );
    }
  }, [activeConv, messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const msg: DirectMessage = {
      id: 'msg-' + Date.now(),
      conversation_id: activeConv.id,
      sender_id: currentUser.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), msg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
          : c
      )
    );
    setNewMessage('');

    // Broadcast message to all other open tabs/windows in real time!
    if (typeof window !== 'undefined') {
      try {
        const bc = new BroadcastChannel('larvaz_messages_sync');
        bc.postMessage({
          type: 'NEW_DM',
          message: msg,
          senderProfile: currentUser,
        });
        bc.close();
      } catch {}
    }

    // ── Persist cross-device via API route (service_role bypasa RLS) ──
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          // Resolver sender_id real (UUID de Supabase auth o currentUser.id)
          let senderId = currentUser.id;
          const supabase = createClient();
          if (supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
              senderId = sessionData.session.user.id;
            }
          }

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender_id: senderId,
              sender_username: currentUser.username,
              recipient_id: activeConv.participant_id,
              recipient_username: activeConv.participant_username,
              text: msg.content,
              conv_id: activeConv.id,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn('Error enviando chat via API:', err);
          }
        } catch (err) {
          console.warn('Error enviando chat:', err);
        }
      })();
    }

    // Only simulate auto-reply if chatting with demo bot profiles (not another human/registered user)
    const isMockArtist = ['user-graffiti-krew', 'user-dj-raw', 'user-mc-asfalto', 'user-bboy-cypher'].includes(activeConv.participant_id);
    if (isMockArtist) {
      setTimeout(() => {
        const replies = [
          'Dale! 🔥', 'Eso!', 'Perfecto hermano', '¡Avisame cuando estés!',
          'Confirmado 💯', 'Nos vemos en el cypher', 'Mandame el link',
          'Ahí nos vemos crack', 'Tremendo 🎤',
        ];
        const autoReply: DirectMessage = {
          id: 'auto-' + Date.now(),
          conversation_id: activeConv.id,
          sender_id: activeConv.participant_id,
          content: replies[Math.floor(Math.random() * replies.length)],
          created_at: new Date().toISOString(),
          read: false,
        };
        setMessages((prev) => ({
          ...prev,
          [activeConv.id]: [...(prev[activeConv.id] || []), autoReply],
        }));
      }, 1500);
    }
  };

  const startNewConversation = (profile: any) => {
    // Deterministic conversation ID between two users
    const canonicalId = getConvId(currentUser.id, profile.id);
    const existing = conversations.find(
      (c) => c.id === canonicalId || c.participant_id === profile.id
    );

    if (existing) {
      setActiveConv(existing);
    } else {
      const newConv: Conversation = {
        id: canonicalId,
        participant_id: profile.id,
        participant_username: profile.username,
        participant_name: profile.full_name,
        participant_avatar: profile.avatar_url || '',
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        is_online: true,
      };
      setConversations((prev) => [newConv, ...prev]);
      setMessages((prev) => ({ ...prev, [newConv.id]: prev[newConv.id] || [] }));
      setActiveConv(newConv);
    }
    setShowNewChat(false);
    setSearchQuery('');
  };

  const filteredConvs = conversations.filter(c =>
    c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const convMessages = activeConv ? (messages[activeConv.id] || []) : [];
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-0 overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl mx-4 md:mx-6 mb-4">
      {/* Sidebar: Conversations List */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-surface-border flex-shrink-0`}>
        {/* Header */}
        <div className="p-4 border-b border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-black text-base text-content-primary flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-acid" />
              Mensajes
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-acid text-background text-[10px] font-black">
                  {totalUnread}
                </span>
              )}
            </h1>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs font-bold text-acid transition-colors"
              title="Nuevo mensaje"
            >
              +
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
            />
          </div>
        </div>

        {/* New Chat: Profile Picker */}
        {showNewChat && (
          <div className="p-3 border-b border-surface-border bg-surface-elevated/50">
            <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider mb-2">Iniciar conversación con:</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {availableProfiles
                .filter(p => p.id !== currentUser.id)
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => startNewConversation(p)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-hover transition-colors text-left"
                  >
                    <UserAvatar
                      avatarUrl={p.avatar_url}
                      name={p.username}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-content-primary">{p.full_name}</p>
                      <p className="text-[10px] text-content-muted">@{p.username}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-xs text-content-muted">
              No hay conversaciones todavía
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full p-3.5 flex items-center gap-3 hover:bg-surface-hover transition-colors text-left border-b border-surface-border/40 ${
                  activeConv?.id === conv.id ? 'bg-surface-elevated' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    avatarUrl={conv.participant_avatar}
                    name={conv.participant_name}
                    size="md"
                  />
                  {conv.is_online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-acid border-2 border-surface" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-content-primary truncate">{conv.participant_name}</p>
                    <span className="text-[10px] text-content-muted flex-shrink-0 ml-1">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[11px] text-content-secondary truncate">{conv.last_message || 'Iniciar conversación...'}</p>
                    {conv.unread_count > 0 && (
                      <span className="flex-shrink-0 ml-1 w-4 h-4 rounded-full bg-acid text-background text-[9px] font-black flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-surface-border flex items-center gap-3 bg-surface">
            <button
              onClick={() => setActiveConv(null)}
              className="md:hidden p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-content-secondary" />
            </button>
            <div className="relative">
              <UserAvatar
                avatarUrl={activeConv.participant_avatar}
                name={activeConv.participant_name}
                size="sm"
              />
              {activeConv.is_online && (
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-acid border-2 border-surface" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-content-primary">{activeConv.participant_name}</p>
              <p className="text-[10px] text-content-muted flex items-center gap-1">
                {activeConv.is_online
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-acid inline-block" />En línea</>
                  : '@' + activeConv.participant_username
                }
              </p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors">
              <MoreVertical className="w-4 h-4 text-content-muted" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {convMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-content-muted">
                <MessageCircle className="w-10 h-10 opacity-30" />
                <div>
                  <p className="text-xs font-bold">Comienza la conversación</p>
                  <p className="text-[11px] mt-1">Manda el primer mensaje a @{activeConv.participant_username}</p>
                </div>
              </div>
            ) : (
              convMessages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <UserAvatar
                        avatarUrl={activeConv.participant_avatar}
                        name=""
                        size="xs"
                        className="mr-2 self-end"
                      />
                    )}
                    <div className={`max-w-[70%] space-y-0.5`}>
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMine
                            ? 'bg-acid text-background rounded-br-sm font-medium'
                            : 'bg-surface-elevated border border-surface-border text-content-primary rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] text-content-muted">{formatTime(msg.created_at)}</span>
                        {isMine && (
                          msg.read
                            ? <CheckCheck className="w-3 h-3 text-acid" />
                            : <Check className="w-3 h-3 text-content-muted" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3.5 border-t border-surface-border bg-surface">
            {currentUser.is_guest ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-surface-border">
                <p className="text-xs text-content-secondary">
                  Debes iniciar sesión para chatear con <span className="text-acid font-bold">@{activeConv.participant_username}</span>
                </p>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg bg-acid text-background text-xs font-bold whitespace-nowrap hover:bg-acid-hover shadow-acid-sm"
                >
                  Iniciar Sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Mensaje a @${activeConv.participant_username}...`}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 rounded-xl bg-acid text-background hover:bg-acid-hover disabled:opacity-40 transition-all shadow-acid-glow flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Empty state on desktop */
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-acid/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-acid opacity-60" />
          </div>
          <div>
            <p className="font-display font-black text-lg text-content-primary">Mensajes Directos</p>
            <p className="text-xs text-content-secondary mt-1">Selecciona una conversación o inicia una nueva con un artista de la comunidad</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MensajesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-content-muted text-xs">
          Cargando mensajes directos...
        </div>
      }
    >
      <MensajesContent />
    </Suspense>
  );
}
