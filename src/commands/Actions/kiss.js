const Command = require('../../structures/Command.js');

module.exports = class Kiss extends Command {
    constructor(client) {
        super(client, {
            name: 'kiss',
            description: {
                content: 'Sends a kiss to the mentioned user.',
                examples: ['kiss @User'],
                usage: 'kiss @User',
            },
            category: 'anime-actions',
            aliases: ['smooch'],
            cooldown: 3,
            args: true,
            player: {
                voice: false,
                dj: false,
                active: false,
                djPerm: null,
            },
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'Mention the user you want to kiss',
                    type: 6, // USER type
                    required: true,
                }
            ],
        });
    }

    async run(client, ctx) {
        const userMention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(ctx.args[0]); // Handle both interaction and message

        const actionMessage = `${ctx.author.username} sends a sweet kiss to ${userMention}! 😘`;

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`💋 Kiss Action!`)
            .setDescription(actionMessage);

        await ctx.sendMessage({ content: `${userMention}`, embeds: [embed], components: [] });
    }
};
