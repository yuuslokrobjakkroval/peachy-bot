const emote = {
    sword: '<:SWORD:1452699680449232916>',
};

module.exports = [
    {
        id: 'sword',
        name: 'Sword',
        description: 'A tool for catching slimes.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.sword,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
