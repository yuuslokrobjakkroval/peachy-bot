const Command = require('../../structures/Command.js');

module.exports = class Hug extends Command {
    constructor(client) {
        super(client, {
            name: 'hug',
            description: {
                content: 'Sends a warm hug to the mentioned user.',
                examples: ['hug @User'],
                usage: 'hug @User',
            },
            category: 'anime-actions',
            aliases: ['embrace'],
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
                    description: 'Mention the user you want to hug',
                    type: 6, // USER type
                    required: true,
                }
            ],
        });
    }

    async run(client, ctx) {
        const userMention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(ctx.args[0]);

        const actionMessage = `${ctx.author.username} gives ${userMention} a big, warm hug! 🤗`;

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`🤗 Hug Action!`)
            .setDescription(actionMessage);

        await ctx.sendMessage({ content: `${userMention}`, embeds: [embed] });
    }
};
