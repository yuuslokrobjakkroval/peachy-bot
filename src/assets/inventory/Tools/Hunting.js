const emote = {
    // Tool Emotes
    bow: '<:BOW:1453536252581249087>',
};

module.exports = [
    {
        id: 'bow',
        name: 'Wooden Bow',
        description: 'A basic tool for hunting animals.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.bow,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
