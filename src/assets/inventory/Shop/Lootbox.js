const emote = {
    cyberwave: '<:CYBERWAVE:1417677859136475256>',
    nebula: '<:NEBULA:1417677865935175740>',
    kayukio: '<:KAYUKIO:1417677877704659014>',
};

module.exports = {
    name: 'Lootboxes',
    description: `Lootboxes contain random items!\n**・** \`pbuy {id}\` to buy an item`,
    type: 'box',
    inventory: [
        {
            id: 'box01',
            name: 'Cyberwave',
            description: 'A futuristic lootbox with cybernetic themes.',
            type: 'box',
            able: {
                use: true,
                gift: false,
                multiple: false,
            },
            quantity: 1,
            emoji: emote.cyberwave,
            available: ['use'],
            price: { buy: 10000000, sell: 0 },
        },
        {
            id: 'box02',
            name: 'Nebula',
            description: 'A cosmic lootbox filled with stellar surprises.',
            type: 'box',
            able: {
                use: true,
                gift: false,
                multiple: false,
            },
            quantity: 1,
            emoji: emote.nebula,
            available: ['use'],
            price: { buy: 20000000, sell: 0 },
        },
        {
            id: 'box03',
            name: 'Kayukio',
            description: 'An enigmatic lootbox with mystical allure.',
            type: 'box',
            able: {
                use: true,
                gift: false,
                multiple: false,
            },
            quantity: 1,
            emoji: emote.kayukio,
            available: ['use'],
            price: { buy: 30000000, sell: 0 },
        },
    ],
};
