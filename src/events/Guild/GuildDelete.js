const { Event } = require("../../structures/index.js");
const Guild = require("../../schemas/guild");

module.exports = class GuildDelete extends Event {
  constructor(client, file) {
    super(client, file, {
      name: "guildDelete",
    });
  }

  async run(guild) {
    // Fetch or update guild data in the database
    let guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData) {
      guildData = new Guild({
        guildId: guild.id,
        name: guild.name,
        ownerId: guild.ownerId,
        leaveCount: 1, // Initialize with 1 for this leave
      });
    } else {
      guildData.leaveCount = (guildData.leaveCount || 0) + 1; // Increment leaveCount
      guildData.name = guild.name; // Sync name
    }

    // Check if leaveCount reaches 10 and blacklist the guild
    if (guildData.leaveCount >= 10 && !guildData.isBlacklisted) {
      guildData.isBlacklisted = true;
      guildData.blacklistReason = "Bot removed 10 or more times";
      const logChannel = this.client.channels.cache.get(
        this.client.config.channel.log
      );
      if (logChannel) {
        await logChannel
          .send(
            `Guild **${guild.name}** (ID: ${guild.id}) has been blacklisted due to excessive leaves (${guildData.leaveCount}).`
          )
          .catch(console.error);
      }
    }
    await guildData.save();

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
    await this.sendGuildInfo(guild, owner, guildData);
  }

  async sendGuildInfo(guild, owner, guildData) {
    const channel = this.client.channels.cache.get(
      this.client.config.channel.log
    );
    if (!channel) {
      console.log("Log channel not found!");
      return;
    }

    const memberCount = guild.memberCount?.toString() || "Unknown";

    // Build the embed message
    const embed = this.client
      .embed()
      .setColor(this.client.color.danger)
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ format: "jpeg" }),
      })
      .setDescription(`**${guild.name}** has removed the bot.`)
      .setThumbnail(guild.iconURL({ format: "jpeg" }))
      .addFields([
        { name: "Owner", value: owner.user.tag, inline: true },
        { name: "ID", value: guild.id, inline: true },
        { name: "Members", value: memberCount, inline: true },
        {
          name: "Leave Count",
          value: guildData.leaveCount.toString(),
          inline: true,
        },
        {
          name: "Blacklisted",
          value: guildData.isBlacklisted ? "Yes" : "No",
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
        text: "Sorry to see you go!",
        iconURL: this.client.user.displayAvatarURL(),
      });

    // Send the embed to the logging channel
    await channel
      .send({ embeds: [embed] })
      .catch((err) => console.error("Failed to send guild delete embed:", err));
  }
};
