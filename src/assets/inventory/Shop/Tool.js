const emote = {
    axe: '<:AXE:1452699633305255986>',
    sxe: '<:PICKAXE:1452699657019855111>',
    net: '<:NET:1452699752323088394>',
    fishingRod: '<:FISHINGROD:1452699761353298011>',
    sword: '<:SWORD:1452699680449232916>',
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
            id: 'sword',
            name: 'Sword',
            description: 'A tool for catching slimes.',
            type: 'tool',
            able: {
                use: true,
                gift: false,
                multiple: false,
            },
            quantity: 12,
            emoji: emote.sword,
            available: ['use'],
            price: { buy: 10000, sell: 0 },
        },
        // Bug Tools
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
    ],
};
