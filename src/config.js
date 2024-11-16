const dotenv = require('dotenv');
dotenv.config();

// THEME CONFIGURATION
// Normal
const normal = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xF582AE, none: 0x2B2D31 },
};

// PEACH
const peach = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x8BD3DD, none: 0x2B2D31 },
};

// GOMA
const goma = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x94716B, none: 0x2B2D31 },
};

// Ocean Breeze ( T01 )
const oceanBreeze = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x006BFF, none: 0x2B2D31 },
};

// Fright Fest ( T02 )
const frightFest = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xC39FC3, none: 0x2B2D31 },
};

// Boo Bash ( T03 )
const booBash = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x9B7EBD, none: 0x2B2D31 },
};

// Celestial Grace ( ST01 )
const celestialGrace = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFEEE91, none: 0x2B2D31 },
};

// SakuraSerenity ( ST02 )
const sakuraSerenity = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFFE3E3, none: 0x2B2D31 },
};

// Buzzing Bliss ( ST03 )
const buzzingBliss = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFCF596, none: 0x2B2D31 },
};

// SPIDER MAN FOR ANGKOR PARIS ( ST11 )
const spiderMan = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFF2929, none: 0x2B2D31 },
};

module.exports = { normal, peach, goma, oceanBreeze, frightFest, booBash, celestialGrace, sakuraSerenity, buzzingBliss, spiderMan }