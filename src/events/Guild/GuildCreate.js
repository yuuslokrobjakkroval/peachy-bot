const { Event } = require("../../structures/index.js");
const { ChannelType, PermissionFlagsBits } = require("discord.js");

module.exports = class GuildCreate extends Event {
  constructor(client, file) {
    super(client, file, {
      name: "guildCreate",
    });
  }

  run(guild) {
    let owner;
    owner = guild.members.cache.get(guild?.ownerId);
    if (!owner) {
      guild
        .fetchOwner()
        .then((fetchedOwner) => {
          owner = fetchedOwner;
          sendGuildInfo(this.client, guild, owner);
        })
        .catch(() => {
          owner = { user: { tag: "Unknown#0000" } };
          sendGuildInfo(this.client, guild, owner);
        });
    } else {
      sendGuildInfo(this.client, guild, owner);
    }

    function sendGuildInfo(client, guild, owner) {
      const channel = client.channels.cache.get(client.config.channel.log);
      if (!channel) {
        console.log("Channel not found!");
        return;
      }

      const memberCount = guild.memberCount
        ? guild.memberCount.toString()
        : "Unknown";

      let inviteChannel = guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText
      );
      if (!inviteChannel) {
        inviteChannel = guild.channels.cache.find(
          (ch) => ch.type === ChannelType.GuildVoice
        );
        if (!inviteChannel) {
          return channel
            .send("No suitable channels found to create an invite link.")
            .catch(console.error);
        }
      }

      if (
        !inviteChannel
          .permissionsFor(inviteChannel.guild.members.me)
          .has([PermissionFlagsBits.CreateInstantInvite])
      ) {
        return channel
          .send(
            "Sorry, I don't have permission to create an invite link in this channel."
          )
          .catch(console.error);
      }

      inviteChannel
        .createInvite({
          maxAge: 0,
          maxUses: 5,
          reason: "Requested by Peachy Dev",
        })
        .then((invite) => {
          let inviteLink = invite?.url || `https://discord.gg/${invite?.code}`;

          const embed = client
            .embed()
            .setColor(client.color.success)
            .setAuthor({
              name: guild.name,
              iconURL: guild.iconURL({ format: "jpeg" }),
            })
            .setDescription(
              `****${guild.name}**** has been invited to the bot!`
            )
            .setThumbnail(guild.iconURL({ format: "jpeg" }))
            .addFields([
              { name: "Owner", value: owner.user.tag, inline: true },
              { name: "ID", value: guild.id, inline: true },
              { name: "Members", value: memberCount, inline: true },
              {
                name: "Created At",
                value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                inline: true,
              },
              { name: "Invite Link", value: inviteLink, inline: true },
            ])
            .setTimestamp()
            .setFooter({
              text: "Thank you for inviting me!",
              iconURL: client.user.displayAvatarURL(),
            });

          channel.send({ embeds: [embed] }).catch(console.error);
        })
        .catch((err) => {
          console.error("Failed to create an invite:", err);
          channel.send("Failed to create an invite link.").catch(console.error);
        });
    }
  }
};
