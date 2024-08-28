const Command = require('../../structures/Command.js');

module.exports = class Slap extends Command {
    constructor(client) {
        super(client, {
            name: 'slap',
            description: {
                content: 'Sends a playful slap to the mentioned user.',
                examples: ['slap @User'],
                usage: 'slap @User',
            },
            category: 'anime-actions',
            aliases: ['smack'],
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
                    description: 'Mention the user you want to slap',
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

        const actionMessage = `${ctx.author.username} playfully slaps ${userMention}! 👋`;

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`👋 Slap Action!`)
            .setDescription(actionMessage);

        await ctx.sendMessage({ content: `${userMention}`, embeds: [embed] });
    }
};
