const { Command } = require("../../structures/index.js");
const SlimeTools = require("../../assets/inventory/SlimeTools.js");
const Slimes = require("../../assets/inventory/SlimeCatalog.js");

module.exports = class Catch extends Command {
	constructor(client) {
		super(client, {
			name: "slime",
			description: {
				content: "Go catch some slimes!",
				examples: ["slime"],
				usage: "slime",
			},
			category: "inventory",
			aliases: ["sl"],
			cooldown: 3,
			args: false,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		return await client.resourceManager.gatherResource(
			ctx,
			"Slime",
			SlimeTools,
			Slimes,
			emoji,
			color,
			language,
		);
	}
};
