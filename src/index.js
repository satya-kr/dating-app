require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./utils/db');
const { initSocket } = require('./socket');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const usersRoutes = require('./routes/users.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const discoveryRoutes = require('./routes/discovery.routes');
const likeRoutes = require('./routes/like.routes');
const blockRoutes = require('./routes/block.routes');
const accountRoutes = require('./routes/account.routes');
const cityRoutes = require('./routes/city.routes');
const { runDeletionCron } = require('./cron/deletion');

const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', discoveryRoutes);
app.use('/api/like', likeRoutes);
app.use('/api/block', blockRoutes);
app.use('/api/account', accountRoutes);
app.use('/api', cityRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

connectDB().then(() => {
  initSocket(io);
  runDeletionCron();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
