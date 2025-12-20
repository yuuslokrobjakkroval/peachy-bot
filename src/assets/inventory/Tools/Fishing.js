const emote = {
    fishingPole: '<:fishingPole:1355805017977917562>',
    fishingRod: '<:fishingRod:1451841965682589759>',
};

module.exports = [
    {
        id: 'pole',
        name: 'Fishing Pole',
        description: 'A basic tool for catching fish.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.fishingPole,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
    {
        id: 'rod',
        name: 'Fishing Rod',
        description: 'A basic tool for catching fish.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.fishingRod,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
