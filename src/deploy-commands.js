import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

const commands = [
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join the coffee chat'),

  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the coffee chat'),

  new SlashCommandBuilder()
    .setName('pair')
    .setDescription('You will be paired in this month'),

  new SlashCommandBuilder()
    .setName('coffee')
    .setDescription('Start coffee chat vibes ☕')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVER_ID),
  { body: commands },
);

// console.log('✅ Slash commands registered!');