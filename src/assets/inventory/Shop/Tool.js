module.exports = {
  name: "Tools",
  description: `Tools an item for earn coins!\n**・** \`pbuy {id}\` to buy an item`,
  type: "tool",
  inventory: [
    {
      id: "axe",
      name: "Axe",
      description: "A tool for chopping wood.",
      type: "tool",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 12,
      emoji: "<:AXE:1355804959131832441>",
      available: ["use"],
      price: { buy: 10000, sell: 0 },
    },
    {
      id: "sxe",
      name: "Stone Axe",
      description: "A tool for breaking stones.",
      type: "tool",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 12,
      emoji: "<:STONEAXE:1355805092607037450>",
      available: ["use"],
      price: { buy: 10000, sell: 0 },
    },

    {
      id: "net",
      name: "Net",
      description: "A tool for catch slime.",
      type: "tool",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 12,
      emoji: "<:NET:1355805034893541376>",
      available: ["use"],
      price: { buy: 10000, sell: 0 },
    },
  ],
};
