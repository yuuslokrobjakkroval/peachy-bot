const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Cry extends Command {
	constructor(client) {
		super(client, {
			name: "cry",
			description: {
				content: "Express a feeling of crying.",
				examples: ["cry"],
				usage: "cry",
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
		const cryMessages = language.locales.get(language.defaultLocale)
			?.emoteMessages?.cryMessages;
		const errorMessages = cryMessages.errors;

		try {
			// Ensure we are getting a valid random emoji from the list
			const cryEmoji = emoji.emotes?.cry || globalEmoji.emotes.cry;
			const randomEmoji = client.utils.getRandomElement(cryEmoji);

			// Constructing the embed with title, description, and image
			const embed = client
				.embed()
				.setColor(color.main)
				.setDescription(
					generalMessages.title
						.replace("%{mainLeft}", emoji.mainLeft)
						.replace("%{title}", "CRY")
						.replace("%{mainRight}", emoji.mainRight) +
						cryMessages.description.replace("%{user}", ctx.author.displayName),
				)
				.setImage(client.utils.emojiToImage(randomEmoji))
				.setFooter({
					text:
						generalMessages.requestedBy.replace(
							"%{username}",
							ctx.author.displayName,
						) || `Requested by ${ctx.author.displayName}`,
					iconURL: ctx.author.displayAvatarURL(),
				});

			// Send the embed to the channel with await
			return await ctx.sendMessage({ embeds: [embed] });
		} catch (error) {
			console.error("An error occurred in the Cry command:", error);
			// Add await and return for error message
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				errorMessages,
				color,
			);
		}
	}
};
