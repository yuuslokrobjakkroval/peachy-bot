const emote = {
  log: "<:WOOD:1355805141080477807>",
  soft: "<:SOFTWOOD:1355805063775522908>",
  hard: "<:HARDWOOD:1355805024428753005>",
};

module.exports = [
  {
    id: "log",
    description: "Sourced from renewable trees.",
    type: "wood",
    rarity: "rare",
    emoji: emote.log,
    price: { sell: 125 },
  },
  {
    id: "soft",
    description: "Sourced from renewable trees.",
    type: "wood",
    rarity: "common",
    emoji: emote.soft,
    price: { sell: 225 },
  },
  {
    id: "hardlog",
    description: "Sourced from renewable trees.",
    type: "wood",
    rarity: "legendary",
    emoji: emote.hard,
    price: { sell: 375 },
  },
];
