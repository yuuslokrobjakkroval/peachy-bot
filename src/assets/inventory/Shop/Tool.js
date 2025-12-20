const emote = {
    axe: '<:AXE:1355804959131832441>',
    sxe: '<:STONEAXE:1355805092607037450>',
    net: '<:NET:1355805034893541376>',
    fishingPole: '<:fishingPole:1355805017977917562>',
    fishingRod: '<:fishingRod:1451841965682589759>',
    goldenNet: '<:goldennet:1451883732196786226>',
    starNetPink: '<:starnetpink:1451883762718871572>',
};

module.exports = {
    name: 'Tools',
    description: `Tools an item for earn coins!\n**・** \`pbuy {id}\` to buy an item`,
    type: 'tool',
    inventory: [
        // Chop Tools
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
        // Mining Tools
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
            emoji: emote.sxe,
            available: ['use'],
            price: { buy: 10000, sell: 0 },
        },
        // Fishing Tools
        {
            id: 'pole',
            name: 'Fishing Pole',
            description: 'A basic tool for catching fish.',
            type: 'tool',
            able: {
                use: true,
                gift: false,
                multiple: false,
            },
            quantity: 12,
            emoji: emote.fishingPole,
            available: ['use'],
            price: { buy: 10000, sell: 0 },
        },
        {
            id: 'rod',
            name: 'Fishing Rod',
            description: 'A basic tool for catching fish.',
            type: 'tool',
            able: {
                use: true,
                gift: false,
                multiple: false,
            },
            quantity: 12,
            emoji: emote.fishingRod,
            available: ['use'],
            price: { buy: 10000, sell: 0 },
        },
        // Slime Tools
        {
            id: 'net',
            name: 'Net',
            description: 'A tool for catch slime.',
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
        // Bug Tools
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
            emoji: emote.goldenNet,
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
            emoji: emote.starNetPink,
            available: ['use'],
            price: { buy: 10000, sell: 0 },
        },
    ],
};
