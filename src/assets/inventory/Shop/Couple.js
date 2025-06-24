const emoji = require("../../../utils/Emoji");

module.exports = {
  name: "Couple",
  description: `Ring items to connection your relationship!\n**・** \`pbuy {id}\` to buy an item`,
  type: "ring",
  inventory: [
    {
      id: "r01",
      name: "Peach Groom",
      description:
        "A dapper cat dressed as a groom, holding a sparkling ring. The perfect token to celebrate commitment and milestones!",
      type: "ring",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.ring.peach,
      available: ["use"],
      price: { buy: 3e7, sell: 25e6 },
    },
    {
      id: "r02",
      name: "Goma Bride",
      description:
        "A sweet cat in a bridal gown holding a cheerful bouquet. A beautiful symbol of love and partnership!",
      type: "ring",
      able: {
        use: true,
        gift: false,
        multiple: false,
      },
      quantity: 1,
      emoji: emoji.ring.goma,
      available: ["use"],
      price: { buy: 3e7, sell: 25e6 },
    },
  ],
};
