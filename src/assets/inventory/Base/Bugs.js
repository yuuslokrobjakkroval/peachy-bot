const emote = {
    // Common Bugs
    common: {
        mosquito: '<:mosquito:1451885090421342258>',
        monarch: '<:monarchButterfly:1451884683854876723>',
        grasshopper: '<:grasshopper:1451884807612010648>',
        redDragonfly: '<:redDragonfly:1451885323633033360>',
        robustCicada: '<:robustCicada:1451885597554770002>',
        blueWeevilBeetle: '<:blueWeevilBeetle:1451885868515328162>',
    },

    // Uncommon Bugs
    uncommon: {
        miyamaStag: '<:miyamaStag:1451886190553858098>',
        manFacedStinkBug: '<:manFacedStinkBug:1451886554824970293>',
        tigerBeetle: '<:tigerBeetle:1451886863328477356>',
    },

    // Rare Bugs
    rare: {
        giantWaterBug: '<:giantWaterBug:1451887213028704267>',
        wasp: '<:wasp:1451887430968807564>',
        madagascanSunsetMoth: '<:madagascanSunsetMoth:1451887690323853312>',
    },

    // Legendary Bugs
    legendary: {
        queenAlexandrasBirdwing: '<:queenAlexandrasBirdwing:1451888519789154325>',
        bandedDragonfly: '<:bandedDragonfly:1451888685308973097>',
        rainbowStag: '<:rainbowStag:1451888896727322654>',
    },

    // Mythical Bugs
    // mythical: {
    //     dorado: '<:dorado:1451873374761521271>',
    //     barreleye: '<:barreleye:1451873305509367830>',
    //     coelacanth: '<:coelacanth:1451842200781590550>',
    // },
};

module.exports = [
    //=====================================| Common Bugs |=====================================\\
    {
        id: 'bug01',
        name: 'Mosquito',
        description: 'A silver bug commonly found near the surface.',
        type: 'bug',
        rarity: 'common',
        emoji: emote.common.mosquito,
        price: { sell: 130 },
    },
    {
        id: 'bug02',
        name: 'Monarch butterfly',
        description: 'A silver bug commonly found near the surface.',
        type: 'bug',
        rarity: 'common',
        emoji: emote.common.monarch,
        price: { sell: 140 },
    },
    {
        id: 'bug03',
        name: 'Grasshopper',
        description: 'A silver bug commonly found near the surface.',
        type: 'bug',
        rarity: 'common',
        emoji: emote.common.grasshopper,
        price: { sell: 160 },
    },
    {
        id: 'bug04',
        name: 'Red Dragonfly',
        description: 'A silver bug commonly found near the surface.',
        type: 'bug',
        rarity: 'common',
        emoji: emote.common.redDragonfly,
        price: { sell: 180 },
    },
    {
        id: 'bug05',
        name: 'Robust Cicada',
        description: 'A silver bug commonly found near the surface.',
        type: 'bug',
        rarity: 'common',
        emoji: emote.common.robustCicada,
        price: { sell: 300 },
    },
    {
        id: 'bug06',
        name: 'Blue Weevil Beetle',
        description: 'A silver bug commonly found near the surface.',
        type: 'bug',
        rarity: 'common',
        emoji: emote.common.blueWeevilBeetle,
        price: { sell: 800 },
    },

    //=====================================| Uncommon Bugs |=====================================\\
    {
        id: 'bug07',
        name: 'Miyama Stag',
        description: 'A large bug with impressive antlers.',
        type: 'bug',
        rarity: 'uncommon',
        emoji: emote.uncommon.miyamaStag,
        price: { sell: 1000 },
    },
    {
        id: 'bug08',
        name: 'Man-Faced Stink Bug',
        description: 'A fast-swimming bug with distinctive markings.',
        type: 'bug',
        rarity: 'uncommon',
        emoji: emote.uncommon.manFacedStinkBug,
        price: { sell: 1000 },
    },
    {
        id: 'bug09',
        name: 'Tiger Beetle',
        description: 'A fierce predatory bug known for its speed.',
        type: 'bug',
        rarity: 'uncommon',
        emoji: emote.uncommon.tigerBeetle,
        price: { sell: 1500 },
    },

    //=====================================| Rare Bugs |=====================================\\
    {
        id: 'bug10',
        name: 'Giant Water Bug',
        description: 'A fearsome predator of the deep seas.',
        type: 'bug',
        rarity: 'rare',
        emoji: emote.rare.giantWaterBug,
        price: { sell: 2000 },
    },
    {
        id: 'bug11',
        name: 'Wasp',
        description: 'A fearsome predator of the deep seas.',
        type: 'bug',
        rarity: 'rare',
        emoji: emote.rare.wasp,
        price: { sell: 2500 },
    },
    {
        id: 'bug12',
        name: 'Madagascan Sunset Moth',
        description: 'A fearsome predator of the deep seas.',
        type: 'bug',
        rarity: 'legendary',
        emoji: emote.rare.madagascanSunsetMoth,
        price: { sell: 3000 },
    },

    //=====================================| Legendary Bugs |=====================================\\
    {
        id: 'bug13',
        name: "Queen Alexandra's Birdwing",
        description: 'A prized bug that swims upstream to spawn.',
        type: 'bug',
        rarity: 'rare',
        emoji: emote.rare.queenAlexandrasBirdwing,
        price: { sell: 4000 },
    },
    {
        id: 'bug14',
        name: 'Banded Dragonfly',
        description: 'A fearsome predator of the deep seas.',
        type: 'bug',
        rarity: 'legendary',
        emoji: emote.legendary.bandedDragonfly,
        price: { sell: 5000 },
    },
    {
        id: 'bug15',
        name: 'Rainbow Stag',
        description: 'The largest creature in the ocean.',
        type: 'bug',
        rarity: 'legendary',
        emoji: emote.legendary.rainbowStag,
        price: { sell: 6000 },
    },

    //=====================================| Mythical Bugs |=====================================\\
    // {
    //     id: 'barreleye',
    //     name: 'Barreleye',
    //     description: 'A legendary sea monster of immense size and power.',
    //     type: 'bug',
    //     rarity: 'mythical',
    //     emoji: emote.mythical.barreleye,
    //     price: { sell: 2500 },
    // },
    // {
    //     id: 'dorado',
    //     name: 'Dorado',
    //     description: 'An ancient sea serpent from the deepest trenches.',
    //     type: 'bug',
    //     rarity: 'mythical',
    //     emoji: emote.mythical.dorado,
    //     price: { sell: 3000 },
    // },
    // {
    //     id: 'coelacanth',
    //     name: 'Coelacanth',
    //     description: 'A mystical dragon that rules the ocean depths.',
    //     type: 'bug',
    //     rarity: 'mythical',
    //     emoji: emote.mythical.coelacanth,
    //     price: { sell: 5000 },
    // },
];
