const { Command } = require('../../structures/index.js');
const globalEmoji = require('../../utils/Emoji.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

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
            aliases: ['emoji', 'emojisteal'],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AttachFiles'],
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
        const emojiMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.emojiMessages || {
            invalidEmoji: 'Invalid emoji provided.',
            emojiDescription: 'Here is the image of the emoji:',
            noEmojisFound: 'No valid emoji found in your input.',
        };

        if (ctx.isInteraction) {
            await ctx.interaction.deferReply();
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        // Get emoji input
        const emojiInput = ctx.isInteraction ? ctx.interaction.options.getString('emoji') : args.join(' ');

        if (!emojiInput) {
            return client.utils.sendErrorMessage(client, ctx, emojiMessages.invalidEmoji, color);
        }

        // Extract emoji from the input
        let emojiData = null;

        // Check for custom Discord emoji
        const customEmojiRegex = /<a?:([a-zA-Z0-9_]+):(\d+)>/;
        const customMatch = emojiInput.match(customEmojiRegex);

        if (customMatch) {
            const isAnimated = customMatch[0].startsWith('<a:');
            const emojiName = customMatch[1];
            const emojiId = customMatch[2];
            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;

            emojiData = {
                name: emojiName,
                id: emojiId,
                url: emojiURL,
                isAnimated,
            };
        }
        // Check for Unicode emoji if no custom emoji found
        else {
            // Unicode emoji regex
            const unicodeEmojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
            const unicodeMatch = emojiInput.match(unicodeEmojiRegex);

            if (unicodeMatch) {
                const unicodeEmoji = unicodeMatch[0];
                // Convert Unicode emoji to URL
                const codePoints = [...unicodeEmoji].map((char) => char.codePointAt(0).toString(16)).join('-');

                emojiData = {
                    name: 'emoji',
                    id: codePoints,
                    url: `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints}.png`,
                    isUnicode: true,
                };
            }
        }

        if (!emojiData) {
            return client.utils.sendErrorMessage(client, ctx, emojiMessages.noEmojisFound, color);
        }

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', 'EMOJI IMAGE')
                    .replace('%{mainRight}', emoji.mainRight) +
                    '\n\n' +
                    emojiMessages.emojiDescription
            )
            .setTitle(`${emojiData.name} ${emojiData.isUnicode ? '' : `(ID: ${emojiData.id})`}`)
            .setImage(emojiData.url)
            .setFooter({
                text:
                    generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        // Create download buttons for different formats
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`download_png`).setLabel('PNG').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`download_jpg`).setLabel('JPG').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`download_gif`).setLabel('GIF').setStyle(ButtonStyle.Secondary)
        );

        const message = ctx.isInteraction
            ? await ctx.interaction.editReply({ embeds: [embed], components: [row] })
            : await ctx.editMessage({ embeds: [embed], components: [row] });

        // Create collector for button interactions
        const collector = message.createMessageComponentCollector({
            time: 60000, // 1 minute timeout
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ctx.author.id) {
                return interaction.reply({
                    content: 'This button is not for you!',
                    flags: 64,
                });
            }

            // Reset collector timeout
            collector.resetTimer();

            const [action, format] = interaction.customId.split('_');

            if (action === 'download') {
                try {
                    // Download the emoji with image-friendly headers to avoid 415 errors
                    const response = await axios.get(emojiData.url, {
                        responseType: 'arraybuffer',
                        headers: {
                            Accept: 'image/*, */*',
                            'User-Agent': 'Mozilla/5.0 (compatible; PeachyBot/1.0)',
                        },
                    });
                    const buffer = Buffer.from(response.data);

                    const attachment = new AttachmentBuilder(buffer, {
                        name: `${emojiData.name}.${format}`,
                    });

                    await interaction.reply({
                        content: `Here's your emoji in ${format.toUpperCase()} format:`,
                        files: [attachment],
                        flags: 64,
                    });
                } catch (error) {
                    console.error('Error downloading emoji:', error);
                    await interaction.reply({
                        content: 'There was an error downloading the emoji. Please try again.',
                        flags: 64,
                    });
                }
            }
        });

        collector.on('end', async () => {
            // Disable all buttons when collector ends
            const disabledRow = new ActionRowBuilder();

            row.components.forEach((component) => {
                disabledRow.addComponents(ButtonBuilder.from(component).setDisabled(true));
            });

            // Try to update the message with disabled buttons
            try {
                if (ctx.isInteraction) {
                    await ctx.interaction.editReply({ components: [disabledRow] });
                } else {
                    await message.edit({ components: [disabledRow] });
                }
            } catch (error) {
                console.error('Error disabling buttons:', error);
            }
        });
    }
};
