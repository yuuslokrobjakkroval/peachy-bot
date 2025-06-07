const dotenv = require("dotenv");

dotenv.config();

const path = require("path");

const channel = {
  // PEACH AND GOMA CATEGORIES
  welcome: "1299416615275987025",
  announcement: "1272595713125126176",
  rule: "1271685845165936722",
  role: "1271685845165936723",
  booster: "1306787159088562238",
  inviteTracker: "1299416717293781124",
  goodbye: "1299416504575459380",

  // PUBLIC CATEGORIES
  chat: "1271685845165936729",

  // BIRTHDAY AND VOTE
  reward: "1318939462323011635",

  // DONATION CATEGORIES
  giveaways: "1283713873878450239",

  // LOGGER CATEGORIES
  log: "1289803142606622771",
  logAll: "1278729169340993721",
  logAdmin: "1380904402335826000",
  logBalance: "1278728739760640093",
  logShop: "1287322335724044350",
  logGame: "1278728844110598195",
  logGambling: "1280343485731442784",
  logGiveaways: "1299316476083441675",
  logUtility: "1293964183913758790",
  logWork: "1311522502484426772",
  logAnimal: "1354804021063450730",
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
  env: process.env.NODE_ENV ?? "PRODUCTION",
  token: process.env.TOKEN,
  prefix: process.env.PREFIX,
  guildId: process.env.GUILD_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  channel,
  logChannelId,
  owners: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(",") : [],
  bankAccount: process.env.BANKACCOUNT_ID
    ? process.env.BANKACCOUNT_ID
    : "1260261937292247070",
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
  botStatus: "online",
  botActivityType: 4,
  maintainer: "KYUU",
  production: Boolean(process.env.PRODUCTION) || true,
  keepAlive: Boolean(process.env.KEEP_ALIVE) || false,
  language: {
    defaultLocale: "en", // "en" = default language
    directory: path.resolve("./src/languages"), // <= location of language
  },
  links: {
    banner: "https://i.imgur.com/fFqwcK2.gif",
    support: "https://discord.gg/peachygang",
    invite: `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}`,
    vote: `https://top.gg/bot/${process.env.CLIENT_ID}/vote`,
    dashboard: `https://peachy-gang-dashboard.vercel.app`,
    facebook: `https://web.facebook.com/profile.php?id=61568712312805`,
  },
};
