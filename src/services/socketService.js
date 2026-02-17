const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        if (process.env.NODE_ENV === 'development') console.log('✅ New client connected:', socket.id);

        // 1. Join Room (User ID)
        socket.on('join', (userId) => {
            if (!userId) return;
            socket.join(userId);
            if (process.env.NODE_ENV === 'development') console.log(`🔌 Socket ${socket.id} joined USER room: ${userId}`);
        });

        // 2. Join Admin Room
        socket.on('join_admin', () => {
            socket.join('admin_room');
            if (process.env.NODE_ENV === 'development') console.log(`👨‍💼 Socket ${socket.id} joined ADMIN ROOM`);
        });

        // 3. Typing Events (Strict)
        // User starts typing -> Admin sees it
        socket.on('typing_user', (userId) => {
            io.to('admin_room').emit('typing', { userId, isTyping: true });
        });

        // Admin starts typing -> User sees it
        socket.on('typing_admin', (userId) => {
            io.to(userId).emit('typing', { isAdmin: true, isTyping: true });
        });

        // User stops typing
        socket.on('stop_typing_user', (userId) => {
            io.to('admin_room').emit('typing', { userId, isTyping: false });
        });

        // Admin stops typing
        socket.on('stop_typing_admin', (userId) => {
            io.to(userId).emit('typing', { isAdmin: true, isTyping: false });
        });

        socket.on('disconnect', () => {
            if (process.env.NODE_ENV === 'development') console.log('❌ Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
