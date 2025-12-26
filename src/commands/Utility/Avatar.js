const { Command } = require('../../structures/index.js');
const globalEmoji = require('../../utils/Emoji');
const {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    SeparatorBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    ActionRowBuilder,
    UserSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');

module.exports = class Avatar extends Command {
    constructor(client) {
        super(client, {
            name: 'avatar',
            description: {
                content: "Displays a user's avatar",
                examples: ['avatar @User'],
                usage: 'avatar [@User]',
            },
            category: 'utility',
            aliases: ['av', 'pfp'],
            cooldown: 3,
            args: false,
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
                    description: 'The user to get the avatar of',
                    type: 6, // USER type
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const avatarMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.avatarMessages;
        if (!ctx.isInteraction) {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        if (!mention) {
            const errorMessage = avatarMessages?.noUserMentioned || 'No user mentioned';
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        // Get avatar URLs in different formats
        const avatarPNG = mention.displayAvatarURL({
            extension: 'png',
            size: 4096,
        });
        const avatarJPG = mention.displayAvatarURL({
            extension: 'jpg',
            size: 4096,
        });
        const avatarWEBP = mention.displayAvatarURL({
            extension: 'webp',
            size: 4096,
        });
        // Check if user has an animated avatar for GIF option
        const isAnimated = mention.avatar?.startsWith('a_');
        const avatarGIF = isAnimated ? mention.displayAvatarURL({ extension: 'gif', size: 4096 }) : null;

        // Create avatar display with Components v2
        const avatarContainer = new ContainerBuilder()
            .setAccentColor(color.main)
            .addTextDisplayComponents((text) => text.setContent(`# **${emoji.mainLeft} AVATAR ${emoji.mainRight}**`))
            .addSeparatorComponents((sep) => sep)
            .addMediaGalleryComponents((gallery) =>
                gallery.addItems((item) =>
                    item
                        .setURL(
                            mention.displayAvatarURL({
                                dynamic: true,
                                extension: 'png',
                                size: 1024,
                            })
                        )
                        .setDescription(`${mention.displayName || mention.username}'s Full Avatar`)
                )
            )
            .addSeparatorComponents((sep) => sep.setDivider(false))
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents((text) => text.setContent('**Download Avatar:**'))
                    .setButtonAccessory((button) => button.setLabel('🖼️ PNG').setStyle(ButtonStyle.Link).setURL(avatarPNG))
            )
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents((text) => text.setContent('High quality JPG format'))
                    .setButtonAccessory((button) => button.setLabel('📸 JPG').setStyle(ButtonStyle.Link).setURL(avatarJPG))
            );

        // Add GIF button only if avatar is animated
        if (avatarGIF) {
            avatarContainer.addSectionComponents((section) =>
                section
                    .addTextDisplayComponents((text) => text.setContent('Animated GIF format'))
                    .setButtonAccessory((button) => button.setLabel('✨ GIF').setStyle(ButtonStyle.Link).setURL(avatarGIF))
            );
        }

        avatarContainer
            .addSectionComponents((section) =>
                section
                    .addTextDisplayComponents((text) => text.setContent('WebP format (smallest size)'))
                    .setButtonAccessory((button) => button.setLabel('📦 WEBP').setStyle(ButtonStyle.Link).setURL(avatarWEBP))
            )
            .addSeparatorComponents((sep) => sep.setDivider(false))
            .addActionRowComponents((row) =>
                row.setComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(`avatar_select_${ctx.author.id}`)
                        .setPlaceholder('🖼️ Select a user to view their avatar')
                        .setMinValues(1)
                        .setMaxValues(1)
                )
            )
            .addTextDisplayComponents((text) =>
                text.setContent(
                    `${generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`}`
                )
            );

        return ctx.isInteraction
            ? await ctx.interaction.editReply({
                  content: '',
                  components: [avatarContainer],
                  flags: MessageFlags.IsComponentsV2,
              })
            : await ctx.editMessage({
                  content: '',
                  components: [avatarContainer],
                  flags: MessageFlags.IsComponentsV2,
              });
    }
};
