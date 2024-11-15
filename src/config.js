const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  guildId: process.env.GUILD_ID,
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xF8D1D7, none: 0x2B2D31 },
};

