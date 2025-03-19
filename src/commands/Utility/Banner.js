const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Banner extends Command {
    constructor(client) {
        super(client, {
            name: "banner",
            description: {
                content: "Displays a user's banner",
                examples: ["banner @User"],
                usage: "banner [@User]",
            },
            category: "utility",
            aliases: ["profilebanner", "pfp-banner"],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "user",
                    description: "The user to get the banner of",
                    type: 6,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const bannerMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.bannerMessages;
        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser("user") || ctx.author
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        if (!mention) {
            const errorMessage = bannerMessages?.noUserMentioned;
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const bannerURL = await mention.fetch().then(user => user.bannerURL({ dynamic: true, size: 1024 }));

            if (!bannerURL) {
                const errorMessage = bannerMessages?.noBannerFound;
                return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
            }

            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', `BANNER`)
                        .replace('%{mainRight}', emoji.mainRight)
                )
                .setImage(bannerURL)
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })
                .setTimestamp();

            return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
        } catch (err) {
            const errorMessage = bannerMessages?.error;
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }
    }
};