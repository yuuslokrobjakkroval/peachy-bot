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
        barley: '🌾',
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
        name: 'Barley',
        description: 'Hardy grain used for brewing and baking.',
        type: 'crop',
        rarity: 'uncommon',
        emoji: emote.uncommon.barley,
        price: { sell: 420 },
    },
];
