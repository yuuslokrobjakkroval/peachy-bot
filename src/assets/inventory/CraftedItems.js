const emote = {
  // Weapons
  sword: "⚔️",
  spear: "🗡️",
  bow: "🏹",

  // Armor
  helmet: "⛑️",
  chestplate: "🛡️",
  boots: "🥾",

  // Tools
  hammer: "🔨",
  saw: "🪚",
  compass: "🧭",

  // Jewelry
  ring: "💍",
  necklace: "📿",
  crown: "👑",

  // Food
  fishstew: "🍲",
  salad: "🥗",
  cake: "🎂",
};

module.exports = [
  //=====================================| Weapons |=====================================\\
  {
    id: "sword",
    name: "Bronze Sword",
    description: "A sturdy sword forged from bronze.",
    type: "weapon",
    rarity: "uncommon",
    emoji: emote.sword,
    price: { sell: 500 },
  },
  {
    id: "spear",
    name: "Silver Spear",
    description: "A sharp spear crafted from silver.",
    type: "weapon",
    rarity: "rare",
    emoji: emote.spear,
    price: { sell: 400 },
  },
  {
    id: "bow",
    name: "Wooden Bow",
    description: "A reliable bow made from hardwood.",
    type: "weapon",
    rarity: "common",
    emoji: emote.bow,
    price: { sell: 300 },
  },

  //=====================================| Armor |=====================================\\
  {
    id: "helmet",
    name: "Bronze Helmet",
    description: "Protective headgear made of bronze.",
    type: "armor",
    rarity: "uncommon",
    emoji: emote.helmet,
    price: { sell: 600 },
  },
  {
    id: "chestplate",
    name: "Silver Chestplate",
    description: "Heavy armor to protect your torso.",
    type: "armor",
    rarity: "rare",
    emoji: emote.chestplate,
    price: { sell: 1000 },
  },
  {
    id: "boots",
    name: "Bronze Boots",
    description: "Sturdy boots for tough adventures.",
    type: "armor",
    rarity: "uncommon",
    emoji: emote.boots,
    price: { sell: 400 },
  },

  //=====================================| Tools |=====================================\\
  {
    id: "hammer",
    name: "Golden Hammer",
    description: "A premium hammer made of gold.",
    type: "tool",
    rarity: "rare",
    emoji: emote.hammer,
    price: { sell: 800 },
  },
  {
    id: "saw",
    name: "Silver Saw",
    description: "A sharp saw for precise cutting.",
    type: "tool",
    rarity: "uncommon",
    emoji: emote.saw,
    price: { sell: 450 },
  },
  {
    id: "compass",
    name: "Golden Compass",
    description: "A magical compass that always points true.",
    type: "tool",
    rarity: "rare",
    emoji: emote.compass,
    price: { sell: 350 },
  },

  //=====================================| Jewelry |=====================================\\
  {
    id: "ring",
    name: "Gold Ring",
    description: "A beautiful ring made of pure gold.",
    type: "jewelry",
    rarity: "rare",
    emoji: emote.ring,
    price: { sell: 600 },
  },
  {
    id: "necklace",
    name: "Precious Necklace",
    description: "An exquisite necklace with gold and silver.",
    type: "jewelry",
    rarity: "legendary",
    emoji: emote.necklace,
    price: { sell: 1200 },
  },
  {
    id: "crown",
    name: "Royal Crown",
    description: "A magnificent crown fit for royalty.",
    type: "jewelry",
    rarity: "legendary",
    emoji: emote.crown,
    price: { sell: 3000 },
  },

  //=====================================| Food |=====================================\\
  {
    id: "fishstew",
    name: "Fish Stew",
    description: "A hearty stew made with fresh fish.",
    type: "food",
    rarity: "common",
    emoji: emote.fishstew,
    price: { sell: 200 },
  },
  {
    id: "salad",
    name: "Fish Salad",
    description: "A healthy salad with mixed fish.",
    type: "food",
    rarity: "common",
    emoji: emote.salad,
    price: { sell: 150 },
  },
  {
    id: "cake",
    name: "Seafood Cake",
    description: "A delicious cake made with premium seafood.",
    type: "food",
    rarity: "uncommon",
    emoji: emote.cake,
    price: { sell: 500 },
  },
];
