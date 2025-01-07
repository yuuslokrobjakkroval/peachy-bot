const { Command } = require("../../structures/index.js");

module.exports = class Sticker extends Command {
    constructor(client) {
        super(client, {
            name: "sticker",
            description: {
                content: "𝑮𝒆𝒏𝒆𝒓𝒂𝒕𝒆 𝒂𝒏 𝒊𝒎𝒂𝒈𝒆 𝒐𝒇 𝒂 𝒔𝒕𝒊𝒄𝒌𝒆𝒓 𝒇𝒓𝒐𝒎 𝒕𝒉𝒆 𝒔𝒆𝒓𝒗𝒆𝒓",
                examples: ["sticker :sticker:"],
                usage: "sticker <sticker>",
            },
            category: "utility",
            aliases: [],
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
                    name: "sticker",
                    description: "The sticker to display",
                    type: 3, // STRING type for sticker input
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const stickerMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.stickerMessages;

        const stickerInput = ctx.isInteraction ? ctx.interaction.options.getString("sticker") : args[0];

        if (!stickerInput) {
            const errorMessage = stickerMessages?.invalidSticker || "Invalid sticker provided.";
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        // Assuming `client.utils.stickerToImage()` fetches the sticker image URL
        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐈𝐌𝐀𝐆𝐄")
                    .replace('%{mainRight}', emoji.mainRight) +
                stickerMessages?.stickerDescription || "Here is the image of the sticker:"
            )
            .setImage(client.utils.stickerToImage(stickerInput))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        ctx.sendMessage({ embeds: [embed] });
    }
};
