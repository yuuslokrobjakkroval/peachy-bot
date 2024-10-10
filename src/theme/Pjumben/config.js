const dotenv = require('dotenv');

dotenv.config();

const path = require('path');

const logChannelAll = '1278729169340993721';
const logChannelGame = '1278728844110598195';
const logChannelGambling = '1280343485731442784';
const logChannelBalance = '1278728739760640093';
const logChannelShop = '1287322335724044350';
const logChannelUtility = '1293964183913758790';

const logChannelId = [logChannelAll, logChannelGame, logChannelGambling, logChannelBalance, logChannelShop, logChannelUtility]

const birthdayPeachyChannelId = '1272074580797952116';

const birthdayChannelId = [birthdayPeachyChannelId];

module.exports = {
    token: process.env.TOKEN,
    prefix: process.env.PREFIX,
    guildId: process.env.GUILD_ID,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    logChannelId,
    birthdayChannelId,
    owners: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
    color: { red: 0xFF0000, green: 0x00FF00, blue: 0xFFB0F2, pink: 0xE3A1AD, orange: 0xFFA500, main: 0xFFA751, none: 0x2B2D31 },
    database: process.env.DATABASE_URL,
    botStatus: 'online',
    botActivityType: 4,
    production: parseBoolean(process.env.PRODUCTION) || true,
    keepAlive: parseBoolean(process.env.KEEP_ALIVE) || false,
    language: {
        defaultLocale: 'en', // "en" = default language
        directory: path.resolve('./src/languages'), // <= location of language
    },
    links: {
        banner: 'https://i.imgur.com/kYXE4No.gif',
        support: 'https://discord.gg/peachgoma',
        invite: `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&integration_type=0&scope=bot+applications.commands`,
        vote: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
        website: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
    },
};

function parseBoolean(value) {
    if (typeof value === 'string') value = value.trim().toLowerCase();
    return value === 'true' ? true : false;
}

