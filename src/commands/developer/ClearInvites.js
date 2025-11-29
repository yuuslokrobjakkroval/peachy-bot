const { Command } = require("../../structures");
const InviteTrackerSchema = require("../../schemas/inviteTracker"); // Correct schema import

module.exports = class ClearInvite extends Command {
	constructor(client) {
		super(client, {
			name: "clearinvite",
			description: {
				content: "Clear invites from a user and reset their invite uses.",
				examples: ["clearinvite @user"],
				usage: "clearinvite <user>",
			},
			category: "dev",
			aliases: [],
			args: true,
			permissions: {
				dev: true,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: false,
			options: [],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const generalMessages = language.locales.get(
			language.defaultLocale,
		)?.generalMessages;
		const mention = ctx.isInteraction
			? ctx.interaction.options.getUser("user")
			: ctx.message.mentions.members.first() ||
				ctx.guild.members.cache.get(args[0]) ||
				ctx.author;

		if (mention && mention.user.bot) {
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				generalMessages.botTransfer,
				color,
			);
		}

		const embed = client
			.embed()
			.setColor(color.main)
			.setDescription(`${emoji.tick} Cleared all invites for ${mention}`);

		try {
			const guild = ctx.guild;
			const invites = await guild.invites.fetch();
			for (const invite of invites.values()) {
				if (invite.inviter && invite.inviter.id === mention.id) {
					try {
						await invite.delete();
						console.log(`Deleted invite with code: ${invite.code}`);
					} catch (error) {
						console.error("Error deleting invite:", error);
					}
				}
			}
			await InviteTrackerSchema.deleteMany({ inviterId: mention.id }).exec();
			return await ctx.sendMessage({ embeds: [embed] });
		} catch (err) {
			console.error(err);
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				"An error occurred while clearing the invites.",
				color,
			);
		}
	}
};
