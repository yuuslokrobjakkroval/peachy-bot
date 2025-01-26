const dotenv = require("dotenv");
dotenv.config();

// THEME CONFIGURATION
// Normal
const normal = {
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
};

// PEACH
const peach = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x8bd3dd,
    none: 0x2b2d31,
  },
};

// GOMA
const goma = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x94716b,
    none: 0x2b2d31,
  },
};

// ------------------------------------------------------------------------------------------------------------------------------------------------------------- //

// Ocean Breeze ( T01 )
const oceanBreeze = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xc9e6f0,
    none: 0x2b2d31,
  },
};

// Fright Fest ( T02 )
const frightFest = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xc39fc3,
    none: 0x2b2d31,
  },
};

// Boo Bash ( T03 )
const booBash = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x9b7ebd,
    none: 0x2b2d31,
  },
};

// Jingle Jolly ( T04 )
const jingleJolly = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xf1f0e8,
    none: 0x2b2d31,
  },
};

// Festive Frost ( T05 )
const festiveFrost = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x81bfda,
    none: 0x2b2d31,
  },
};

// Mystic Realms ( T06 )
const mysticRealm = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xf6ded8,
    none: 0x2b2d31,
  },
};

// ------------------------------------------------------------------------------------------------------------------------------------------------------------- //

// Celestial Grace ( ST01 )
const celestialGrace = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xfeee91,
    none: 0x2b2d31,
  },
};

// SakuraSerenity ( ST02 )
const sakuraSerenity = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xffe3e3,
    none: 0x2b2d31,
  },
};

// Buzzing Bliss ( ST03 )
const buzzingBliss = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xfcf596,
    none: 0x2b2d31,
  },
};

// Froggy Fun ( ST04 )
const froggyFun = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xc2ffc7,
    none: 0x2b2d31,
  },
};

// ASleepy Peach ( ST05 )
const aSleepyPeach = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xf29f58,
    none: 0x2b2d31,
  },
};

// Magical Forest ( ST06 )
const magicalForest = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x74c5ec,
    none: 0x2b2d31,
  },
};

// Matcha Latte ( ST07 )
const matchaLatte = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xbdcaa6,
    none: 0x2b2d31,
  },
};

// Dark Academia ( ST08 )
const darkAcademia = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x9f5255,
    none: 0x2b2d31,
  },
};

// Spring Bear ( ST09 )
const springBear = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xbcebd7,
    none: 0x2b2d31,
  },
};

// Fantasy RPG ( ST10 )
const fantasyRpg = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xe8f9ff,
    none: 0x2b2d31,
  },
};

// SPIDER MAN FOR ANGKOR PARIS ( ST11 )
const spiderMan = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xff2929,
    none: 0x2b2d31,
  },
};

// CUCUMBER FOR SUPPORTER ( ST12 )
const cucumberCool = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x9edf9c,
    none: 0x2b2d31,
  },
};

// CAPPUCCINO FOR SUPPORTER ( ST13 )
const cappuccinoCharm = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xb6a28e,
    none: 0x2b2d31,
  },
};

// CAPPUCCINO V2 FOR SUPPORTER ( ST14 )
const nithGojo = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x564a94,
    none: 0x2b2d31,
  },
};

// YUNA FOR SUPPORTER ( ST1801 )
const yuna = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xffcce1,
    none: 0x2b2d31,
  },
};

// YUNA V2 FOR SUPPORTER ( ST0118 )
const yunayuna = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x4c585b,
    none: 0x2b2d31,
  },
};

// BABE OWNER FOR LOVE ( ST99 )
const quirkyQuackers = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xf5f0cd,
    none: 0x2b2d31,
  },
};

// OWNER FOR ANNIVERSARY ( ST2707 )
const keoyuu = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xffcfcf,
    none: 0x2b2d31,
  },
};

// BOOSTER FOR SUPPORTER ( ST168 )
const loveBunnie = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xedb7c9,
    none: 0x2b2d31,
  },
};

// PHY FOR SUPPORTER ( ST168 )
const ghastlyGrins = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xa294f9,
    none: 0x2b2d31,
  },
};

// REACH FOR SUPPORTER ( ST2111 )
const seaCoral = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x577bc1,
    none: 0x2b2d31,
  },
};

// FOR SALE ( ST1111 )
const enchantedCatLake = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0x9f8383,
    none: 0x2b2d31,
  },
};

// FOR SALE ( ST2601 )
const yuyuzu = {
  color: {
    light: 0xffffff,
    dark: 0x000000,
    danger: 0xff0000,
    success: 0x00ff00,
    blue: 0x4cc9fe,
    pink: 0xe3a1ad,
    warning: 0xffa500,
    main: 0xFCC6FF,
    none: 0x2b2d31,
  },
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
  yuyuzu,
};
