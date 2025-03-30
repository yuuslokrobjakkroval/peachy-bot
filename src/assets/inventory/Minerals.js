const emote = {
    coal: '<:COAL:1355814321703092376>',
    bronzeore: '<:BRONZEORE:1355814147245478040>',
    silverore: '<:SILVERORE:1355814163603263569>',
    goldore: '<:GOLDORE:1355814180846043257>',
    osmiumore: '<:OSMIUMORE:1355814193579954176>',
    bronzebar: '<:BRONZEBAR:1355814215792988302>',
    silverbar: '<:SILVERBAR:1355814253818413056>',
    goldbar: '<:GOLDBAR:1355814268808859820>',
    osmiumbar: '<:OSMIUMBAR:1355814294729785384>',
};
module.exports = [
    //=====================================| Common Mineral |=====================================\\
    {
        id: 'coal',
        name: 'Coal',
        description: 'A lightweight black material that’s useful for crafting.',
        type: 'mineral',
        rarity: 'common',
        emoji: emote.coal,
        price: { sell: 15 },
    },
    {
        id: 'bronzeore',
        name: 'Bronze Ore',
        description: 'Bronze ore that can be smelted into bars.',
        type: 'ore',
        rarity: 'common',
        emoji: emote.bronzeore,
        price: { sell: 25 },
    },
    {
        id: 'bronzebar',
        name: 'Bronze Bar',
        description: 'A bar of bronze.',
        type: 'metalbar',
        rarity: 'common',
        emoji: emote.bronzebar,
        price: { sell: 125 },
    },

    //=====================================| Uncommon Mineral |=====================================\\
    {
        id: 'silverore',
        name: 'Silver Ore',
        description: 'Silver ore that can be smelted into bars.',
        type: 'ore',
        rarity: 'uncommon',
        emoji: emote.silverore,
        price: { sell: 75 },
    },
    {
        id: 'silverbar',
        name: 'Silver Bar',
        description: 'A bar of silver.',
        type: 'metalbar',
        rarity: 'uncommon',
        emoji: emote.silverbar,
        price: { sell: 275 },
    },

    //=====================================| Rare Mineral |=====================================\\
    {
        id: 'goldore',
        name: 'Gold Ore',
        description: 'Gold ore that can be smelted into bars.',
        type: 'ore',
        rarity: 'rare',
        emoji: emote.goldore,
        price: { sell: 250 },
    },
    {
        id: 'goldbar',
        name: 'Gold Bar',
        description: 'A bar of gold.',
        type: 'metalbar',
        rarity: 'rare',
        emoji: emote.goldbar,
        price: { sell: 500 },
    },

    //=====================================| Legendary Mineral |=====================================\\
    {
        id: 'osmiumore',
        name: 'Osmium Ore',
        description: 'Diamond ore that can be smelted into bars.',
        type: 'ore',
        rarity: 'legendary',
        emoji: emote.osmiumore,
        price: { sell: 750 },
    },
    {
        id: 'osmiumbar',
        name: 'Osmium Bar',
        description: 'A bar of osmium.',
        type: 'metalbar',
        rarity: 'legendary',
        emoji: emote.osmiumbar,
        price: { sell: 1500 },
    },
];
