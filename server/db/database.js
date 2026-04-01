import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '../data');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'linuxhub.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const initDb = () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('Database initialized with schema.');

  seedDefaults();
};

const seedDefaults = () => {
  const channels = [
    { name: 'general', slug: 'general', description: 'General chat for everyone', type: 'text' },
    { name: 'announcements', slug: 'announcements', description: 'Important updates', type: 'announcements' },
    { name: 'hardware', slug: 'hardware', description: 'Hardware discussion', type: 'text' },
    { name: 'software', slug: 'software', description: 'Software discussion', type: 'text' },
    { name: 'off-topic', slug: 'off-topic', description: 'Non-Linux talk', type: 'text' },
  ];

  const insertChannel = db.prepare(`
    INSERT OR IGNORE INTO channels (name, slug, description, type)
    VALUES (@name, @slug, @description, @type)
  `);

  const transaction = db.transaction((channels) => {
    for (const channel of channels) {
      insertChannel.run(channel);
    }
  });

  transaction(channels);
  console.log('Default channels seeded.');

  // Create system user if not exists
  const systemUser = db.prepare('SELECT * FROM users WHERE username = ?').get('system');
  if (!systemUser) {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, is_admin, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('system', 'system@linuxhub.local', 'SYSTEM_ACCOUNT', 'System', 1, '#6366f1');
    
    // Add welcome message
    const generalChannel = db.prepare('SELECT id FROM channels WHERE slug = ?').get('general');
    if (generalChannel) {
      const welcomeContent = "Welcome to LinuxHub! Use **markdown** in your messages. Type `/help` to see supported formatting.";
      db.prepare(`
        INSERT INTO messages (channel_id, user_id, content, content_html)
        VALUES (?, (SELECT id FROM users WHERE username = 'system'), ?, ?)
      `).run(generalChannel.id, welcomeContent, welcomeContent);
    }
  }
};

const createAdmin = async (email, username, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, is_admin, avatar_color)
    VALUES (?, ?, ?, ?, 1, '#ef4444')
  `).run(username, email, hashedPassword, username);
  
  return result;
};

// Check if running directly to prompt for admin
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDb();
  
  const users = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 1 AND username != 'system'").get();
  
  if (users.count === 0) {
    console.log('\n--- FIRST ADMIN SETUP ---');
    console.log('No admin users found. Please use the server API or an interactive tool to create one,');
    console.log('or run this script with arguments: node database.js <email> <username> <password>');
    
    if (process.argv.length === 5) {
      const [,, email, username, password] = process.argv;
      createAdmin(email, username, password)
        .then(() => console.log(`Admin user ${username} created successfully!`))
        .catch(err => console.error('Error creating admin:', err.message));
    }
  }
}

export default db;
export { initDb, createAdmin };
