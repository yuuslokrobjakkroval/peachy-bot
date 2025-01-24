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

// ------------------------------------------------------------------------------------------------------------------------------------------------------------- //

// Ocean Breeze ( T01 )
const oceanBreeze = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xC9E6F0, none: 0x2B2D31 },
};

// Fright Fest ( T02 )
const frightFest = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xC39FC3, none: 0x2B2D31 },
};

// Boo Bash ( T03 )
const booBash = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x9B7EBD, none: 0x2B2D31 },
};

// Jingle Jolly ( T04 )
const jingleJolly = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xF1F0E8, none: 0x2B2D31 },
};

// Festive Frost ( T05 )
const festiveFrost = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x81BFDA, none: 0x2B2D31 },
};

// Mystic Realms ( T06 )
const mysticRealm = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xF6DED8, none: 0x2B2D31 },
};

// ------------------------------------------------------------------------------------------------------------------------------------------------------------- //

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

// Froggy Fun ( ST04 )
const froggyFun = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xC2FFC7, none: 0x2B2D31 },
};

// ASleepy Peach ( ST05 )
const aSleepyPeach = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xF29F58, none: 0x2B2D31 },
};

// Magical Forest ( ST06 )
const magicalForest = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x74C5EC, none: 0x2B2D31 },
};

// Matcha Latte ( ST07 )
const matchaLatte = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xBDCAA6, none: 0x2B2D31 },
};

// Dark Academia ( ST08 )
const darkAcademia = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x9F5255, none: 0x2B2D31 },
};

// Spring Bear ( ST09 )
const springBear = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xBCEBD7, none: 0x2B2D31 },
};

// Fantasy RPG ( ST10 )
const fantasyRpg = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xE8F9FF, none: 0x2B2D31 },
};

// SPIDER MAN FOR ANGKOR PARIS ( ST11 )
const spiderMan = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFF2929, none: 0x2B2D31 },
};

// CUCUMBER FOR SUPPORTER ( ST12 )
const cucumberCool = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x9EDF9C, none: 0x2B2D31 },
};

// CAPPUCCINO FOR SUPPORTER ( ST13 )
const cappuccinoCharm = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xB6A28E, none: 0x2B2D31 },
};

// CAPPUCCINO V2 FOR SUPPORTER ( ST14 )
const nithGojo = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x564A94, none: 0x2B2D31 },
};

// YUNA FOR SUPPORTER ( ST1801 )
const yuna = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFFCCE1, none: 0x2B2D31 },
};

// YUNA V2 FOR SUPPORTER ( ST0118 )
const yunayuna = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x4C585B, none: 0x2B2D31 },
};

// BABE OWNER FOR LOVE ( ST99 )
const quirkyQuackers = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xF5F0CD, none: 0x2B2D31 },
};

// OWNER FOR ANNIVERSARY ( ST2707 )
const keoyuu = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xFFCFCF, none: 0x2B2D31 },
};

// BOOSTER FOR SUPPORTER ( ST168 )
const loveBunnie = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xEDB7C9, none: 0x2B2D31 },
};

// PHY FOR SUPPORTER ( ST168 )
const ghastlyGrins = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0xA294F9, none: 0x2B2D31 },
};

// REACH FOR SUPPORTER ( ST2111 )
const seaCoral = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x577BC1, none: 0x2B2D31 },
};

// FOR SALE ( ST1111 )
const enchantedCatLake = {
  color: { light: 0xFFFFFF, dark: 0x000000, danger: 0xFF0000, success: 0x00FF00, blue: 0x4CC9FE, pink: 0xE3A1AD, warning: 0xFFA500, main: 0x9F8383, none: 0x2B2D31 },
};

module.exports = {
  normal,
  peach,
  goma,
  // ---------- //
  // THEME
  oceanBreeze,
  frightFest,
  booBash,
  jingleJolly,
  festiveFrost,
  mysticRealm,
  // ---------- //
  // SPECIAL THEME
  celestialGrace,
  sakuraSerenity,
  buzzingBliss,
  froggyFun,
  aSleepyPeach,
  magicalForest,
  matchaLatte,
  darkAcademia,
  springBear,
  fantasyRpg,

  // ---------- //
  // SUPPORTER THEME
  spiderMan,
  cucumberCool,
  cappuccinoCharm,
  nithGojo,
  yuna,
  yunayuna,
  quirkyQuackers,
  keoyuu,
  loveBunnie,
  ghastlyGrins,
  seaCoral,

  // ---------- //
  // SELL THEME
  enchantedCatLake,
}