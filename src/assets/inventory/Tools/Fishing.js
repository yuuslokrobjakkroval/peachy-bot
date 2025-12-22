const emote = {
    fishingRod: '<:FISHINGROD:1452699761353298011>',
};

module.exports = [
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
