const emoji = require("../../utils/Emoji");
module.exports = [
  {
    id: 'hand',
    name: 'Bare hand',
    description: 'Used to catch fish.',
    type: 'tool',
    able: {
      use: false,
      gift: false,
      multiple: false,
    },
    quantity: 12,
    emoji: '<a:START:1342748948825243699>',
    available: ['use'],
    price: { buy: 0, sell: 0 },
  },
  {
    id: "sm01",
    name: "Banana Milk Tea",
    description: "Sell Banana Milk Tea to get coin.",
    type: "milk",
    able: {
      use: false,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.banana,
    available: ["sell"],
    price: { buy: 15e5, sell: 1e6 },
  },
  {
    id: "sm02",
    name: "Avocado Milk Tea",
    description: "Sell Avocado Milk Tea to get coin.",
    type: "milk",
    able: {
      use: false,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.avocado,
    available: ["sell"],
    price: { buy: 25e5, sell: 2e6 },
  },
  {
    id: "sm03",
    name: "Strawberry Milk Tea",
    description: "Sell Strawberry Milk Tea to get coin.",
    type: "milk",
    able: {
      use: false,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.strawberry,
    available: ["sell"],
    price: { buy: 35e5, sell: 3e6 },
  },
  {
    id: "sm04",
    name: "Peach Milk Tea",
    description: "Sell Peach Milk Tea to get coin.",
    type: "milk",
    able: {
      use: false,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.peachy,
    available: ["sell"],
    price: { buy: 55e5, sell: 5e6 },
  },

  // BOOSTER
  {
    id: "st272",
    name: "Love Bunnie",
    description: `Hop into a world of sweetness with 'Love Bunnie'! This theme is filled with soft pastel hues, adorable bunny icons, and heartwarming details that bring a touch of love and charm to every moment.`,
    type: "special theme",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.specialTheme.loveBunnie,
    available: ["use"],
    price: { buy: 1e10, sell: 15e6 },
  },

  // KEO
  {
    id: "st99",
    name: "Quirky Quackers",
    description:
      "Dive into the playful charm of Quirky Quackers! With a delightful blend of joyful vibes and heartwarming cuteness, this theme brings a touch of sunshine to every moment. Embrace the cheerful energy of a little duckling who knows how to brighten your day, no matter the weather.",
    type: "special theme",
    able: {
      use: true,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.specialTheme.duckling,
    available: ["use"],
    price: { buy: 1e10, sell: 15e6 },
  },
  {
    id: "st2707",
    name: "KEOYUU",
    description:
      "This theme is a gift for our anniversary 6month, I love you **#KEOYUU**",
    type: "special theme",
    able: {
      use: true,
      gift: false,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.specialTheme.keoyuu,
    available: ["use"],
    price: { buy: 1e10, sell: 15e6 },
  },

  // PHY
  {
    id: "st168",
    name: "Ghastly Grins",
    description:
      "Step into the shadowy allure of Ghastly Grins! This theme oozes with spooky charm, capturing the playful mischief and eerie elegance of a grinning ghostly trickster. Perfect for those who embrace the fun side of the dark and mysterious, it’s a hauntingly delightful way to add a spectral spark to your day!",
    type: "special theme",
    able: {
      use: true,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.specialTheme.ghastlyGrins,
    available: ["use"],
    price: { buy: 1e10, sell: 15e6 },
  },


  // SELL
  {
    id: "st1111",
    name: "Enchanted Cat Lake",
    description:
      "Step into the mystical wonder of Enchanted Cat Lake, where the serene waters shimmer under a moonlit sky and playful feline spirits roam. This magical setting blends tranquility with whimsy, creating a dreamlike escape for those who adore the charm of cats and the enchanting beauty of nature. Perfect for adventurers and dreamers alike, it’s a journey into a world of quiet magic and delightful surprises.",
    type: "special theme",
    able: {
      use: true,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.specialTheme.enchantedCatLake,
    available: ["use"],
    price: { buy: 1e10, sell: 15e6 },
  },
  {
    id: "st2601",
    name: "Yuyuzu",
    description:
      "Step into the mystical wonder of Enchanted Cat Lake, where the serene waters shimmer under a moonlit sky and playful feline spirits roam. This magical setting blends tranquility with whimsy, creating a dreamlike escape for those who adore the charm of cats and the enchanting beauty of nature. Perfect for adventurers and dreamers alike, it’s a journey into a world of quiet magic and delightful surprises.",
    type: "special theme",
    able: {
      use: true,
      gift: true,
      multiple: false,
    },
    quantity: 1,
    emoji: emoji.specialTheme.yuyuzu,
    available: ["use"],
    price: { buy: 1e10, sell: 15e6 },
  },
];
