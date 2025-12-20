const emote = {
    // Common Fish
    common: {
        guppy: '<:guppy:1451841985601343548>',
        bitterling: '<:bitterling:1451842008300781578>',
        rainbowfish: '<:rainbowfish:1451842022687117382>',
        betta: '<:betta:1451842045378560100>',
        paleChub: '<:paleChub:1451875245333151856>',
    },

    // Uncommon Fish
    uncommon: {
        angelfish: '<:angelfish:1451874900582072454>',
        koi: '<:koi:1451842064210989176>',
        redSnapper: '<:redSnapper:1451874707329777840>',
    },

    // Rare Fish
    rare: {
        barredKnifejaw: '<:barredKnifejaw:1451872754507972608>',
        blowfish: '<:blowfish:1451874335416516733>',
        arapaima: '<:arapaima:1451872737244090461>',
    },

    // Legendary Fish
    legendary: {
        stringfish: '<:stringfish:1451842089049657434>',
        napoleonfish: '<:napoleonfish:1451842076785246248>',
        greatWhite: '<:greatWhite:1451842188433424475>',
    },

    // Mythical Fish
    mythical: {
        dorado: '<:dorado:1451873374761521271>',
        barreleye: '<:barreleye:1451873305509367830>',
        coelacanth: '<:coelacanth:1451842200781590550>',
    },
};

module.exports = [
    //=====================================| Common Fish |=====================================\\
    {
        id: 'fish01',
        name: 'Pale Chub',
        description: 'A silver fish commonly found near the surface.',
        type: 'fish',
        rarity: 'common',
        emoji: emote.common.paleChub,
        price: { sell: 200 },
    },
    {
        id: 'fish02',
        name: 'Rainbowfish',
        description: 'A silver fish commonly found near the surface.',
        type: 'fish',
        rarity: 'common',
        emoji: emote.common.rainbowfish,
        price: { sell: 800 },
    },
    {
        id: 'fish03',
        name: 'Bitterling',
        description: 'A tiny, salty fish that swims in schools.',
        type: 'fish',
        rarity: 'common',
        emoji: emote.common.bitterling,
        price: { sell: 900 },
    },
    {
        id: 'fish04',
        name: 'Guppy',
        description: 'A small, common fish found in shallow waters.',
        type: 'fish',
        rarity: 'common',
        emoji: emote.common.guppy,
        price: { sell: 1300 },
    },
    {
        id: 'fish05',
        name: 'Betta',
        description: 'A silver fish commonly found near the surface.',
        type: 'fish',
        rarity: 'common',
        emoji: emote.common.betta,
        price: { sell: 2500 },
    },

    //=====================================| Uncommon Fish |=====================================\\
    {
        id: 'fish06',
        name: 'Angelfish',
        description: 'A popular game fish with good fighting spirit.',
        type: 'fish',
        rarity: 'uncommon',
        emoji: emote.uncommon.angelfish,
        price: { sell: 3000 },
    },
    {
        id: 'fish07',
        name: 'Red Snapper',
        description: 'A fast-swimming fish with distinctive markings.',
        type: 'fish',
        rarity: 'uncommon',
        emoji: emote.uncommon.redSnapper,
        price: { sell: 3000 },
    },
    {
        id: 'fish08',
        name: 'Koi',
        description: 'A freshwater fish prized by anglers.',
        type: 'fish',
        rarity: 'uncommon',
        emoji: emote.uncommon.koi,
        price: { sell: 4000 },
    },

    //=====================================| Rare Fish |=====================================\\
    {
        id: 'fish09',
        name: 'Barred Knifejaw',
        description: 'A large, powerful fish of the deep ocean.',
        type: 'fish',
        rarity: 'rare',
        emoji: emote.rare.barredKnifejaw,
        price: { sell: 5000 },
    },
    {
        id: 'fish10',
        name: 'Blowfish',
        description: 'A valuable reef fish with bright red scales.',
        type: 'fish',
        rarity: 'rare',
        emoji: emote.rare.blowfish,
        price: { sell: 5000 },
    },
    {
        id: 'fish11',
        name: 'Arapaima',
        description: 'A fearsome predator of the deep seas.',
        type: 'fish',
        rarity: 'legendary',
        emoji: emote.rare.arapaima,
        price: { sell: 10000 },
    },

    //=====================================| Legendary Fish |=====================================\\
    {
        id: 'fish12',
        name: 'Stringfish',
        description: 'A prized fish that swims upstream to spawn.',
        type: 'fish',
        rarity: 'legendary',
        emoji: emote.legendary.stringfish,
        price: { sell: 15000 },
    },
    {
        id: 'fish13',
        name: 'Napoleonfish',
        description: 'A fearsome predator of the deep seas.',
        type: 'fish',
        rarity: 'legendary',
        emoji: emote.legendary.napoleonfish,
        price: { sell: 15000 },
    },
    {
        id: 'fish14',
        name: 'Great White Shark',
        description: 'The largest creature in the ocean.',
        type: 'fish',
        rarity: 'legendary',
        emoji: emote.legendary.greatWhite,
        price: { sell: 15000 },
    },

    //=====================================| Mythical Fish |=====================================\\
    {
        id: 'fish15',
        name: 'Barreleye',
        description: 'A legendary sea monster of immense size and power.',
        type: 'fish',
        rarity: 'mythical',
        emoji: emote.mythical.barreleye,
        price: { sell: 2500 },
    },
    {
        id: 'fish16',
        name: 'Dorado',
        description: 'An ancient sea serpent from the deepest trenches.',
        type: 'fish',
        rarity: 'mythical',
        emoji: emote.mythical.dorado,
        price: { sell: 3000 },
    },
    {
        id: 'fish17',
        name: 'Coelacanth',
        description: 'A mystical dragon that rules the ocean depths.',
        type: 'fish',
        rarity: 'mythical',
        emoji: emote.mythical.coelacanth,
        price: { sell: 5000 },
    },
];
