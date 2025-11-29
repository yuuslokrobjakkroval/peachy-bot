const emote = {
	// Common Fish
	sardine: "🐟",
	anchovy: "🐠",
	herring: "🐡",

	// Uncommon Fish
	bass: "🐟",
	trout: "🐠",
	mackerel: "🐡",

	// Rare Fish
	salmon: "🐟",
	tuna: "🐠",
	snapper: "🐡",

	// Legendary Fish
	shark: "🦈",
	whale: "🐋",
	octopus: "🐙",

	// Mythical Fish
	kraken: "🦑",
	leviathan: "🐲",
	seadragon: "🐉",
};

module.exports = [
	//=====================================| Common Fish |=====================================\\
	{
		id: "sardine",
		name: "Sardine",
		description: "A small, common fish found in shallow waters.",
		type: "fish",
		rarity: "common",
		emoji: emote.sardine,
		price: { sell: 20 },
	},
	{
		id: "anchovy",
		name: "Anchovy",
		description: "A tiny, salty fish that swims in schools.",
		type: "fish",
		rarity: "common",
		emoji: emote.anchovy,
		price: { sell: 25 },
	},
	{
		id: "herring",
		name: "Herring",
		description: "A silver fish commonly found near the surface.",
		type: "fish",
		rarity: "common",
		emoji: emote.herring,
		price: { sell: 30 },
	},

	//=====================================| Uncommon Fish |=====================================\\
	{
		id: "bass",
		name: "Bass",
		description: "A popular game fish with good fighting spirit.",
		type: "fish",
		rarity: "uncommon",
		emoji: emote.bass,
		price: { sell: 75 },
	},
	{
		id: "trout",
		name: "Trout",
		description: "A freshwater fish prized by anglers.",
		type: "fish",
		rarity: "uncommon",
		emoji: emote.trout,
		price: { sell: 85 },
	},
	{
		id: "mackerel",
		name: "Mackerel",
		description: "A fast-swimming fish with distinctive markings.",
		type: "fish",
		rarity: "uncommon",
		emoji: emote.mackerel,
		price: { sell: 95 },
	},

	//=====================================| Rare Fish |=====================================\\
	{
		id: "salmon",
		name: "Salmon",
		description: "A prized fish that swims upstream to spawn.",
		type: "fish",
		rarity: "rare",
		emoji: emote.salmon,
		price: { sell: 200 },
	},
	{
		id: "tuna",
		name: "Tuna",
		description: "A large, powerful fish of the deep ocean.",
		type: "fish",
		rarity: "rare",
		emoji: emote.tuna,
		price: { sell: 250 },
	},
	{
		id: "snapper",
		name: "Red Snapper",
		description: "A valuable reef fish with bright red scales.",
		type: "fish",
		rarity: "rare",
		emoji: emote.snapper,
		price: { sell: 300 },
	},

	//=====================================| Legendary Fish |=====================================\\
	{
		id: "shark",
		name: "Shark",
		description: "A fearsome predator of the deep seas.",
		type: "fish",
		rarity: "legendary",
		emoji: emote.shark,
		price: { sell: 800 },
	},
	{
		id: "whale",
		name: "Whale",
		description: "The largest creature in the ocean.",
		type: "fish",
		rarity: "legendary",
		emoji: emote.whale,
		price: { sell: 1000 },
	},
	{
		id: "octopus",
		name: "Giant Octopus",
		description: "An intelligent cephalopod with eight arms.",
		type: "fish",
		rarity: "legendary",
		emoji: emote.octopus,
		price: { sell: 900 },
	},

	//=====================================| Mythical Fish |=====================================\\
	{
		id: "kraken",
		name: "Kraken",
		description: "A legendary sea monster of immense size and power.",
		type: "fish",
		rarity: "mythical",
		emoji: emote.kraken,
		price: { sell: 2500 },
	},
	{
		id: "leviathan",
		name: "Leviathan",
		description: "An ancient sea serpent from the deepest trenches.",
		type: "fish",
		rarity: "mythical",
		emoji: emote.leviathan,
		price: { sell: 3000 },
	},
	{
		id: "seadragon",
		name: "Sea Dragon",
		description: "A mystical dragon that rules the ocean depths.",
		type: "fish",
		rarity: "mythical",
		emoji: emote.seadragon,
		price: { sell: 5000 },
	},
];
