const { Command } = require('../../structures/index.js');
const globalEmoji = require('../../utils/Emoji');

module.exports = class Emoji extends Command {
    constructor(client) {
        super(client, {
            name: 'emoji',
            description: {
                content: 'Generate an emoji image from the server',
                examples: ['emoji :emoji:'],
                usage: 'emoji <emoji>',
            },
            category: 'utility',
            aliases: [],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'emoji',
                    description: 'The emoji to display',
                    type: 3, // STRING type for emoji input
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const emojiMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.emojiMessages;

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        const emojiInput = ctx.isInteraction ? ctx.interaction.options.getString('emoji') : args[0];

        if (!emojiInput) {
            const errorMessage = emojiMessages?.invalidEmoji || 'Invalid emoji provided.';
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'EMOJI IMAGE')
                    .replace('%{mainRight}', emoji.mainRight) + emojiMessages?.emojiDescription || 'Here is the image of the emoji:'
            )
            .setImage(client.utils.emojiToImage(emojiInput))
            .setFooter({
                text:
                    generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        return ctx.isInteraction
            ? await ctx.interaction.editReply({ content: '', embeds: [embed] })
            : await ctx.editMessage({ content: '', embeds: [embed] });
    }
};
