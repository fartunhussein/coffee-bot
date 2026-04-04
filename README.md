# ☕ Coffee Pair Bot

A Discord bot that automatically pairs community members for monthly coffee chats to encourage networking and interaction.

---

## ✨ Features

- 👥 Join or leave the monthly coffee pool  
- 🔀 Random pairing using Fisher–Yates shuffle  
- 🕒 Automatic monthly pairing (cron job)  
- 📩 Private DM notifications for each pair  
- 🗄 PostgreSQL database for persistence  
- ⚠️ Handles edge cases (no participants, odd numbers)

---

## 🛠 Tech Stack

- Node.js  
- discord.js (v14)  
- PostgreSQL (`pg`)  
- node-cron  
- dotenv  

---

## 🚀 Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/coffee-pair-bot.git
cd coffee-pair-bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment variables
Create a .env file in the root:
```bash
TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id
SERVER_ID=your_guild_id
CHANNEL_ID=your_channel_id
DATABASE_URL=your_postgres_connection_string
```

### 4. Set up the database
```bash
CREATE TABLE participants (
  user_id TEXT PRIMARY KEY,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pairings (
  id SERIAL PRIMARY KEY,
  user1_id TEXT,
  user2_id TEXT,
  month TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
### 5. Register the slash commands.
```bash
node deploy-commands.js
```

### 6. Run the bot
```bash
node src/index.js
```

### Commands
 - /join → Join the coffee chat
 - /leave → Leave the coffee chat
 - /pair → Manually trigger pairing
 - /coffee → Start coffee chat vibes ☕

### Future Improvements
- Prevent repeat pairings
- Add /status command 