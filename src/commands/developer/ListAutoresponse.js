const { Command } = require('../../structures/index.js');
const Response = require('../../schemas/response');

module.exports = class ListAutoResponse extends Command {
    constructor(client) {
        super(client, {
            name: 'listautoresponse',
            description: {
                content: 'List all autoresponse triggers for this guild.',
                examples: ['listAutoResponse'],
                usage: 'listAutoResponse',
            },
            category: 'developer',
            aliases: ['lar'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const guildId = ctx.guild.id;
        const responseDoc = await Response.findOne({ guildId });

        if (!responseDoc || !responseDoc.autoresponse || responseDoc.autoresponse.length === 0) {
            return ctx.sendErrorMessage(client, ctx, 'No autoresponses found for this guild.', color)
        }

        const triggers = responseDoc.autoresponse.map(r => `Trigger: **${r.trigger}**\nResponse: **${r.response}**`);

        let chunks = client.utils.chunk(triggers, 10);
        if (chunks.length === 0) chunks = 1;

        const pages = [];
        for (let i = 0; i < chunks.length; i++) {
            const embed = this.client
                .embed()
                .setColor(color.main)
                .setDescription(chunks[i].join('\n\n'))
                .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            pages.push(embed);
        }

        return await client.utils.reactionPaginate(ctx, pages);
    }
};
