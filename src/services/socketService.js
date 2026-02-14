const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Configure for production with specific origins
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // Join user room with data object
        socket.on('join', (data) => {
            const { userId } = data;
            if (userId) {
                socket.join(userId);
                console.log(`👤 Socket ${socket.id} joined user room: ${userId}`);
                socket.emit('joined', { userId, success: true });
            }
        });

        // Join tenant room
        socket.on('join_tenant', (data) => {
            const { tenantId } = data;
            if (tenantId) {
                socket.join(tenantId);
                console.log(`🏢 Socket ${socket.id} joined tenant: ${tenantId}`);
            }
        });

        // Join conversation room
        socket.on('join_conversation', (data) => {
            const { conversationId } = data;
            if (conversationId) {
                socket.join(conversationId);
                // The original instruction had `User ${userId}` here, but userId is not available in this scope.
                // Reverting to original log format or assuming userId would be passed in data.
                // For now, keeping original log format for consistency and correctness.
                console.log(`💬 Socket ${socket.id} joined conversation: ${conversationId}`);
            }
        });

        // Typing events
        socket.on('typing', (data) => {
            const { conversationId, userId, name } = data; // Assuming userId and name are passed in data
            if (conversationId && userId) {
                socket.to(conversationId).emit('typing', {
                    conversationId,
                    userId,
                    name: name || (socket.user ? socket.user.name : 'Unknown User') // Fallback if socket.user is set by middleware
                });
                console.log(`✍️ User ${userId} is typing in conversation ${conversationId}`);
            }
        });

        socket.on('stop_typing', (data) => {
            const { conversationId, userId } = data; // Assuming userId is passed in data
            if (conversationId && userId) {
                socket.to(conversationId).emit('stop_typing', {
                    conversationId,
                    userId
                });
                console.log(`✋ User ${userId} stopped typing in conversation ${conversationId}`);
            }
        });

        // Legacy support for old join_user event
        socket.on('join_user', (userId) => {
            if (userId) {
                socket.join(userId);
                console.log(`👤 Socket ${socket.id} joined user (legacy): ${userId}`);
            }
        });

        // Handle Chat Messages with acknowledgment
        socket.on('send_message', async (data, callback) => {
            try {
                const { senderId, receiverId, content, tenantId, timestamp } = data;

                if (!senderId || !receiverId || !content) {
                    console.error('❌ Invalid message data:', data);
                    if (callback) callback({ success: false, error: 'Invalid data' });
                    return;
                }

                // Save to DB
                const Message = require('../models/Message');
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    tenantId,
                    createdAt: timestamp || new Date()
                });

                const messageData = {
                    id: newMessage._id.toString(),
                    sender: newMessage.sender,
                    receiver: newMessage.receiver,
                    content: newMessage.content,
                    createdAt: newMessage.createdAt,
                    tenantId: newMessage.tenantId
                };

                // Emit to receiver
                io.to(receiverId).emit('receive_message', messageData);

                // Emit back to sender (for confirmation and other devices)
                io.to(senderId).emit('receive_message', messageData);

                console.log(`💬 Message sent: ${senderId} → ${receiverId}`);

                // Send acknowledgment
                if (callback) {
                    callback({
                        success: true,
                        messageId: newMessage._id.toString()
                    });
                }

            } catch (error) {
                console.error('❌ Socket Chat Error:', error);
                if (callback) {
                    callback({ success: false, error: error.message });
                }
            }
        });

        // Support Chat Events
        socket.on('join_support', (data) => {
            const { userId, role } = data;
            if (role === 'admin') {
                socket.join('admin_support');
                console.log(`👨‍💼 Admin ${userId} joined support room`);
            } else if (userId) {
                socket.join(`support_${userId}`);
                console.log(`👤 User ${userId} joined support room`);
            }
        });

        socket.on('send_support_message', async (data, callback) => {
            try {
                const { conversationId, senderId, senderRole, message } = data;

                if (!conversationId || !senderId || !message) {
                    console.error('❌ Invalid support message data:', data);
                    if (callback) callback({ success: false, error: 'Invalid data' });
                    return;
                }

                const SupportMessage = require('../models/SupportMessage');
                const SupportConversation = require('../models/SupportConversation');

                const supportMessage = await SupportMessage.create({
                    conversationId,
                    senderId,
                    senderRole,
                    message
                });

                await SupportConversation.findByIdAndUpdate(conversationId, {
                    lastMessageAt: new Date()
                });

                await supportMessage.populate('senderId', 'name email role');

                const messageData = {
                    _id: supportMessage._id.toString(),
                    conversationId: supportMessage.conversationId,
                    senderId: supportMessage.senderId,
                    senderRole: supportMessage.senderRole,
                    message: supportMessage.message,
                    createdAt: supportMessage.createdAt
                };

                const conversation = await SupportConversation.findById(conversationId);

                if (senderRole === 'user') {
                    io.to('admin_support').emit('new_support_message', messageData);
                } else {
                    io.to(`support_${conversation.userId}`).emit('new_support_message', messageData);
                }

                if (callback) callback({ success: true, message: messageData });

                console.log(`✅ Support message sent in conversation ${conversationId}`);
            } catch (error) {
                console.error('❌ Error sending support message:', error);
                if (callback) callback({ success: false, error: error.message });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('⚠️ Socket error:', error);
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

// Emit notification to specific user
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
        console.log(`📤 Emitted ${event} to user ${userId}`);
    }
};

// Emit to tenant
const emitToTenant = (tenantId, event, data) => {
    if (io) {
        io.to(tenantId).emit(event, data);
        console.log(`📤 Emitted ${event} to tenant ${tenantId}`);
    }
};

module.exports = { initSocket, getIo, emitToUser, emitToTenant };
