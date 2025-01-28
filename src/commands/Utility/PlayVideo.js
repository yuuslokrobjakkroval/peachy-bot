const { Command } = require("../../structures/index.js");

module.exports = class PlayVideo extends Command {
    constructor(client) {
        super(client, {
            name: "playvideo",
            description: {
                content: "Displays a video in an embed.",
                examples: ["playvideo <video_url>"],
                usage: "playvideo <video_url>",
            },
            category: "utility",
            aliases: ["videoembed", "embedvideo"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "url",
                    description: "The direct video URL to display",
                    type: 3, // STRING type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        
        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
        }

        const videoURL = ctx.isInteraction
            ? ctx.interaction.options.getString("url")
            : args[0];

        try {
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', `𝐕𝐈𝐃𝐄𝐎`)
                        .replace('%{mainRight}', emoji.mainRight)
                )
                .setVideo(videoURL) // Adds the video to the embed
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })
                .setTimestamp();

            return ctx.isInteraction
                ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
                : await ctx.editMessage({ content: "", embeds: [embed] });
        } catch (err) {
            const errorMessage = "An error occurred while processing your request.";
            return ctx.isInteraction
                ? await ctx.interaction.editReply({ content: errorMessage })
                : await ctx.editMessage({ content: errorMessage});
        }
    }
};