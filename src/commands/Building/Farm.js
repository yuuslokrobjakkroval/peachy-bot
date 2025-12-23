const { Command } = require('../../structures/index.js');
const FarmTools = require('../../assets/inventory/Tools/Farm.js');
const Crops = require('../../assets/inventory/Base/Crops.js');

module.exports = class Farm extends Command {
    constructor(client) {
        super(client, {
            name: 'farm',
            description: {
                content: 'Farm crops like rice and corn to earn coins!',
                examples: ['farm'],
                usage: 'farm',
            },
            category: 'inventory',
            aliases: ['fa'],
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
        return await client.resourceManager.gatherResource(ctx, 'Farm', FarmTools, Crops, emoji, color, language);
    }
};
