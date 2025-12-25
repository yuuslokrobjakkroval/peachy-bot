const emote = {
    // Common Animals
    common: {
        rabbit: '🐰',
        squirrel: '🐿️',
        pheasant: '🦅',
        duck: '🦆',
    },

    // Uncommon Animals
    uncommon: {
        deer: '🦌',
        fox: '🦊',
        boar: '🐗',
        goose: '🦢',
    },
};

module.exports = [
    //=====================================| Common Animals |=====================================\\
    {
        id: 'animal01',
        name: 'Rabbit',
        description: 'A small, quick rabbit. Easy to catch.',
        type: 'animal',
        rarity: 'common',
        emoji: emote.common.rabbit,
        price: { sell: 180 },
    },
    {
        id: 'animal02',
        name: 'Squirrel',
        description: 'A nimble squirrel scurrying through the forest.',
        type: 'animal',
        rarity: 'common',
        emoji: emote.common.squirrel,
        price: { sell: 150 },
    },
    {
        id: 'animal03',
        name: 'Pheasant',
        description: 'A colorful bird found in grasslands.',
        type: 'animal',
        rarity: 'common',
        emoji: emote.common.pheasant,
        price: { sell: 200 },
    },
    {
        id: 'animal04',
        name: 'Duck',
        description: 'A waterfowl commonly found near ponds.',
        type: 'animal',
        rarity: 'common',
        emoji: emote.common.duck,
        price: { sell: 170 },
    },

    //=====================================| Uncommon Animals |=====================================\\
    {
        id: 'animal05',
        name: 'Deer',
        description: 'A graceful deer roaming the forest. Good bounty.',
        type: 'animal',
        rarity: 'uncommon',
        emoji: emote.uncommon.deer,
        price: { sell: 450 },
    },
    {
        id: 'animal06',
        name: 'Fox',
        description: 'A cunning fox, harder to catch than small game.',
        type: 'animal',
        rarity: 'uncommon',
        emoji: emote.uncommon.fox,
        price: { sell: 420 },
    },
    {
        id: 'animal07',
        name: 'Boar',
        description: 'A dangerous tusked boar with valuable hide.',
        type: 'animal',
        rarity: 'uncommon',
        emoji: emote.uncommon.boar,
        price: { sell: 480 },
    },
    {
        id: 'animal08',
        name: 'Goose',
        description: 'A large waterfowl with thick feathers.',
        type: 'animal',
        rarity: 'uncommon',
        emoji: emote.uncommon.goose,
        price: { sell: 400 },
    },

    //=====================================| Rare Animals |=====================================\\
    // {
    //     id: 'animal09',
    //     name: 'Wolf',
    //     description: 'A fearsome wolf roaming the deep forest. Risky hunt.',
    //     type: 'animal',
    //     rarity: 'rare',
    //     emoji: emote.rare.wolf,
    //     price: { sell: 800 },
    // },
    // {
    //     id: 'animal10',
    //     name: 'Elk',
    //     description: 'A majestic elk with impressive antlers.',
    //     type: 'animal',
    //     rarity: 'rare',
    //     emoji: emote.rare.elk,
    //     price: { sell: 900 },
    // },
    // {
    //     id: 'animal11',
    //     name: 'Hawk',
    //     description: 'A sharp-eyed predator of the skies.',
    //     type: 'animal',
    //     rarity: 'rare',
    //     emoji: emote.rare.hawk,
    //     price: { sell: 750 },
    // },

    //=====================================| Epic Animals |=====================================\\
    // {
    //     id: 'animal12',
    //     name: 'Bear',
    //     description: 'A massive bear. Extremely dangerous and rewarding.',
    //     type: 'animal',
    //     rarity: 'epic',
    //     emoji: emote.epic.bear,
    //     price: { sell: 1500 },
    // },
    // {
    //     id: 'animal13',
    //     name: 'Moose',
    //     description: 'A towering moose with powerful antlers.',
    //     type: 'animal',
    //     rarity: 'epic',
    //     emoji: emote.epic.moose,
    //     price: { sell: 1600 },
    // },
    // {
    //     id: 'animal14',
    //     name: 'Mountain Lion',
    //     description: 'A sleek predator of the mountains. Rare sighting.',
    //     type: 'animal',
    //     rarity: 'epic',
    //     emoji: emote.epic.mountain_lion,
    //     price: { sell: 1400 },
    // },

    // //=====================================| Legendary Animals |=====================================\\
    // {
    //     id: 'animal15',
    //     name: 'Dragon',
    //     description: 'A mythical dragon of immense power. Nearly impossible to hunt.',
    //     type: 'animal',
    //     rarity: 'legendary',
    //     emoji: emote.legendary.dragon,
    //     price: { sell: 5000 },
    // },
    // {
    //     id: 'animal16',
    //     name: 'Phoenix',
    //     description: 'A legendary bird of fire. An epic hunt awaits.',
    //     type: 'animal',
    //     rarity: 'legendary',
    //     emoji: emote.legendary.phoenix,
    //     price: { sell: 4500 },
    // },
    // {
    //     id: 'animal17',
    //     name: 'Unicorn',
    //     description: 'A magical unicorn shrouded in mystery and wonder.',
    //     type: 'animal',
    //     rarity: 'legendary',
    //     emoji: emote.legendary.unicorn,
    //     price: { sell: 4800 },
    // },
];
