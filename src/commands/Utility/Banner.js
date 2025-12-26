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

module.exports = class Banner extends Command {
    constructor(client) {
        super(client, {
            name: 'banner',
            description: {
                content: "Displays a user's banner",
                examples: ['banner @User'],
                usage: 'banner [@User]',
            },
            category: 'utility',
            aliases: ['profilebanner', 'pfp-banner'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'The user to get the banner of',
                    type: 6,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const bannerMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.bannerMessages;
        if (!ctx.isInteraction) {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        if (!mention) {
            const errorMessage = bannerMessages?.noUserMentioned;
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const fetchedUser = await mention.fetch();
            const bannerURL = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

            if (!bannerURL) {
                const errorMessage = bannerMessages?.noBannerFound;
                return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
            }

            // Get banner URLs in different formats
            const bannerPNG = fetchedUser.bannerURL({
                extension: 'png',
                size: 4096,
            });
            const bannerJPG = fetchedUser.bannerURL({
                extension: 'jpg',
                size: 4096,
            });
            const bannerWEBP = fetchedUser.bannerURL({
                extension: 'webp',
                size: 4096,
            });
            // Check if user has an animated banner for GIF option
            const isAnimated = fetchedUser.banner?.startsWith('a_');
            const bannerGIF = isAnimated ? fetchedUser.bannerURL({ extension: 'gif', size: 4096 }) : null;

            // Create banner display with Components v2
            const bannerContainer = new ContainerBuilder()
                .setAccentColor(color.main)
                .addTextDisplayComponents((text) => text.setContent(`# **${emoji.mainLeft} BANNER ${emoji.mainRight}**`))
                .addSeparatorComponents((sep) => sep)
                .addMediaGalleryComponents((gallery) =>
                    gallery.addItems((item) => item.setURL(bannerURL).setDescription(`${mention.displayName || mention.username}'s Banner`))
                )
                .addSeparatorComponents((sep) => sep.setDivider(false))
                .addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents((text) => text.setContent('**Download Banner:**'))
                        .setButtonAccessory((button) => button.setLabel('🖼️ PNG').setStyle(ButtonStyle.Link).setURL(bannerPNG))
                )
                .addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents((text) => text.setContent('High quality JPG format'))
                        .setButtonAccessory((button) => button.setLabel('📸 JPG').setStyle(ButtonStyle.Link).setURL(bannerJPG))
                );

            // Add GIF button only if banner is animated
            if (bannerGIF) {
                bannerContainer.addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents((text) => text.setContent('Animated GIF format'))
                        .setButtonAccessory((button) => button.setLabel('✨ GIF').setStyle(ButtonStyle.Link).setURL(bannerGIF))
                );
            }

            bannerContainer
                .addSectionComponents((section) =>
                    section
                        .addTextDisplayComponents((text) => text.setContent('WebP format (smallest size)'))
                        .setButtonAccessory((button) => button.setLabel('📦 WEBP').setStyle(ButtonStyle.Link).setURL(bannerWEBP))
                )
                .addSeparatorComponents((sep) => sep.setDivider(false))
                .addActionRowComponents((row) =>
                    row.setComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId(`banner_select_${ctx.author.id}`)
                            .setPlaceholder('🎨 Select a user to view their banner')
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
                      components: [bannerContainer],
                      flags: MessageFlags.IsComponentsV2,
                  })
                : await ctx.editMessage({
                      content: '',
                      components: [bannerContainer],
                      flags: MessageFlags.IsComponentsV2,
                  });
        } catch (err) {
            const errorMessage = bannerMessages?.error;
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }
    }
};
