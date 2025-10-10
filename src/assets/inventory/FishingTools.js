const emote = {
  fishingpole: "<:FISHINGPOLE:1355805017977917562>",
  net: "🕸️",
  spear: "🔱",
  trap: "🪤",
};

module.exports = [
  {
    id: "pole",
    name: "Fishing Pole",
    description: "A basic fishing rod for catching fish.",
    type: "tool",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 15,
    emoji: emote.fishingpole,
    available: ["use"],
    price: { buy: 10000, sell: 0 },
  },
  {
    id: "net",
    name: "Fishing Net",
    description: "A net that can catch multiple fish at once.",
    type: "tool",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 10,
    emoji: emote.net,
    available: ["use"],
    price: { buy: 15000, sell: 0 },
  },
  {
    id: "spear",
    name: "Fishing Spear",
    description: "A spear for precision fishing of rare fish.",
    type: "tool",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 8,
    emoji: emote.spear,
    available: ["use"],
    price: { buy: 25000, sell: 0 },
  },
  {
    id: "trap",
    name: "Fish Trap",
    description: "An automatic trap that catches fish over time.",
    type: "tool",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 5,
    emoji: emote.trap,
    available: ["use"],
    price: { buy: 50000, sell: 0 },
  },
];
