const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class LeaveAll extends Command {
	constructor(client) {
		super(client, {
			name: "leaveall",
			description: {
				content:
					"Make the bot leave ALL guilds except the configured main guild and a hardcoded safe guild.",
				examples: ["leaveall --confirm"],
				usage: "leaveall [--confirm]",
			},
			category: "admin",
			aliases: ["leaveallservers", "leaveallguilds"],
			cooldown: 5,
			args: false,
			permissions: {
				dev: true,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: true,
			options: [
				{
					name: "confirm",
					description: "Confirm leaving all non-excluded servers",
					type: 5,
					required: false,
				},
			],
		});
	}

	async run(client, ctx, args, color, emoji, language) {
		try {
			// Parse confirmation argument
			let confirmed = false;
			if (ctx.isInteraction) {
				confirmed = ctx.interaction.options.getBoolean("confirm") || false;
			} else {
				confirmed = args.includes("--confirm") || args.includes("-c");
			}

			// Excluded guild IDs (main guild from config + hardcoded safe guild)
			const excluded = [client.config.guildId, "1371280484046344242"].filter(
				Boolean,
			);

			const allGuilds = Array.from(client.guilds.cache.values());
			const targetGuilds = allGuilds.filter((g) => !excluded.includes(g.id));

			if (targetGuilds.length === 0) {
				return await client.utils.sendErrorMessage(
					client,
					ctx,
					"No guilds to leave (all guilds are excluded).",
					color,
				);
			}

			// If not confirmed, show a warning and preview
			if (!confirmed) {
				const preview = targetGuilds
					.slice(0, 10)
					.map((g) => `${g.name} (${g.id})`)
					.join("\n");

				const embed = client
					.embed()
					.setColor(color.warning || 0xffa500)
					.setTitle("⚠️ Confirm leaving servers")
					.setDescription(
						`This will make the bot leave **${targetGuilds.length}** servers.\n\n` +
							`Excluded IDs: \`${excluded.join("`, `")}\`.\n\n` +
							`To proceed run this command again with 
• the flag: \`${client.config.prefix}${this.name} --confirm\` or use the slash option **confirm**.`,
					)
					.addFields({
						name: `Preview (${Math.min(targetGuilds.length, 10)})`,
						value: preview || "(no guilds to preview)",
					});

				return await ctx.sendMessage({ embeds: [embed] });
			}

			// Execute leaving
			const left = [];
			const failed = [];

			for (const guild of targetGuilds) {
				try {
					await guild.leave();
					left.push(`${guild.name} (${guild.id})`);
					// small pause to be a bit nicer with requests
					await client.utils.getSleep(350);
				} catch (err) {
					// Discord returns 10004 (Unknown Guild) if the guild no longer exists or the bot
					// has already been removed. Treat that as already-left and remove stale cache entry.
					const isUnknownGuild =
						err &&
						(err.code === 10004 ||
							err?.rawError?.code === 10004 ||
							err?.status === 404);

					if (isUnknownGuild) {
						// Remove stale cache entry if present
						try {
							client.guilds.cache.delete(guild.id);
						} catch (e) {
							// ignore
						}
						left.push(
							`${guild.name || "Unknown"} (${guild.id}) (already left)`,
						);
						continue;
					}

					console.error("Failed to leave guild:", guild.id, err);
					failed.push(`${guild.name} (${guild.id})`);
				}
			}

			const embed = client
				.embed()
				.setColor(color.main)
				.setTitle("✅ Leave operation completed")
				.setDescription(
					`${globalEmoji.result.tick} Left **${left.length}** servers.\n` +
						`${failed.length ? `Failed to leave **${failed.length}** servers.` : ""}`,
				);

			if (left.length > 0) {
				embed.addFields({
					name: "Left (sample)",
					value: left.slice(0, 10).join("\n"),
				});
			}
			if (failed.length > 0) {
				embed.addFields({
					name: "Failed (sample)",
					value: failed.slice(0, 10).join("\n"),
				});
			}

			return await ctx.sendMessage({ embeds: [embed] });
		} catch (error) {
			console.error("Error in leaveall command:", error);
			return await client.utils.sendErrorMessage(
				client,
				ctx,
				"An error occurred while trying to leave servers. Check the console for details.",
				color,
			);
		}
	}
};
