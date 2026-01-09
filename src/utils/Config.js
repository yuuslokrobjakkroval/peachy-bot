const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ debug: false });

const channel = {
    // PEACH AND GOMA CATEGORIES
    welcome: '1459236704060838023',
    announcement: '1459244590128169144',
    rule: '1459236704060838026',
    role: '1459236704060838027',
    booster: '13067871590814592367040608380288562238',
    inviteTracker: '1459236704060838029',
    goodbye: '1459236704060838030',

    // PUBLIC CATEGORIES
    chat: '1459236704060838032',

    // BIRTHDAY AND VOTE
    reward: '1459236704975192269',

    // DONATION CATEGORIES
    giveaways: '1459236704975192272',

    // LOGGER CATEGORIES
    log: '1459236708473241630',
    logAll: '1459236708473241631',
    logAdmin: '1459236708473241632',
    logBalance: '1459236708473241633',
    logGame: '1459236708473241634',
    logGiveaways: '1459236708473241635',
    logGambling: '1459236708473241636',
    logShop: '1459236708473241637',
    logUtility: '1459236708473241638',
    logWork: '1459236708473241639',
    logAnimal: '1459236708770910350',
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
    guildId: process.env.GUILD_ID ?? '1459236701904834628',
    testGuildId: process.env.TEST_GUILD_ID ?? '1447158253967638590',
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
