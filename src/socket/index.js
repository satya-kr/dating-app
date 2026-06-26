const { verifyToken } = require('../utils/jwt');
const Message = require('../models/message.model');
const User = require('../models/user.model');

// Map of userId -> socketId
const onlineUsers = new Map();

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    // Update lastActive
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).catch(() => {});

    // Broadcast online users to everyone
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    socket.on('sendMessage', async ({ receiverId, text }) => {
      try {
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          text,
        });

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', message);
        }
        socket.emit('messageSent', message);
      } catch (error) {
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    socket.on('connectionAccepted', ({ userId: targetUserId }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('connectionUpdate', { type: 'accepted', userId });
      }
    });

    socket.on('newConnectionRequest', ({ userId: targetUserId }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('connectionUpdate', { type: 'new_request', userId });
      }
    });

    // Video Call Signaling
    socket.on('callInitiate', ({ to, callerName, callerImage }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('incomingCall', { from: userId, callerName, callerImage });
      }
    });

    socket.on('callAccepted', ({ to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('callAccepted', { from: userId });
      }
    });

    socket.on('callRejected', ({ to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('callRejected', { from: userId });
      }
    });

    socket.on('callEnded', ({ to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('callEnded', { from: userId });
      }
    });

    socket.on('callOffer', ({ to, offer }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('callOffer', { from: userId, offer });
      }
    });

    socket.on('callAnswer', ({ to, answer }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('callAnswer', { from: userId, answer });
      }
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('iceCandidate', { from: userId, candidate });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      User.findByIdAndUpdate(userId, { lastActive: new Date() }).catch(() => {});
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = { initSocket };
