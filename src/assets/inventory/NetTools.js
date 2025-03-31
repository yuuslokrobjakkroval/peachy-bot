const emote = {
    net: '<:NET:1355805034893541376>',
};

module.exports = [
    {
        id: 'net',
        name: 'Net',
        description: 'A tool for catching slime.',
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
    }
];
