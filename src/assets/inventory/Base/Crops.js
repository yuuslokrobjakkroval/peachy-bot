const emote = {
    // Common Crops
    common: {
        wheat: '🌾',
        carrot: '🥕',
        potato: '🥔',
        beet: '🌶️',
        turnip: '🥬',
    },

    // Uncommon Crops
    uncommon: {
        corn: '🌽',
        rice: '🍚',
        barley: '🌾',
    },

    // Rare Crops
    rare: {
        sugarcane: '🍃',
        cotton: '☁️',
        sunflower: '🌻',
    },

    // Legendary Crops
    legendary: {
        goldwheat: '✨🌾',
        silverrice: '✨🍚',
        crystalline: '💎',
    },

    // Mythical Crops
    mythical: {
        dreamcrop: '🌠',
        starwheat: '⭐',
        eternalgrain: '👑',
    },
};

module.exports = [
    //=====================================| Common Crops |=====================================\\
    {
        id: 'crop01',
        name: 'Wheat',
        description: 'Golden wheat grains commonly grown in farmland.',
        type: 'crop',
        rarity: 'common',
        emoji: emote.common.wheat,
        price: { sell: 250 },
    },
    {
        id: 'crop02',
        name: 'Carrot',
        description: 'Orange root vegetables that grow underground.',
        type: 'crop',
        rarity: 'common',
        emoji: emote.common.carrot,
        price: { sell: 220 },
    },
    {
        id: 'crop03',
        name: 'Potato',
        description: 'Starchy tubers perfect for cooking.',
        type: 'crop',
        rarity: 'common',
        emoji: emote.common.potato,
        price: { sell: 200 },
    },
    {
        id: 'crop04',
        name: 'Beet',
        description: 'Deep red vegetables with earthy flavor.',
        type: 'crop',
        rarity: 'common',
        emoji: emote.common.beet,
        price: { sell: 210 },
    },
    {
        id: 'crop05',
        name: 'Turnip',
        description: 'Round purple and white root vegetables.',
        type: 'crop',
        rarity: 'common',
        emoji: emote.common.turnip,
        price: { sell: 230 },
    },

    //=====================================| Uncommon Crops |=====================================\\
    {
        id: 'crop06',
        name: 'Corn',
        description: 'Tall stalks bearing golden kernels.',
        type: 'crop',
        rarity: 'uncommon',
        emoji: emote.uncommon.corn,
        price: { sell: 450 },
    },
    {
        id: 'crop07',
        name: 'Rice',
        description: 'Delicate grain stalks swaying in the wind.',
        type: 'crop',
        rarity: 'uncommon',
        emoji: emote.uncommon.rice,
        price: { sell: 480 },
    },
    {
        id: 'crop08',
        name: 'Barley',
        description: 'Hardy grain used for brewing and baking.',
        type: 'crop',
        rarity: 'uncommon',
        emoji: emote.uncommon.barley,
        price: { sell: 420 },
    },

    //=====================================| Rare Crops |=====================================\\
    {
        id: 'crop09',
        name: 'Sugarcane',
        description: 'Sweet cane stalks perfect for sugar production.',
        type: 'crop',
        rarity: 'rare',
        emoji: emote.rare.sugarcane,
        price: { sell: 800 },
    },
    {
        id: 'crop10',
        name: 'Cotton',
        description: 'Fluffy white fibers for textile production.',
        type: 'crop',
        rarity: 'rare',
        emoji: emote.rare.cotton,
        price: { sell: 750 },
    },
    {
        id: 'crop11',
        name: 'Sunflower',
        description: 'Large golden flowers with valuable seeds.',
        type: 'crop',
        rarity: 'rare',
        emoji: emote.rare.sunflower,
        price: { sell: 900 },
    },

    //=====================================| Legendary Crops |=====================================\\
    {
        id: 'crop12',
        name: 'Golden Wheat',
        description: 'Rare golden wheat that shimmers in sunlight.',
        type: 'crop',
        rarity: 'legendary',
        emoji: emote.legendary.goldwheat,
        price: { sell: 2500 },
    },
    {
        id: 'crop13',
        name: 'Silver Rice',
        description: 'Precious rice grains with metallic shine.',
        type: 'crop',
        rarity: 'legendary',
        emoji: emote.legendary.silverrice,
        price: { sell: 2800 },
    },
    {
        id: 'crop14',
        name: 'Crystalline Grain',
        description: 'Mystical grain that glows with inner light.',
        type: 'crop',
        rarity: 'legendary',
        emoji: emote.legendary.crystalline,
        price: { sell: 3200 },
    },

    //=====================================| Mythical Crops |=====================================\\
    {
        id: 'crop15',
        name: 'Dream Crop',
        description: 'Ethereal crop from the realm of dreams.',
        type: 'crop',
        rarity: 'mythical',
        emoji: emote.mythical.dreamcrop,
        price: { sell: 6500 },
    },
    {
        id: 'crop16',
        name: 'Star Wheat',
        description: 'Ancient grain blessed by celestial powers.',
        type: 'crop',
        rarity: 'mythical',
        emoji: emote.mythical.starwheat,
        price: { sell: 7200 },
    },
    {
        id: 'crop17',
        name: 'Eternal Grain',
        description: 'Timeless grain that never perishes.',
        type: 'crop',
        rarity: 'mythical',
        emoji: emote.mythical.eternalgrain,
        price: { sell: 8000 },
    },
];
