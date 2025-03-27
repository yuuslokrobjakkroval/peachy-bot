// Selling prices for pets based on level and color
const sellingList = {
  levels: {
    1: 5000,
    2: 14000,
    3: 28000,
    4: 35000,
    5: 60000,
    6: 80000,
    7: 100000,
    8: 135000,
    9: 160000,
    10: 200000,
  },
  colorMultipliers: {
    Bubbles: 1.0, // Common (Blue)
    Ash: 1.0, // Common (Gray)
    Skye: 1.1, // Common but slightly rarer (Sky Blue, +10%)
    Blossom: 1.2, // Uncommon (Pale Pink, +20%)
    Coco: 1.3, // Uncommon (Brown, +30%)
    Tangerine: 1.4, // Uncommon (Orange, +40%)
    Misty: 1.5, // Rare (Mauve, +50%)
    Plum: 1.6, // Rare (Purple, +60%)
    Vivi: 1.8, // Very Rare (Violet, +80%)
    Limey: 2.0, // Epic (Emerald Green, +100%)
  },
  nameToColor: {
    Bubbles: "Blue",
    Ash: "Gray",
    Skye: "Sky Blue",
    Blossom: "Pale Pink",
    Coco: "Brown",
    Tangerine: "Orange",
    Misty: "Mauve",
    Plum: "Purple",
    Vivi: "Violet",
    Limey: "Emerald Green",
  },
};

module.exports = sellingList;
