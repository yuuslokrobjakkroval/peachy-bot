const emoji = require("../../../utils/Emoji");

module.exports = {
  name: "Cards",
  description: `Luxurious credit cards with high coin limits, inspired by Peach and Goma!\n**・** \`pbuy {id}\` to buy a card`,
  type: "card",
  inventory: [
    {
      id: "pc",
      name: "Peach Card",
      description:
        "A luxurious card with a 100 million coin limit, inspired by Peach’s charm!",
      type: "card",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.card.black,
      available: ["use"],
      price: { buy: 10000000, sell: 9000000 },
    },
    {
      id: "gc",
      name: "Goma Card",
      description:
        "Goma’s signature card with a 500 million coin limit, perfect for bold spenders!",
      type: "card",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.card.red,
      available: ["use"],
      price: { buy: 100000000, sell: 90000000 },
    },
    {
      id: "ppc",
      name: "Peachy Prestige Card",
      description:
        "The Peachy Card, with a 1000 million coin limit, radiates exclusive vibes!",
      type: "card",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.card.pink,
      available: ["use"],
      price: { buy: 100000000, sell: 99000000 },
    },
  ],
};
