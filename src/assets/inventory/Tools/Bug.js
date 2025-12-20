const emote = {
    goldennet: '<:goldennet:1451883732196786226>',
    starnetpink: '<:starnetpink:1451883762718871572>',
};

module.exports = [
    {
        id: 'goldennet',
        name: 'Golden Net',
        description: 'A basic tool for catching bug.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.goldennet,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
    {
        id: 'starnetpink',
        name: 'Star Net Pink',
        description: 'A basic tool for catching bugs.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.starnetpink,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
