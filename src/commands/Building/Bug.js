const { Command } = require('../../structures/index.js');
const BugTools = require('../../assets/inventory/Tools/Bug.js');
const Bugs = require('../../assets/inventory/Base/Bugs.js');

module.exports = class Bug extends Command {
    constructor(client) {
        super(client, {
            name: 'bug',
            description: {
                content: 'Catch insects using nets and mini-games!',
                examples: ['bug'],
                usage: 'bug',
            },
            category: 'inventory',
            aliases: ['b'],
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
        return await client.resourceManager.gatherResource(ctx, 'Bug', BugTools, Bugs, emoji, color, language);
    }
};
