const emote = {
    axe: '<:AXE:1355804959131832441>',
};
module.exports = [
    {
        id: 't01',
        name: 'Axe',
        description: 'A tool for chopping wood.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: emote.axe,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
