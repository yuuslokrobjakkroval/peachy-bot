const emote = {
    axe: '<:AXE:1355804959131832441>',
    pickaxe: '<:STONEAXE:1355805092607037450>',
    net: '<:NET:1355805034893541376>',
    fishingpole: '<:FISHINGPOLE:1355805017977917562>',
};

module.exports = [
    //=====================================| Chopping Tools |=====================================\\
    {
        id: 'axe',
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

    //=====================================| Mining Tools |=====================================\\
    {
        id: 'pickaxe',
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

    //=====================================| Slime Tools |=====================================\\
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
    },

    //=====================================| Fishing Tools |=====================================\\
    {
        id: 'pole',
        name: 'Fishing Pole',
        description: 'A basic fishing rod for catching fish.',
        type: 'tool',
        able: {
            use: true,
            gift: false,
            multiple: false,
        },
        quantity: 15,
        emoji: emote.fishingpole,
        available: ['use'],
        price: { buy: 10000, sell: 0 },
    },
];
