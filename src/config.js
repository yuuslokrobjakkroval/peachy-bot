const dotenv = require('dotenv');

dotenv.config();

const path = require('path');

const logChannelAll = '1285248453571776522';
const logChannelBalance = '1285248582630244454';
const logChannelGambling = '1285244924844965919';

const logChannelId = [logChannelAll, logChannelBalance, logChannelGambling]

module.exports = {
  token: process.env.TOKEN,
  prefix: process.env.PREFIX,
  guildId: process.env.GUILD_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  logChannelId,
  owners: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
  color: { danger: 0xFF0000, success: 0x00FF00, primary: 0x0023FF, tied: 0x877D7D, secondary: 0xE3A1AD, warning: 0xFFA500, main: 0xF582AE, none: 0x2B2D31 },
  database: process.env.DATABASE_URL,
  botStatus: 'online',
  botActivityType: 4,
  production: parseBoolean(process.env.PRODUCTION) || true,
  keepAlive: parseBoolean(process.env.KEEP_ALIVE) || false,
  language: {
    defaultLocale: 'en-US', // "en" = default language
    directory: path.resolve('./src/languages'), // <= location of language
  },
  links: {
    banner: 'https://i.imgur.com/yHEN3Wv.gif',
    support: 'https://discord.gg/magicrealm8888',
    invite: `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&integration_type=0&scope=bot+applications.commands`,
    vote: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
    website: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
  },
};

function parseBoolean(value) {
  if (typeof value === 'string') value = value.trim().toLowerCase();
  return value === 'true' ? true : false;
}

