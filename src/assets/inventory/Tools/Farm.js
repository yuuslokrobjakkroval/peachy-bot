const emote = {
    hoe: '<:HOE:1453079485581758615>',
};

module.exports = [
    {
        id: 'hoe',
        name: 'Hoe',
        description: 'A basic farming tool for tilling soil and harvesting crops.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 15,
        emoji: emote.hoe,
        available: ['use'],
        price: { buy: 12000, sell: 0 },
    },
];
