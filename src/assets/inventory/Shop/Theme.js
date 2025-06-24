const emoji = require("../../../utils/Emoji");

module.exports = {
  name: "Theme",
  description: `Themes to customize your embed color and emoji!\n**・** \`pbuy {id}\` to buy a theme for customization.`,
  type: "theme",
  inventory: [
    {
      id: "t01",
      name: "Ocean Breeze",
      description:
        "A calming theme that transforms your embed color to deep blues and your emoji to serene sea icons.",
      type: "theme",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.theme.oceanBreeze,
      available: ["use"],
      price: { buy: 15e6, sell: 13e6 },
    },
    {
      id: "t02",
      name: "Fright Fest",
      description:
        "Get into the spooky spirit with this Halloween-themed set, featuring eerie colors and Halloween-inspired emojis.",
      type: "theme",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.theme.halloween,
      available: ["use"],
      price: { buy: 15e6, sell: 13e6 },
    },
    {
      id: "t03",
      name: "Boo Bash",
      description:
        "Get into the spooky spirit with this Halloween-themed set, featuring eerie colors and Halloween-inspired emojis.",
      type: "theme",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.theme.halloweenNew,
      available: ["use"],
      price: { buy: 15e6, sell: 13e6 },
    },
    {
      id: "t04",
      name: "Jingle Jolly",
      description:
        "Celebrate the season with this merry theme! Packed with jingling bells, cheerful reds, and festive greens, it’s pure Christmas joy in every detail.",
      type: "theme",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.theme.jingleJolly,
      available: ["use"],
      price: { buy: 15e6, sell: 13e6 },
    },
    {
      id: "t05",
      name: "Festive Frost",
      description:
        "Step into a winter wonderland with Festive Frost! This year’s Christmas theme sparkles with icy blues, snowy whites, and shimmering silver, capturing the magic of a frosty holiday season. Perfect for celebrating cozy nights and frosted mornings, it’s Christmas charm reimagined.",
      type: "theme",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.theme.festiveFrost,
      available: ["use"],
      price: { buy: 15e6, sell: 13e6 },
    },
  ],
};
