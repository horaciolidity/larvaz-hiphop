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
        const saved = localStorage.getItem(`larvaz_conversations_${currentUser.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Solo mostrar conversaciones demo para visitantes o cuenta de demo; usuarios registrados inician limpios
    return currentUser.is_guest || currentUser.id === 'user-larvaz-admin' ? DEMO_CONVS : [];
  });

  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`larvaz_direct_messages_${currentUser.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return currentUser.is_guest || currentUser.id === 'user-larvaz-admin' ? DEMO_MESSAGES : {};
  });
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Keep a ref so BroadcastChannel handler always sees the latest activeConv
  const activeConvRef = useRef<Conversation | null>(null);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Refs para prevenir memory leaks y re-suscripciones constantes de WebSocket
  const broadcastChannelRef = useRef<any>(null);
  const availableProfilesRef = useRef<any[]>(availableProfiles);
  useEffect(() => { availableProfilesRef.current = availableProfiles; }, [availableProfiles]);
  const hasAutoOpenedRef = useRef<string | null>(null);

  // Al cambiar de usuario logueado, recargar estrictamente los chats correspondientes a su ID
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedConvs = localStorage.getItem(`larvaz_conversations_${currentUser.id}`);
      const savedMsgs = localStorage.getItem(`larvaz_direct_messages_${currentUser.id}`);
      setConversations(
        savedConvs ? JSON.parse(savedConvs) : (currentUser.is_guest || currentUser.id === 'user-larvaz-admin' ? DEMO_CONVS : [])
      );
      setMessages(
        savedMsgs ? JSON.parse(savedMsgs) : (currentUser.is_guest || currentUser.id === 'user-larvaz-admin' ? DEMO_MESSAGES : {})
      );
      setActiveConv(null);
    } catch {}
  }, [currentUser.id, currentUser.is_guest]);

  // Sync to localStorage scoped by currentUser.id
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser.id) {
      try {
        localStorage.setItem(`larvaz_conversations_${currentUser.id}`, JSON.stringify(conversations));
      } catch {}
    }
  }, [conversations, currentUser.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser.id) {
      try {
        localStorage.setItem(`larvaz_direct_messages_${currentUser.id}`, JSON.stringify(messages));
      } catch {}
    }
  }, [messages, currentUser.id]);

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

          setMessages((prev) => {
            const list = prev[convId] || [];
            const alreadyExists = list.some(
              (m) =>
                m.id === incoming.id ||
                (m.sender_id === incoming.sender_id &&
                  m.content === incoming.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(incoming.created_at).getTime()) < 6000)
            );
            if (alreadyExists) return prev;
            return {
              ...prev,
              [convId]: [...list, incoming],
            };
          });

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
                participant_avatar: senderProfile.avatar_url || '',
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
    const supabase = createClient();

    // ── Carga de mensajes de TODAS las conversaciones de este usuario ──
    const fetchRelayMessages = async () => {
      try {
        const myId = currentUser.id;
        const myUsername = (currentUser.username || '').toLowerCase();
        if (!myUsername && !myId) return;

        const res = await fetch(
          `/api/chat?user_id=${encodeURIComponent(myId)}&username=${encodeURIComponent(myUsername)}&limit=150`
        );
        if (!res.ok) return;

        const { messages: msgs } = await res.json().catch(() => ({ messages: [] }));
        if (!msgs || msgs.length === 0) return;

        // Agrupar mensajes por conv_id y descubrir conversaciones nuevas
        const messagesByConv: Record<string, DirectMessage[]> = {};
        const discoveredPartners = new Map<string, { username: string; id: string; lastMsg: string; lastTs: string }>();

        for (const m of msgs) {
          const isSender =
            m.sender_id === myId ||
            (m.sender_username && m.sender_username.toLowerCase() === myUsername);

          const partnerId = isSender ? m.recipient_id : m.sender_id;
          const partnerUsername = isSender ? m.recipient_username : m.sender_username;

          const convId = m.conv_id || [m.sender_id, m.recipient_id].sort().join('_');

          if (!messagesByConv[convId]) {
            messagesByConv[convId] = [];
          }

          const dm: DirectMessage = {
            id: m.msg_id || m.comment_id,
            conversation_id: convId,
            sender_id: m.sender_id,
            content: m.text,
            created_at: m.ts || m.db_ts,
            read: true,
          };
          messagesByConv[convId].push(dm);

          // Actualizar última actividad del partner
          discoveredPartners.set(convId, {
            id: partnerId,
            username: partnerUsername || 'artista',
            lastMsg: m.text,
            lastTs: m.ts || m.db_ts,
          });
        }

        // 1. Merge mensajes en estado
        setMessages((prev) => {
          const updated = { ...prev };
          for (const [cId, list] of Object.entries(messagesByConv)) {
            const existing = updated[cId] || [];
            const merged = [...existing];
            for (const dm of list) {
              const existingIdx = merged.findIndex(
                (x) =>
                  x.id === dm.id ||
                  (x.sender_id === dm.sender_id &&
                    x.content === dm.content &&
                    Math.abs(new Date(x.created_at).getTime() - new Date(dm.created_at).getTime()) < 6000)
              );
              if (existingIdx >= 0) {
                // Actualizar ID al canónico de base de datos si era temporal
                merged[existingIdx] = { ...merged[existingIdx], id: dm.id, created_at: dm.created_at };
              } else {
                merged.push(dm);
              }
            }
            merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            updated[cId] = merged;
          }
          return updated;
        });

        // 2. Actualizar o crear conversaciones en la barra lateral
        setConversations((prev) => {
          const next = [...prev];
          discoveredPartners.forEach((partner, cId) => {
            const idx = next.findIndex((c) => c.id === cId || c.participant_id === partner.id);
            if (idx >= 0) {
              next[idx] = {
                ...next[idx],
                last_message: partner.lastMsg,
                last_message_at: partner.lastTs,
              };
            } else {
              // Buscar perfil del partner
              const foundProf = availableProfilesRef.current.find(
                (p) =>
                  p.id === partner.id ||
                  p.username.toLowerCase() === partner.username.toLowerCase()
              );
              const newConv: Conversation = {
                id: cId,
                participant_id: foundProf?.id || partner.id,
                participant_username: foundProf?.username || partner.username,
                participant_name: foundProf?.full_name || partner.username,
                participant_avatar: foundProf?.avatar_url || '',
                last_message: partner.lastMsg,
                last_message_at: partner.lastTs,
                unread_count: 0,
                is_online: true,
              };
              next.unshift(newConv);
            }
          });
          return next;
        });
      } catch (err) {
        console.warn('Error cargando mensajes del relay:', err);
      }
    };

    fetchRelayMessages();

    // ── WebSocket Broadcast en Vivo (latencia < 50ms entre dispositivos) ──
    let broadcastChannel: any = null;
    if (supabase) {
      broadcastChannel = supabase
        .channel('larvaz_live_relay')
        .on('broadcast', { event: 'dm' }, (event: any) => {
          try {
            const parsed = event.payload;
            if (!parsed?.text || !parsed?.conv_id) return;

            const myId = currentUser.id;
            const myUsername = (currentUser.username || '').toLowerCase();

            const isForMe =
              parsed.recipient_id === myId ||
              (parsed.recipient_username &&
                parsed.recipient_username.toLowerCase() === myUsername);
            const isFromMe =
              parsed.sender_id === myId ||
              (parsed.sender_username &&
                parsed.sender_username.toLowerCase() === myUsername);

            if (!isForMe && !isFromMe) return;

            const incoming: DirectMessage = {
              id: parsed.msg_id || 'dm-' + Date.now(),
              conversation_id: parsed.conv_id,
              sender_id: parsed.sender_id,
              content: parsed.text,
              created_at: parsed.ts || new Date().toISOString(),
              read: activeConvRef.current?.id === parsed.conv_id,
            };

            setMessages((prev) => {
              const list = prev[parsed.conv_id] || [];
              const alreadyExists = list.some(
                (m) =>
                  m.id === incoming.id ||
                  (m.sender_id === incoming.sender_id &&
                    m.content === incoming.content &&
                    Math.abs(new Date(m.created_at).getTime() - new Date(incoming.created_at).getTime()) < 6000)
              );
              if (alreadyExists) return prev;
              return { ...prev, [parsed.conv_id]: [...list, incoming] };
            });

            setConversations((prev) => {
              const exists = prev.find((c) => c.id === parsed.conv_id);
              if (exists) {
                return prev.map((c) =>
                  c.id === parsed.conv_id
                    ? {
                        ...c,
                        last_message: incoming.content,
                        last_message_at: incoming.created_at,
                        unread_count:
                          activeConvRef.current?.id === parsed.conv_id
                            ? 0
                            : (c.unread_count || 0) + (isFromMe ? 0 : 1),
                      }
                    : c
                );
              } else {
                const partnerUsername = isFromMe
                  ? parsed.recipient_username
                  : parsed.sender_username;
                const partnerId = isFromMe ? parsed.recipient_id : parsed.sender_id;
                const foundProf = availableProfilesRef.current.find(
                  (p) =>
                    p.id === partnerId ||
                    p.username.toLowerCase() === (partnerUsername || '').toLowerCase()
                );
                const newC: Conversation = {
                  id: parsed.conv_id,
                  participant_id: foundProf?.id || partnerId,
                  participant_username: foundProf?.username || partnerUsername || 'artista',
                  participant_name: foundProf?.full_name || partnerUsername || 'Compa Larvaz',
                  participant_avatar: foundProf?.avatar_url || '',
                  last_message: incoming.content,
                  last_message_at: incoming.created_at,
                  unread_count: isFromMe ? 0 : 1,
                  is_online: true,
                };
                return [newC, ...prev];
              }
            });
          } catch (e) {
            console.warn('Error en dm broadcast:', e);
          }
        })
        .subscribe();
      broadcastChannelRef.current = broadcastChannel;
    }

    // ── Heartbeat periódico cada 3.5s mientras la pantalla de mensajes esté abierta ──
    const intervalId = setInterval(fetchRelayMessages, 3500);

    return () => {
      clearInterval(intervalId);
      if (broadcastChannel && supabase) {
        supabase.removeChannel(broadcastChannel);
        broadcastChannelRef.current = null;
      }
    };
  }, [currentUser.id, currentUser.username]);

  // Handle auto-open by query param ?user=username (solo abre una vez por parámetro)
  useEffect(() => {
    if (targetUserParam && hasAutoOpenedRef.current !== targetUserParam) {
      const match = availableProfiles.find(
        (p) =>
          p.username.toLowerCase() === targetUserParam.toLowerCase() ||
          p.id.toLowerCase() === targetUserParam.toLowerCase()
      );
      if (match) {
        hasAutoOpenedRef.current = targetUserParam;
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

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === activeConv.id);
      if (exists) {
        return prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
            : c
        );
      } else {
        return [
          {
            ...activeConv,
            last_message: msg.content,
            last_message_at: msg.created_at,
          },
          ...prev,
        ];
      }
    });
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

    // ── Persist cross-device via API route + Broadcast en Vivo ──
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          let senderId = currentUser.id;
          const supabase = createClient();
          if (supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
              senderId = sessionData.session.user.id;
            }
          }

          const payload = {
            msg_id: msg.id,
            ts: msg.created_at,
            sender_id: senderId,
            sender_username: currentUser.username,
            sender_name: currentUser.full_name,
            sender_avatar: currentUser.avatar_url,
            recipient_id: activeConv.participant_id,
            recipient_username: activeConv.participant_username,
            text: msg.content,
            conv_id: activeConv.id,
          };

          // 1. Broadcast en vivo a todos los dispositivos por Supabase WebSocket (reutilizando canal activo sin leaks)
          if (broadcastChannelRef.current) {
            try {
              await broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'dm',
                payload,
              });
            } catch (err) {
              console.warn('Error en broadcast send:', err);
            }
          }

          // 2. Persistir en la base de datos
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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

  if (!mounted) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center rounded-2xl border border-surface-border bg-surface mx-4 md:mx-6 mb-4">
        <div className="flex flex-col items-center gap-3 text-content-muted text-xs">
          <div className="w-6 h-6 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          <span>Cargando mensajes directos...</span>
        </div>
      </div>
    );
  }

  if (currentUser.is_guest) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center rounded-2xl border-2 border-acid/40 bg-surface shadow-2xl mx-4 md:mx-6 mb-4 p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-acid/15 border border-acid/40 flex items-center justify-center mx-auto text-acid shadow-acid-sm">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-magenta/15 border border-magenta/30 text-magenta text-[10px] font-mono font-bold uppercase">
              MODO OBSERVADOR — ACCESO RESTRINGIDO
            </span>
            <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
              CASILLA DE MENSAJES PRIVADOS
            </h1>
            <p className="text-xs text-content-secondary leading-relaxed">
              Los visitantes no logueados están únicamente en modo observador y no pueden enviar ni recibir mensajes privados. Iniciá sesión o registrate gratis para escribirte con cualquier artista de Larvaz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-acid text-background font-black text-xs shadow-acid-glow hover:bg-acid-hover transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-surface-elevated border border-acid/40 hover:border-acid text-content-primary font-bold text-xs transition-all"
            >
              Crear Cuenta Gratis
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
