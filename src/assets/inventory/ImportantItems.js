module.exports = [
    {
        id: 'bare_hand',
        name: 'Bare hand',
        description: 'Used to catch fish.',
        type: 'tool',
        able: {
            use: false,
            gift: false,
            multiple: false,
        },
        quantity: 12,
        emoji: '<:BRANDHAND:1278189353293844510>',
        available: ['fish'],
        price: { buy: 0, sell: 0 },
    },
    {
        id: 'ticket',
        name: 'Ticket',
        description: 'Sell to get coin.',
        type: 'item',
        able: {
            use: false,
            gift: true,
            multiple: false,
        },
        quantity: 1,
        emoji: '<:DD_TICKET:1265565796994646058>',
        available: ['sell'],
        price: { buy: 12e5, sell: 1e6 },
    },
];
