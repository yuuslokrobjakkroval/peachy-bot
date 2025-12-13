const dotenv = require('dotenv');
dotenv.config();

const path = require('path');

const channel = {
    // PEACH AND GOMA CATEGORIES
    welcome: '1299416615275987025',
    announcement: '1272595713125126176',
    rule: '1271685845165936722',
    role: '1271685845165936723',
    booster: '1306787159088562238',
    inviteTracker: '1299416717293781124',
    goodbye: '1299416504575459380',

    // PUBLIC CATEGORIES
    chat: '1370318453046775812',

    // BIRTHDAY AND VOTE
    reward: '1374630700464210010',

    // DONATION CATEGORIES
    giveaways: '1370318454653063198',

    // LOGGER CATEGORIES
    log: '1380944246609018880',
    logAll: '1380944297792372887',
    logAdmin: '1380944363370057788',
    logBalance: '1380944407808839740',
    logGame: '1380944566840197322',
    logGiveaways: '1380944604907569162',
    logGambling: '1380945140440502272',
    logShop: '1380944650101067787',
    logUtility: '1380944712625557604',
    logWork: '1380944753260232775',
    logAnimal: '1380944799623938149',
};

const logChannelId = [
    channel.logAll,
    channel.logGame,
    channel.logGambling,
    channel.logBalance,
    channel.logShop,
    channel.logUtility,
    channel.logGiveaways,
    channel.logWork,
    channel.logAnimal,
    channel.logAdmin,
];

module.exports = {
    env: process.env.NODE_ENV ?? 'PRODUCTION',
    token: process.env.TOKEN,
    prefix: process.env.PREFIX ?? 'P',
    guildId: process.env.GUILD_ID ?? '1342317947573633077',
    testGuildId: process.env.TEST_GUILD_ID ?? '1439140668558672006',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
    channel,
    logChannelId,
    owners: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
    bankAccount: process.env.BANKACCOUNT_ID ? process.env.BANKACCOUNT_ID : '966688007493140591',
    color: {
        light: 0xffffff,
        dark: 0x000000,
        danger: 0xff0000,
        success: 0x00ff00,
        blue: 0x4cc9fe,
        pink: 0xe3a1ad,
        warning: 0xffa500,
        main: 0xf582ae,
        none: 0x2b2d31,
    },
    database: process.env.DATABASE_URL,
    botStatus: 'online',
    botActivityType: 4,
    maintainer: 'KYUU',
    production: Boolean(process.env.PRODUCTION) || true,
    keepAlive: Boolean(process.env.KEEP_ALIVE) || false,
    language: {
        defaultLocale: 'en', // "en" = default language
        directory: path.resolve('./src/languages'), // <= location of language
    },
    links: {
        banner: 'https://i.imgur.com/fFqwcK2.gif',
        support: 'https://discord.gg/8ZASwPK7Hw',
        invite: `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}`,
        vote: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
        dashboard: `https://dashboard.peachyganggg.com`,
        facebook: `https://kyuu.peachyganggg.com`,
    },
};
