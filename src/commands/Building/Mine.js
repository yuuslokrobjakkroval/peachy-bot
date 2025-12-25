const { Command } = require('../../structures/index.js');
const MineTools = require('../../assets/inventory/Tools/Mine.js');
const AllMinerals = require('../../assets/inventory/Base/Minerals.js');

module.exports = class Mine extends Command {
    constructor(client) {
        super(client, {
            name: 'mine',
            description: {
                content: 'Go mining for minerals!',
                examples: ['mine'],
                usage: 'mine',
            },
            category: 'inventory',
            aliases: ['m'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Filter to only include ores, minerals, and coal (no artifacts or bars)
        const Minerals = AllMinerals.filter(
            (item) => item.type === 'mineral' && !item.id.includes('bar') && !item.type.includes('artifact')
        );
        return await client.resourceManager.gatherResource(ctx, 'Mine', MineTools, Minerals, emoji, color, language);
    }
};
