const { Command } = require("../../structures/index.js");
const { ChannelType, PermissionFlagsBits } = require("discord.js");

module.exports = class GuildListInvite extends Command {
	constructor(client) {
		super(client, {
			name: "guildlistinvite",
			description: {
				content:
					"Lists all guilds with an invite link where the bot can create invites.",
				examples: ["guildlistinvite"],
				usage: "guildlistinvite",
			},
			category: "guild",
			aliases: ["gli"],
			cooldown: 3,
			args: false,
			permissions: {
				dev: true,
				staff: true,
				client: ["SendMessages", "ViewChannel", "EmbedLinks"],
				user: [],
			},
			slashCommand: false,
			options: [],
		});
	}

	async run(client, ctx, args, color) {
		const guildInviteData = [];

		for (const guild of client.guilds.cache.values()) {
			let channel = guild.channels.cache.find(
				(ch) =>
					ch.type === ChannelType.GuildText &&
					ch
						.permissionsFor(guild.members.me)
						.has(PermissionFlagsBits.CreateInstantInvite),
			);

			if (!channel) {
				channel = guild.channels.cache.find(
					(ch) =>
						ch.type === ChannelType.GuildVoice &&
						ch
							.permissionsFor(guild.members.me)
							.has(PermissionFlagsBits.CreateInstantInvite),
				);
			}

			if (channel) {
				try {
					const invite = await channel.createInvite({
						maxAge: 0,
						maxUses: 5,
						reason: "Listing server invites",
					});
					guildInviteData.push(`**${guild.name}**\n**LINK**: ${invite.url}`);
				} catch (error) {
					console.error(
						`Failed to create invite for guild ${guild.name}:`,
						error,
					);
				}
			}
		}

		if (guildInviteData.length === 0) {
			return client.utils.sendErrorMessage(
				client,
				ctx,
				"No guild invites available.",
				color,
			);
		}

		const inviteChunks = client.utils.chunk(guildInviteData, 10);
		const pages = inviteChunks.map((chunk, index) => {
			return client
				.embed()
				.setColor(color.main)
				.setTitle("Guild Invite List")
				.setDescription(chunk.join("\n\n"))
				.setFooter({ text: `Page ${index + 1} of ${inviteChunks.length}` });
		});

		return await client.utils.reactionPaginate(ctx, pages);
	}
};
