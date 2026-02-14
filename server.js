const http = require('http');
require('dotenv').config(); // Load env vars
const app = require('./src/app');
const { initSocket } = require('./src/services/socketService');

// Validate MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing in environment variables");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
