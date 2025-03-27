// Selling prices for pets based on level and color
const sellingList = {
  levels: {
    1: 5000 * 3,    // 15,000
    2: 14000 * 3,   // 42,000
    3: 28000 * 3,   // 84,000
    4: 35000 * 3,   // 105,000
    5: 60000 * 3,   // 180,000
    6: 80000 * 3,   // 240,000
    7: 100000 * 3,  // 300,000
    8: 135000 * 3,  // 405,000
    9: 160000 * 3,  // 480,000
    10: 200000 * 3, // 600,000
  },
  colorMultipliers: {
    Bubbles: 1.0,   // Common (Blue)
    Ash: 1.0,       // Common (Gray)
    Skye: 1.1,      // Common but slightly rarer (Sky Blue, +10%)
    Blossom: 1.2,   // Uncommon (Pale Pink, +20%)
    Coco: 1.3,      // Uncommon (Brown, +30%)
    Tangerine: 1.4, // Uncommon (Orange, +40%)
    Misty: 1.5,     // Rare (Mauve, +50%)
    Plum: 1.6,      // Rare (Purple, +60%)
    Vivi: 1.8,      // Very Rare (Violet, +80%)
    Limey: 2.0,     // Epic (Emerald Green, +100%)
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