import { Client, GatewayIntentBits} from 'discord.js';
import cron from 'node-cron';
import { pool } from './db.js';
import { runPairing } from './pair.js'
import 'dotenv/config';

const client = new Client({ intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
  ]});

 client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  cron.schedule('*/1 * * * *', async () => {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    console.log('Running monthly pairing...');
    await runPairing(client, channel);
  });
});

 client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const allowedChannelId = process.env.CHANNEL_ID;

 if (interaction.channelId !== allowedChannelId) return;

   if (interaction.commandName === 'coffee') {
    await interaction.deferReply({ flags: 64 });

    await interaction.editReply('☕ Time to connect! Pairings coming soon.');
  }
  
if (interaction.commandName === 'pair') {
  try {
    await interaction.deferReply();
    await runPairing(client, interaction.channel);
    await interaction.editReply('☕ Pairing complete!');
  } catch (error) {
    console.error(error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Something went wrong during pairing.');
    } else {
      await interaction.reply(' Something went wrong during pairing.');
    }
  }
}

  if (interaction.commandName === 'join') {
    await interaction.deferReply({ flags: 64 });
    await pool.query(
      'INSERT INTO participants(user_id) VALUES($1) ON CONFLICT DO NOTHING',
      [interaction.user.id]
    );

    await interaction.editReply('☕ You joined the coffee chat!');
  }

    if (interaction.commandName === 'leave') {
      await interaction.deferReply({ flags: 64 });
      await pool.query(
        'DELETE FROM participants WHERE user_id = $1',
        [interaction.user.id]
      );

    await interaction.editReply('👋 You left the coffee chat.');
  }

  if (interaction.commandName === 'count') {
    await interaction.deferReply({ flags: 64 });

    const result = await pool.query('SELECT COUNT(*) FROM participants');
    const count = result.rows[0].count;

    await interaction.editReply(`☕ There are currently ${count} participants in this coffee chat channel.`);
  }

});


client.login(process.env.TOKEN);