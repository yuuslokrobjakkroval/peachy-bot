const { Event } = require("../../structures/index.js");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const Guild = require("../../schemas/guild"); // Assuming the guild model is in a schemas folder

module.exports = class GuildCreate extends Event {
  constructor(client, file) {
    super(client, file, {
      name: "guildCreate",
    });
  }

  async run(guild) {
    // Check if guild ID matches the specific ID to auto-leave
    if (guild.id === "1370047480460214323") {
      const logChannel = this.client.channels.cache.get(
        this.client.config.channel.log,
      );
      if (logChannel) {
        await logChannel
          .send(
            `Auto-leaving guild **${guild.name}** (ID: ${guild.id}) due to specific ID match.`,
          )
          .catch(console.error);
      }
      await guild
        .leave()
        .catch((err) =>
          console.error(`Failed to leave guild ${guild.id}:`, err),
        );
      return; // Exit the event after leaving
    }

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

    const logChannel = this.client.channels.cache.get(
      this.client.config.channel.log,
    );

    // Check if guild is banned
    if (guildData.isBanned) {
      if (logChannel) {
        await logChannel
          .send(
            `Leaving guild **${guild.name}** (ID: ${guild.id}) because it is blacklisted.`,
          )
          .catch(console.error);
      }
      await guild
        .leave()
        .catch((err) =>
          console.error(`Failed to leave guild ${guild.id}:`, err),
        );
      return; // Exit the event after leaving
    }

    // Check if joinCount exceeds 10
    if (guildData.joinCount > 10) {
      if (logChannel) {
        await logChannel
          .send(
            `Leaving guild **${guild.name}** (ID: ${guild.id}) due to excessive joins (${guildData.joinCount}).`,
          )
          .catch(console.error);
      }
      await guild
        .leave()
        .catch((err) =>
          console.error(`Failed to leave guild ${guild.id}:`, err),
        );
      return; // Exit the event after leaving
    }

    // Fetch guild owner
    let owner = guild.members.cache.get(guild.ownerId);
    if (!owner) {
      try {
        owner = await guild.fetchOwner();
      } catch {
        owner = { user: { tag: "Unknown#0000" } };
      }
    }

    // Send guild info to log channel
    await this.sendGuildInfo(guild, owner);
  }

  async sendGuildInfo(guild, owner) {
    const channel = this.client.channels.cache.get(
      this.client.config.channel.log,
    );
    if (!channel) {
      console.log("Log channel not found!");
      return;
    }

    const memberCount = guild.memberCount?.toString() || "Unknown";

    // Find a suitable channel for the invite
    let inviteChannel =
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

      // Build embed with guild info
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
              .replace(/ /g, " - "), // Replace spaces with " - "
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
