# Slink - Mobile Chat App

A React Native mobile chat application with Express.js backend.

## Tech Stack

**Frontend:** React Native, TypeScript, Redux Toolkit, RTK Query, Socket.io Client, Zod

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, Zod

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas URI
- Android Studio / Xcode for mobile development

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
DATABASE_URL=mongodb://localhost:27017/slink
JWT_SECRET=your-secret-key-here
PORT=3000
```

Run the server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd slink
npm install
npx react-native run-android
# or
npx react-native run-ios
```

Update `src/config/env.ts` with your backend URL:

```ts
export const env = {
  API_URL: 'http://10.0.2.2:3000/api',  // Android emulator
  SOCKET_URL: 'http://10.0.2.2:3000',
};
```

---

## Cron Jobs

The app includes a background cron job that permanently deletes user accounts 15 days after a delete request.

The cron runs **in-process** using `setInterval` (every 1 hour). It starts automatically when the server starts — no external cron service needed.

File: `src/cron/deletion.js`

---

## Deployment

### Deploy on Render

Render runs your app as a single process. The cron is built into the server, so it runs automatically.

#### Steps:

1. **Create a Web Service** on [render.com](https://render.com)

2. **Settings:**
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Environment: `Node`

3. **Environment Variables:**
   ```
   DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/slink
   JWT_SECRET=your-production-secret
   PORT=3000
   ```

4. **Important:** Render free tier spins down after 15 min of inactivity. The cron won't run when the service is sleeping.

   **Solutions:**
   - Use Render's **paid plan** (Starter $7/mo) to keep the service always running
   - Or use an external pinger like [UptimeRobot](https://uptimerobot.com) to ping your `/health` endpoint every 14 minutes

5. **For dedicated cron on Render (alternative):**
   
   Create a separate **Background Worker** service:
   
   ```bash
   # Start Command for the worker
   node src/cron/standalone.js
   ```

   Create `src/cron/standalone.js`:
   ```js
   require('dotenv').config();
   const mongoose = require('mongoose');
   const { runDeletionCron } = require('./deletion');

   mongoose.connect(process.env.DATABASE_URL).then(() => {
     console.log('Cron worker connected to MongoDB');
     runDeletionCron();
   });
   ```

---

### Deploy on AWS EC2

#### Option 1: In-Process Cron (Recommended for single instance)

The cron runs inside the same Node.js process. Just deploy and run normally.

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone repo
git clone https://github.com/your-repo/mobile-chat-app.git
cd mobile-chat-app/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Add your DATABASE_URL, JWT_SECRET, PORT

# Run with PM2 (production process manager)
npm install -g pm2
pm2 start src/index.js --name slink-backend
pm2 save
pm2 startup  # Auto-start on reboot
```

The cron runs automatically inside the Node.js process managed by PM2.

#### Option 2: System Crontab (For separate cron process)

If you want to run the deletion job as a separate scheduled task:

```bash
# Create a standalone cron script
cat > /home/ec2-user/mobile-chat-app/backend/run-cron.js << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const ProfileLike = require('./src/models/profileLike.model');
const ChatBlock = require('./src/models/chatBlock.model');

async function run() {
  await mongoose.connect(process.env.DATABASE_URL);
  const now = new Date();
  const usersToDelete = await User.find({
    status: 'deleted',
    deletionScheduledAt: { $lte: now },
  }).select('_id');

  if (usersToDelete.length === 0) {
    console.log('No accounts to delete');
    process.exit(0);
  }

  const userIds = usersToDelete.map((u) => u._id);
  await User.updateMany(
    { _id: { $in: userIds } },
    { name: 'Deleted User', email: '', phone: '', password: '', bio: '', interests: [], city: '', isProfileCompleted: false, status: 'deleted', isDeactivated: true }
  );
  await ProfileLike.deleteMany({ $or: [{ liker: { $in: userIds } }, { liked: { $in: userIds } }] });
  await ChatBlock.deleteMany({ $or: [{ blocker: { $in: userIds } }, { blocked: { $in: userIds } }] });
  console.log(`Deleted ${userIds.length} accounts`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
EOF

# Add to system crontab (runs every hour)
crontab -e
```

Add this line:

```
0 * * * * cd /home/ec2-user/mobile-chat-app/backend && /usr/bin/node run-cron.js >> /var/log/slink-cron.log 2>&1
```

#### Option 3: AWS CloudWatch Events + Lambda (Serverless)

For a fully managed solution without running a cron on EC2:

1. Create a Lambda function with the deletion logic
2. Set up a CloudWatch EventBridge rule to trigger it every hour
3. Lambda connects to your MongoDB and processes deletions

```
EventBridge Rule (rate: 1 hour) → Lambda → MongoDB
```

---

### EC2 Security Group Settings

Ensure these ports are open:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 3000 | TCP | 0.0.0.0/0 | API + Socket.io |
| 80 | TCP | 0.0.0.0/0 | Nginx (if using reverse proxy) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (if using SSL) |

### Nginx Reverse Proxy (Recommended for EC2)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name, email, phone, password) |
| POST | `/api/auth/login` | Login (email, password) |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/profile/complete` | Complete profile setup |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users?page=1&limit=10&filter=all&gender=all&sortBy=likes` | Get users feed |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/list` | Get conversations list |
| GET | `/api/chat/messages/:userId` | Get messages with a user |

### Like
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/like/profile` | Like a profile `{ userId }` |
| GET | `/api/like/profile/:userId` | Check if liked |
| POST | `/api/like/message` | Like a message `{ messageId }` |

### Block
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/block` | Block user `{ userId }` |
| GET | `/api/block/:userId` | Check block status |

### Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/account/deactivate` | Deactivate account |
| POST | `/api/account/delete` | Schedule account deletion (15 days) |
| GET | `/api/account/blocked` | Get blocked users list |
| POST | `/api/account/unblock` | Unblock user `{ userId }` |

### Socket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | `{ receiverId, text }` |
| `messageSent` | Server → Client | Message saved confirmation |
| `newMessage` | Server → Client | Incoming message |
| `onlineUsers` | Server → Client | List of online user IDs |

---

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── cron/            # Background jobs
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # Business logic (discovery)
│   ├── socket/          # Socket.io setup
│   ├── utils/           # DB, JWT helpers
│   ├── validators/      # Zod schemas
│   └── index.js         # Entry point
├── .env
└── package.json

slink/
├── src/
│   ├── components/      # Reusable UI components
│   ├── config/          # Theme, env
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # Socket service
│   ├── store/           # Redux + RTK Query
│   └── utils/           # Validation schemas
├── App.tsx
└── package.json
```
