const { Command } = require("../../structures");
const Invite = require("../../schemas/inviteTracker");
const globalEmoji = require("../../utils/Emoji");

module.exports = class SyncInvites extends Command {
	constructor(client) {
		super(client, {
			name: "syncinvites",
			description: {
				content: "Sync all invite codes for the guild or all guilds.",
				examples: ["syncinvites", "syncinvites all"],
				usage: "syncinvites [all]",
			},
			category: "utility",
			aliases: ["si"],
			args: false,
			permissions: {
				dev: true,
				client: ["SendMessages", "ViewChannel", "EmbedLinks", "ManageGuild"],
				user: ["ManageGuild"],
			},
			slashCommand: false,
			options: [
				{
					name: "all",
					type: 5,
					description: "Sync invites for all guilds the bot is in.",
					required: false,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		const syncAll = args[0]?.toLowerCase() === "all"; // Check if syncing all guilds
		const guilds = syncAll ? [...client.guilds.cache.values()] : [ctx.guild];
		const totalGuilds = guilds.length;
		const resultMessages = [];
		let processedGuilds = 0;

		// Initial progress message
		const progressMessage = await ctx.sendDeferMessage(
			`Synchronizing invites${emoji.searching || globalEmoji.loading}`,
		);

		for (const guild of guilds) {
			try {
				const invites = await guild.invites.fetch();
				const inviteCodes = invites.map((invite) => invite.code);

				const dbInvites = await Invite.find({ guildId: guild.id });
				let removedCount = 0;

				for (const dbInvite of dbInvites) {
					if (!inviteCodes.includes(dbInvite.inviteCode)) {
						await dbInvite.deleteOne();
						removedCount++;
					}
				}

				const invitePromises = invites.map(async (invite) => {
					try {
						const existingInvite = await Invite.findOne({
							inviteCode: invite.code,
						});
						if (!existingInvite) {
							const newInvite = new Invite({
								guildId: guild.id,
								guildName: guild.name,
								inviteCode: invite.code,
								uses: invite.uses,
								userId: [],
								inviterId: invite.inviter.id,
								inviterTag: invite.inviter.tag,
							});
							await newInvite.save();
						} else {
							existingInvite.uses = invite.uses;
							await existingInvite.save();
						}
					} catch (error) {
						console.error(
							`Error handling invite for guild ${guild.name}:`,
							error,
						);
					}
				});

				await Promise.all(invitePromises);

				// Prepare a result message for the current guild
				const result =
					removedCount > 0
						? `**${guild.name}** - Removed **${removedCount}** outdated invite code(s), synchronized successfully.`
						: `**${guild.name}** - Synchronized successfully, no outdated invite codes.`;

				resultMessages.push(result);
			} catch (error) {
				if (error.code === 50013) {
					resultMessages.push(
						`**${guild.name}** - Insufficient permissions to fetch invites.`,
					);
				} else {
					resultMessages.push(
						`**${guild.name}** - An error occurred during synchronization.`,
					);
				}
			}

			// Update progress
			processedGuilds++;
			await progressMessage.edit(
				`Synchronizing invites${
					emoji.searching || globalEmoji.loading
				} (${processedGuilds}/${totalGuilds})`,
			);
		}

		// Split results into pages
		const chunks = client.utils.chunk(resultMessages, 10);
		const pages = [];

		for (let i = 0; i < chunks.length; i++) {
			const embed = client
				.embed()
				.setColor(color.main)
				.setTitle("Invite Synchronization Summary")
				.setDescription(chunks[i].join("\n\n"))
				.setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
			pages.push(embed);
		}

		// Final response with pagination
		await progressMessage.delete();
		if (pages.length === 1) {
			return ctx.sendMessage({ embeds: [pages[0]] });
		} else {
			return client.utils.reactionPaginate(ctx, pages);
		}
	}
};
