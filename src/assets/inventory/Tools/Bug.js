const emote = {
    net: '<:NET:1452699752323088394>',
};

module.exports = [
    {
        id: 'net',
        name: 'Net',
        description: 'A tool for catching bugs.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.net,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
