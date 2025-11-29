const { Command } = require("../../structures/index.js");

module.exports = class PrivacyPolicy extends Command {
	constructor(client) {
		super(client, {
			name: "privacy",
			description: {
				content: "Displays the bot's privacy policy",
				examples: ["privacy"],
				usage: "privacy",
			},
			category: "info",
			aliases: ["policy", "privacypolicy"],
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
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;
		const privacyMessages = language.locales.get(language.defaultLocale)
			?.informationMessages?.privacyMessages;

		const embed = this.client
			.embed()
			.setColor(color.main)
			.setTitle(privacyMessages.title)
			.setDescription(privacyMessages.description);

		// Add fields dynamically from the policies array
		privacyMessages.policies.forEach((policy) => {
			embed.addFields({
				name: policy.name,
				value: policy.value,
				inline: false,
			});
		});

		embed
			.setFooter({
				text: privacyMessages.footer.replace("{botName}", client.user.username),
				iconURL: client.user.displayAvatarURL(),
			})
			.setTimestamp();

		const supportButton = client.utils.linkButton(
			generalMessages.supportButton,
			client.config.links.support,
		);
		const inviteButton = client.utils.linkButton(
			generalMessages.inviteButton,
			client.config.links.invite,
		);
		// const voteButton = client.utils.linkButton(generalMessages.voteButton, client.config.links.vote)
		const row = client.utils.createButtonRow(supportButton, inviteButton);

		return await ctx.sendMessage({ embeds: [embed], components: [row] });
	}
};
