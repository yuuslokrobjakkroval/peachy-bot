const { Command } = require('../../structures/index.js');
const HuntingTools = require('../../assets/inventory/Tools/Hunting.js');
const Animals = require('../../assets/inventory/Base/Animals.js');

module.exports = class Hunt extends Command {
    constructor(client) {
        super(client, {
            name: 'hunt',
            description: {
                content: 'Go hunting for animals with your bow!',
                examples: ['hunt'],
                usage: 'hunt',
            },
            category: 'inventory',
            aliases: ['h'],
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
        return await client.resourceManager.gatherResource(ctx, 'Hunt', HuntingTools, Animals, emoji, color, language);
    }
};
