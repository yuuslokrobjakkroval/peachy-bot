const { Command } = require('../../structures/index.js');
const FishingTools = require('../../assets/inventory/FishingTools.js');
const FishList = require('../../assets/inventory/Fish.js');

module.exports = class Fish extends Command {
    constructor(client) {
        super(client, {
            name: 'fish',
            description: {
                content: 'Go fishing with logic puzzles and mini-games!',
                examples: ['fish', 'fish puzzle', 'fish quick'],
                usage: 'fish [mode]',
            },
            category: 'inventory',
            aliases: ['f'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        return await client.resourceManager.gatherResource(ctx, 'Fish', FishingTools, FishList, emoji, color, language);
    }
};
