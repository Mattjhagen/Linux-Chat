import db from '../db/database.js';
import { verifyAccessToken } from '../utils/jwt.js';

const onlineUsers = new Map(); // socket.id -> { user_id, username, channel_id }

const socketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    const user = verifyAccessToken(token);
    if (!user) return next(new Error('Authentication error'));

    socket.user = user; // { id, username, isAdmin }
    next();
  });

  io.on('connection', (socket) => {
    const { id: user_id, username } = socket.user;
    
    // Add to online users
    onlineUsers.set(socket.id, { user_id, username, channel_id: null });
    
    // Mark user as seen
    db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(new Date().toISOString(), user_id);
    
    // Broadcast user joined
    io.emit('user:online', { user_id, username });
    
    // Handle joining channels
    socket.on('channel:join', (channelId) => {
      // Leave old channel rooms
      const previous = onlineUsers.get(socket.id);
      if (previous && previous.channel_id) {
        socket.leave(`channel-${previous.channel_id}`);
      }
      
      // Join new channel room
      socket.join(`channel-${channelId}`);
      onlineUsers.set(socket.id, { ...previous, channel_id: channelId });
    });

    // Handle typing indicator
    socket.on('typing:start', (channelId) => {
      socket.to(`channel-${channelId}`).emit('user:typing', { 
        user_id, 
        username, 
        channel_id: channelId 
      });
    });

    socket.on('typing:stop', (channelId) => {
      socket.to(`channel-${channelId}`).emit('user:stop_typing', { 
        user_id, 
        username, 
        channel_id: channelId 
      });
    });

    // Broadcast new message (rest API handles storage, but socket can broadcast)
    socket.on('message:send', (message) => {
       // Message is usually already in DB via REST API, but we might want to broadcast here
       // or let the REST API use the `io` instance.
       // For better consistency, the REST API should emit via io.to(`channel-${channelId}`).emit(...)
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      
      // Check if user has other connections
      const stillOnline = Array.from(onlineUsers.values()).some(u => u.user_id === user_id);
      if (!stillOnline) {
        io.emit('user:offline', { user_id, username });
      }
    });

    // Fetch online users list
    socket.on('users:get_online', () => {
      const uniqueUsers = Array.from(onlineUsers.values())
        .reduce((acc, current) => {
          if (!acc.find(item => item.user_id === current.user_id)) {
            acc.push(current);
          }
          return acc;
        }, []);
      socket.emit('users:online_list', uniqueUsers);
    });
  });
};

export { socketHandlers, onlineUsers };
