const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Blush extends Command {
    constructor(client) {
        super(client, {
            name: 'blush',
            description: {
                content: 'Express shyness with a blush.',
                examples: ['blush'],
                usage: 'blush',
            },
            category: 'emotes',
            aliases: [],
            cooldown: 5,
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

    async run(client, ctx, args, language) {
        return await ctx.sendMessage({
            embeds: [
                client
                    .embed()
                    .setColor(client.color.main)
                    .setTitle(client.i18n.get(language, 'commands', `${this.name}_success`, { displayName: ctx.author.displayName }))
                    .setImage(await Anime.blush()),
            ],
        });
    }
};

