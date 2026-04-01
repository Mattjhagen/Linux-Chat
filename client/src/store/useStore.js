import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const useStore = create((set, get) => ({
  user: null,
  accessToken: null,
  socket: null,
  channels: [],
  activeChannel: null,
  messages: [],
  onlineUsers: [],
  typingUsers: [], // { user_id, username, channel_id }

  // Auth actions
  setUser: (user) => set({ user }),
  setAccessToken: (token) => {
    set({ accessToken: token });
    // Re-initialize socket with new token
    if (token) {
      get().initSocket(token);
    }
  },

  initSocket: (token) => {
    if (get().socket) {
      get().socket.disconnect();
    }
    const socket = io(API_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
       console.log('Connected to socket');
       socket.emit('users:get_online');
    });

    socket.on('user:online', (user) => {
      set(state => ({
        onlineUsers: [...state.onlineUsers.filter(u => u.user_id !== user.user_id), user]
      }));
    });

    socket.on('user:offline', (user) => {
      set(state => ({
        onlineUsers: state.onlineUsers.filter(u => u.user_id !== user.user_id)
      }));
    });

    socket.on('users:online_list', (users) => {
      set({ onlineUsers: users });
    });

    socket.on('message:new', (message) => {
      if (message.channel_id === get().activeChannel?.id) {
         set(state => ({ messages: [...state.messages, message] }));
      }
      
      // Update unread count in channels if not active
      if (message.channel_id !== get().activeChannel?.id) {
         set(state => ({
           channels: state.channels.map(c => 
             c.id === message.channel_id ? { ...c, is_unread: 1, message_count: (c.message_count || 0) + 1 } : c
           )
         }));
      }
    });

    socket.on('user:typing', (data) => {
      set(state => ({
        typingUsers: [...state.typingUsers.filter(u => u.user_id !== data.user_id), data]
      }));
    });

    socket.on('user:stop_typing', (data) => {
      set(state => ({
        typingUsers: state.typingUsers.filter(u => u.user_id !== data.user_id)
      }));
    });

    set({ socket });
  },

  logout: () => {
    if (get().socket) get().socket.disconnect();
    set({ user: null, accessToken: null, socket: null, channels: [], activeChannel: null, messages: [] });
  },

  // Channel actions
  setChannels: (channels) => set({ channels }),
  setActiveChannel: (channel) => {
    set({ activeChannel: channel, messages: [] });
    if (get().socket) {
      get().socket.emit('channel:join', channel.id);
    }
  },

  // Message actions
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),
  
}));

export default useStore;
