const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Sad extends Command {
	constructor(client) {
		super(client, {
			name: "sad",
			description: {
				content: "Express a feeling of sadness.",
				examples: ["sad"],
				usage: "sad",
			},
			category: "emotes",
			aliases: [],
			cooldown: 3,
			args: false,
			permissions: {
				dev: false,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;
		const sadMessages = language.locales.get(language.defaultLocale)
			?.emoteMessages?.sadMessages;
		const errorMessages = sadMessages.errors;

		try {
			// Get random sad emoji
			const sadEmoji = emoji.emotes?.sad || globalEmoji.emotes.sad;
			const randomEmote = client.utils.getRandomElement(sadEmoji);
			const emoteImageUrl = client.utils.emojiToImage(randomEmote);

			// Construct the embed with title moved to the description
			const embed = client
				.embed()
				.setColor(color.main)
				.setDescription(
					generalMessages.title
						.replace("%{mainLeft}", emoji.mainLeft)
						.replace("%{title}", "SAD")
						.replace("%{mainRight}", emoji.mainRight) +
						sadMessages.description.replace("%{user}", ctx.author.displayName),
				)
				.setImage(emoteImageUrl)
				.setFooter({
					text:
						generalMessages.requestedBy.replace(
							"%{username}",
							ctx.author.displayName,
						) || `Requested by ${ctx.author.displayName}`,
					iconURL: ctx.author.displayAvatarURL(),
				});

			// Send the embed message
			return await ctx.sendMessage({ embeds: [embed] });
		} catch (error) {
			// Error handling for any unexpected errors
			console.error("Error processing sad command:", error);
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				errorMessages,
				color,
			); // Use localized error message
		}
	}
};
