const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Cuddle extends Command {
    constructor(client) {
        super(client, {
            name: 'cuddle',
            description: {
                content: 'Random cuddle anime actions',
                examples: ['cuddle @user'],
                usage: 'cuddle <user>',
            },
            category: 'actions',
            aliases: [],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'The user you want to cuddle with.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }
    async run(client, ctx, args, language) {
        const author = ctx.author;
        const target = ctx.isInteraction
            ? ctx.interaction.options.data[0]?.member
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]);

        if (!target || target.id === author.id) {
            let errorMessage = '';
            if (!target) errorMessage += client.i18n.get(language, 'commands', 'no_user');
            if (target.id === author.id) errorMessage += client.i18n.get(language, 'commands', 'mention_to_self');

            return await client.utils.sendErrorMessage(client, ctx, errorMessage);
        }

        return await ctx.sendMessage({
            embeds: [
                client
                    .embed()
                    .setColor(client.color.main)
                    .setTitle(
                        client.i18n.get(language, 'commands', `${this.name}_success`, {
                            displayName: author.displayName,
                            target: target.displayName,
                        })
                    )
                    .setImage(await Anime.cuddle()),
            ],
        });
    }
};

