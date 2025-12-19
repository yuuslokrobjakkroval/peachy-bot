const { Event } = require("../../structures/index.js");
const {
	ChannelType,
	PermissionFlagsBits,
	AuditLogEvent,
} = require("discord.js");
const Guild = require("../../schemas/guild");

module.exports = class GuildCreate extends Event {
	constructor(client, file) {
		super(client, file, {
			name: "guildCreate",
		});
	}

	async run(guild) {
		const logChannel = this.client.channels.cache.get(
			this.client.config.channel.log,
		);

		// --- helper: fetch inviter from audit logs (best-effort) ---
		const inviter = await this.fetchInviterSafe(guild).catch(() => null);

		// Fetch or update guild data in the database
		let guildData = await Guild.findOne({ guildId: guild.id });
		if (!guildData) {
			guildData = new Guild({
				guildId: guild.id,
				name: guild.name,
				ownerId: guild.ownerId,
				joinCount: 1, // Initialize with 1 for this join
			});
		} else {
			guildData.joinCount = (guildData.joinCount || 0) + 1; // Increment joinCount
			guildData.name = guild.name; // Sync name
		}
		await guildData.save();

		// Check if guild is banned
		if (guildData.isBanned) {
			if (logChannel) {
				await logChannel
					.send(
						`Leaving blacklisted guild **${guild.name}** (ID: ${guild.id}).${
							inviter ? ` Invited by **${inviter.tag}** (${inviter.id}).` : ""
						}`,
					)
					.catch(console.error);
			}
			await guild
				.leave()
				.catch((err) =>
					console.error(`Failed to leave guild ${guild.id}:`, err),
				);
			return;
		}

		// Check if joinCount exceeds 10
		if (guildData.joinCount > 10) {
			if (logChannel) {
				await logChannel
					.send(
						`Leaving guild **${guild.name}** (ID: ${guild.id}) due to excessive joins (${guildData.joinCount}).${
							inviter ? ` Invited by **${inviter.tag}** (${inviter.id}).` : ""
						}`,
					)
					.catch(console.error);
			}
			await guild
				.leave()
				.catch((err) =>
					console.error(`Failed to leave guild ${guild.id}:`, err),
				);
			return;
		}

		// Fetch guild owner
		let owner = guild.members.cache.get(guild.ownerId);
		if (!owner) {
			try {
				owner = await guild.fetchOwner();
			} catch {
				owner = { user: { tag: "Unknown#0000", id: guild.ownerId } };
			}
		}
		// Send guild info to log channel (now includes inviter when available)
		await this.sendGuildInfo(guild, owner, inviter);
	}

	/**
	 * Best-effort inviter fetch:
	 * - Requires VIEW_AUDIT_LOG permission
	 * - Looks for recent BotAdd entries targeting this bot
	 * - Uses a short lookback window to avoid mismatches
	 */
	async fetchInviterSafe(guild) {
		const me = guild.members.me;
		if (!me) return null;

		// Must have permission to view audit logs
		if (!me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
			return null;
		}

		try {
			// Fetch a few recent entries and find ours
			const logs = await guild.fetchAuditLogs({
				type: AuditLogEvent.BotAdd,
				limit: 5,
			});

			const now = Date.now();
			const LOOKBACK_MS = 10 * 60 * 1000; // 10 minutes window

			const entry = logs.entries.find((e) => {
				const isThisBot = e?.target?.id === this.client.user.id;
				const recentEnough =
					typeof e.createdTimestamp === "number"
						? now - e.createdTimestamp <= LOOKBACK_MS
						: true; // fallback if ts missing
				return isThisBot && recentEnough;
			});

			if (entry && entry.executor) {
				// Ensure we have a tag-like string
				const user = entry.executor;
				const tag =
					typeof user.tag === "string"
						? user.tag
						: `${user.username || "Unknown"}#${user.discriminator || "0000"}`;
				return { id: user.id, tag };
			}
		} catch (err) {
			// Silent fail to avoid breaking join flow
			console.error(`Failed to fetch inviter for ${guild.id}:`, err);
		}
		return null;
	}

	async sendGuildInfo(guild, owner, inviter) {
		const channel = this.client.channels.cache.get(
			this.client.config.channel.log,
		);
		if (!channel) {
			console.log("Log channel not found!");
			return;
		}

		const memberCount = guild.memberCount?.toString() || "Unknown";

		// Find a suitable channel for the invite
		const inviteChannel =
			guild.channels.cache.find((ch) => ch.type === ChannelType.GuildText) ||
			guild.channels.cache.find((ch) => ch.type === ChannelType.GuildVoice);
		if (!inviteChannel) {
			return channel
				.send("No suitable channels found to create an invite link.")
				.catch(console.error);
		}

		// Check permissions for invite creation
		if (
			!inviteChannel
				.permissionsFor(guild.members.me)
				.has(PermissionFlagsBits.CreateInstantInvite)
		) {
			return channel
				.send(
					"I don’t have permission to create an invite link in this channel.",
				)
				.catch(console.error);
		}

		try {
			// Create invite
			const invite = await inviteChannel.createInvite({
				maxAge: 0, // Permanent invite
				maxUses: 5, // Limited to 5 uses
				reason: "Requested by Peachy Dev",
			});
			const inviteLink = invite.url || `https://discord.gg/${invite.code}`;

			// Build embed with guild info (+ inviter if found)
			const embed = this.client
				.embed()
				.setColor(this.client.color.success)
				.setAuthor({
					name: guild.name,
					iconURL: guild.iconURL({ format: "jpeg" }),
				})
				.setDescription(`**${guild.name}** has been invited to the bot!`)
				.setThumbnail(guild.iconURL({ format: "jpeg" }))
				.addFields([
					{ name: "Owner", value: owner.user.tag, inline: true },
					{ name: "ID", value: guild.id, inline: true },
					{ name: "Members", value: memberCount, inline: true },
					...(inviter
						? [
								{
									name: "Invited By",
									value: `${inviter.tag} (${inviter.id})`,
									inline: true,
								},
							]
						: []),
					{ name: "Invite Link", value: inviteLink, inline: true },
					{
						name: "Join Count",
						value: (
							await Guild.findOne({ guildId: guild.id })
						).joinCount.toString(),
						inline: true,
					},
					{
						name: "Created At",
						value: new Date(guild.createdTimestamp)
							.toLocaleDateString("en-GB", {
								day: "2-digit", // DD (e.g., 25)
								month: "short", // MMM (e.g., Feb)
								year: "numeric", // YYYY (e.g., 2025)
							})
							.replace(/ /g, " - "),
						inline: true,
					},
				])
				.setTimestamp()
				.setFooter({
					text: "Thank you for inviting me!",
					iconURL: this.client.user.displayAvatarURL(),
				});

			await channel.send({ embeds: [embed] });
		} catch (err) {
			console.error("Failed to create invite or send message:", err);
			await channel
				.send("Failed to create an invite link or send guild info.")
				.catch(console.error);
		}
	}
};
