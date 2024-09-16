const { GatewayIntentBits } = require('discord.js');
const config = require('./config.js');
const MagicClient = require('./structures/Client.js');

const { GuildMembers, MessageContent, GuildVoiceStates, GuildMessages, Guilds, GuildMessageTyping, GuildMessageReactions } = GatewayIntentBits;

const clientOptions = {
  intents: [Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers, GuildMessageTyping, GuildMessageReactions],
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: false,
  },
};

const client = new MagicClient(clientOptions);

client.start(config.token);
