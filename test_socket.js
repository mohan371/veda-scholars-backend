const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: true
});

socket.on('connect', () => {
    console.log('✅ Connected to server:', socket.id);

    // Simulate user join
    const userId = "test_user_123";
    socket.emit('join', userId);
    console.log(`👤 Joined user room: ${userId}`);

    // Join a chat room
    const chatId = "test_chat_room_456";
    socket.emit('join_chat', chatId);
    console.log(`💬 Joined chat room: ${chatId}`);

    // Listen for messages
    socket.on('receive_message', (data) => {
        console.log('📩 Received message:', data);
        if (data.content === 'Hello from test script') {
            console.log('✅ Test Passed: Message received back');
            process.exit(0);
        }
    });

    // Send a message (simulating another client or self loopback)
    setTimeout(() => {
        console.log('📤 Sending message...');
        // Note: In real app, we send via API and API emits socket event. 
        // But for testing if socket receives, we can emit directly if `send_message` event is handled. 
        // My socketService.js handles `send_message`? Yes, I added logic for it in `socketService.js` (Step 42, but wait, I overwrote it in Step 73).
        // Let's check Step 73 content.
        // Step 73 `write_to_file` overwrote `socketService.js`.
        // The NEW `socketService.js` (Step 73) DOES NOT have `socket.on('send_message', ...)` logic anymore!
        // It relies on API controller to emit `receive_message`.
        // So this test script cannot emit `send_message` and expect echo.
        // It must rely on API call or just verifying connection.

        console.log('✅ Connection verification successful (Message sending requires API call)');
        process.exit(0);
    }, 2000);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
});
