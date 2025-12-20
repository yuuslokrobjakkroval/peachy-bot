const emote = {
    pickaxe: '<:STONEAXE:1355805092607037450>',
};

module.exports = [
    //=====================================| Mining Tools |=====================================\\
    {
        id: 'sxe',
        name: 'Stone Axe',
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
