const { Command } = require("../../structures/index.js");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const Guild = require("../../schemas/guild"); // Assuming the guild model is in a models folder

module.exports = class GuildInfo extends Command {
  constructor(client) {
    super(client, {
      name: "guildinfo",
      description: {
        content: "Fetches detailed information about a guild and creates an invite link.",
        examples: ["guildinfo"],
        usage: "guildinfo <guild_id>",
      },
      category: "guild",
      aliases: ["ginfo"],
      cooldown: 3,
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
    const guild = this.client.guilds.cache.get(args[0]);
    if (!guild) {
      return client.utils.sendErrorMessage(client, ctx, "Guild not found.", color);
    }

    // Fetch guild owner
    let owner = await guild.members.fetch(guild.ownerId).catch(() => null);
    if (!owner) owner = { user: { tag: "Unknown#0000" } };

    // Fetch guild data from database
    const guildData = await Guild.findOne({ guildId: guild.id }) || {};

    // Find a suitable channel for the invite
    let channel = guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText
    ) || guild.channels.cache.find((ch) => ch.type === ChannelType.GuildVoice);
    if (!channel) {
      return client.utils.sendErrorMessage(
          client,
          ctx,
          "No suitable channels found to create an invite link.",
          color
      );
    }

    // Check invite creation permission
    if (
        !channel.permissionsFor(channel.guild.members.me).has([PermissionFlagsBits.CreateInstantInvite])
    ) {
      return client.utils.sendErrorMessage(
          client,
          ctx,
          "Sorry, I don't have permission to create an invite link in this channel.",
          color
      );
    }

    // Create invite
    let invite = await channel.createInvite({
      maxAge: 0,
      maxUses: 5,
      reason: `Requested by KYUU`,
    });
    let inviteLink = invite?.url || `https://discord.gg/${invite?.code}`;

    // Gather additional guild info
    const memberCount = guild.memberCount?.toString() || "Unknown";
    const banCount = guildData.bans?.length || 0;
    const joinCount = guildData.joinCount || 0;
    const leaveCount = guildData.leaveCount || 0;
    const isBlacklisted = guildData.isBlacklisted ? "Yes" : "No";

    // Build the embed
    const embed = client.embed()
        .setColor(color.main)
        .setAuthor({
          name: guild.name,
          iconURL: guild.iconURL({ format: "jpeg" }),
        })
        .setDescription(`Detailed information about **${guild.name}**.`)
        .setThumbnail(guild.iconURL({ format: "jpeg" }))
        .addFields([
          { name: "Owner", value: owner.user.tag, inline: true },
          { name: "ID", value: guild.id, inline: true },
          { name: "Members", value: memberCount, inline: true },
          { name: "Bans", value: banCount.toString(), inline: true },
          { name: "Joins", value: joinCount.toString(), inline: true },
          { name: "Leaves", value: leaveCount.toString(), inline: true },
          { name: "Blacklisted", value: isBlacklisted, inline: true },
          { name: "Invite Link", value: inviteLink, inline: true },
          {
            name: "Created At",
            value: new Date(guild.createdTimestamp).toLocaleDateString('en-GB', {
              day: '2-digit',        // DD (e.g., 25)
              month: 'short',        // MMM (e.g., Feb)
              year: 'numeric'        // YYYY (e.g., 2025)
            }).replace(/ /g, ' - '), // Replace spaces with " - "
            inline: true
          },
        ])
        .setTimestamp();

    // Add guild icon if available
    if (guildData.pfp || guild.iconURL()) {
      embed.setImage(guildData.pfp || guild.iconURL({ format: "jpeg" }));
    }

    await ctx.sendMessage({ embeds: [embed] });
  }
};