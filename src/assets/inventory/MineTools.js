const emote = {
    pickaxe: '⛏️',
};

module.exports = [
    //=====================================| Mining Tools |=====================================\\
    {
        id: 't02',
        name: 'Pickaxe',
        description: 'A tool for breaking stones.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.pickaxe,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
