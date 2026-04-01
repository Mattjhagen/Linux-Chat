# LinuxHub — Self-Hosted Community Chat Platform

A modern, full-stack, Discord-like chat application built for local Linux user groups. Designed to run on a home Ubuntu server with zero cloud dependencies.

## Features
- **Real-time Messaging**: Live chat, presence, and typing indicators via Socket.IO.
- **Markdown Support**: Full GFM support with syntax highlighting for code blocks.
- **File Uploads**: Drag-and-drop support for images, docs, and archives (up to 25MB).
- **Self-Hosted**: Powered by Node.js and a single-file SQLite database for easy backups.
- **Modern UI**: Dark mode by default, built with React and Tailwind CSS.
- **Admin Panel**: Manage channels, users, and view platform stats.

## Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Git**

## First-Time Setup

1. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `server/` directory:
   ```bash
   PORT=3001
   JWT_SECRET=your_random_secret
   REFRESH_SECRET=your_refresh_secret
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Initialize Database**:
   ```bash
   npm run init-db
   ```
   *Note: This will seed default channels and prompt to create an admin account if none exists.*

4. **Create First Admin (CLI)**:
   ```bash
   cd server
   node db/database.js admin@linuxhub.local admin password123
   ```

## Development
Run both the backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Production Deployment
1. **Build the Frontend**:
   ```bash
   cd client && npm run build
   ```
2. **Start with PM2**:
   ```bash
   cd ../server
   pm2 start ecosystem.config.js
   ```

## Local Network Access
To access LinuxHub from other devices on your LAN:
1. Find your server's local IP address:
   ```bash
   ip addr | grep "inet "
   ```
2. Access via `http://<YOUR_LOCAL_IP>:3001` (if running in production mode).

## Internet Exposure (Optional)
We recommend using **Cloudflare Tunnel** (`cloudflared`) to safely expose your local server to the internet without port forwarding:
```bash
cloudflared tunnel --url http://localhost:3001
```

## Backup & Restore
Backing up the entire platform is as simple as copying the database file:
```bash
cp server/data/linuxhub.db /backups/linuxhub_$(date +%F).db
```

---
Built for the Linux community. Open source and self-hosted.
# Linux-Chat
