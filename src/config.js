const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  token: process.env.TOKEN,
  prefix: process.env.PREFIX,
  prefixes: process.env.PREFIXES ? process.env.PREFIXES.split(",") : ["!"],
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET || "",
  guildId: process.env.GUILD_ID,
  database: process.env.DATABASE_URL,
  users: {
    owners: process.env.OWNERS ? process.env.OWNERS.split(",") : undefined,
  },
  color: {
    red: 0xff0000,
    green: 0x00ff00,
    blue: 0x0000ff,
    yellow: 0xffff00,
    main: 0xffc0cb,
  },
  botStatus: process.env.BOT_STATUS || "online",
  botActivity: process.env.BOT_ACTIVITY || "WaveMusic",
  botActivityType: parseInt(process.env.BOT_ACTIVITY_TYPE || "2"),
  keepAlive: parseBoolean(process.env.KEEP_ALIVE) || false,
  production: parseBoolean(process.env.PRODUCTION) || true,
};

function parseBoolean(value) {
  if (typeof value === "string") {
    value = value.trim().toLowerCase();
  }
  switch (value) {
    case "true":
      return true;
    default:
      return false;
  }
}