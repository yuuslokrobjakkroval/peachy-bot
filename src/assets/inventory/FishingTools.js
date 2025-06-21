const emote = {
  fishingpole: "<:FISHINGPOLE:1355805017977917562>",
};

module.exports = [
  {
    id: "pole",
    name: "Fishing Pole",
    description: "A tool for fishing.",
    type: "tool",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 12,
    emoji: emote.fishingpole,
    available: ["use"],
    price: { buy: 10000, sell: 0 },
  },
];
