const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const verificationLevels = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Very High",
};

module.exports = class ServerInfo extends Command {
  constructor(client) {
    super(client, {
      name: "serverinfo",
      description: {
        content: "Displays information about the server",
        examples: ["serverinfo"],
        usage: "serverinfo",
      },
      category: "utility",
      aliases: ["guildinfo", "server", "sv"],
      cooldown: 3,
      args: false,
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
      language.defaultLocale
    )?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    }

    const { guild } = ctx;

    // Fetch all members of the guild
    const members = await guild.members.fetch();

    const onlineCount = members.filter(
      (member) => member.presence?.status === "online"
    ).size;
    const idleCount = members.filter(
      (member) => member.presence?.status === "idle"
    ).size;
    const dndCount = members.filter(
      (member) => member.presence?.status === "dnd"
    ).size;
    const offlineCount = members.filter(
      (member) => !member.presence || member.presence?.status === "offline"
    ).size;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Count members offline for 7 days and 30 days
    const offline7Days = members.filter(
      (member) => !member.presence && member.joinedTimestamp < sevenDaysAgo
    ).size;

    const offline30Days = members.filter(
      (member) => !member.presence && member.joinedTimestamp < thirtyDaysAgo
    ).size;

    // Get server icon and banner URLs
    const iconURL = guild.iconURL({
      dynamic: true,
      size: 1024,
      extension: "png",
    });
    const bannerURL =
      guild.bannerURL({ size: 1024 }) || client.config.links.banner;

    // Create the main embed
    const mainEmbed = this.createMainEmbed(
      client,
      ctx,
      guild,
      members,
      onlineCount,
      idleCount,
      dndCount,
      offlineCount,
      offline7Days,
      offline30Days,
      color,
      emoji,
      generalMessages,
      globalEmoji,
      bannerURL
    );

    // Create buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("icon")
        .setLabel("Avatar")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🖼️"),
      new ButtonBuilder()
        .setCustomId("banner")
        .setLabel("Banner")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🏞️")
    );

    // Send the initial message with buttons
    const message = ctx.isInteraction
      ? await ctx.interaction.editReply({
          content: "",
          embeds: [mainEmbed],
          components: [row],
        })
      : await ctx.editMessage({
          content: "",
          embeds: [mainEmbed],
          components: [row],
        });

    // Create collector for button interactions
    const collector = message.createMessageComponentCollector({
      time: 60000, // 1 minute timeout
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.author.id) {
        return interaction.reply({
          content: "This button is not for you!",
          flags: 64,
        });
      }

      // Reset collector timeout
      collector.resetTimer();

      if (interaction.customId === "icon") {
        // Create icon embed
        const iconEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle(`${guild.name}'s Icon`)
          .setImage(iconURL || "https://cdn.discordapp.com/embed/avatars/0.png") // Default icon if none exists
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          })
          .setTimestamp();

        // Create buttons for icon view
        const iconRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("home")
            .setLabel("Home")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏠"),
          new ButtonBuilder()
            .setCustomId("banner")
            .setLabel("Banner")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏞️")
        );

        await interaction.update({
          embeds: [iconEmbed],
          components: [iconRow],
        });
      } else if (interaction.customId === "banner") {
        // Create banner embed
        const bannerEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle(`${guild.name}'s Banner`)
          .setImage(bannerURL)
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          })
          .setTimestamp();

        // Create buttons for banner view
        const bannerRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("home")
            .setLabel("Home")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏠"),
          new ButtonBuilder()
            .setCustomId("icon")
            .setLabel("Avatar")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖼️")
        );

        await interaction.update({
          embeds: [bannerEmbed],
          components: [bannerRow],
        });
      } else if (interaction.customId === "home") {
        // Return to main embed
        await interaction.update({ embeds: [mainEmbed], components: [row] });
      }
    });

    collector.on("end", async () => {
      // Disable all buttons when collector ends
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("icon_disabled")
          .setLabel("Avatar")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🖼️")
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("banner_disabled")
          .setLabel("Banner")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🏞️")
          .setDisabled(true)
      );

      // Try to update the message with disabled buttons
      try {
        if (ctx.isInteraction) {
          await ctx.interaction.editReply({ components: [disabledRow] });
        } else {
          await message.edit({ components: [disabledRow] });
        }
      } catch (error) {
        console.error("Error disabling buttons:", error);
      }
    });
  }

  // Helper method to create the main embed
  createMainEmbed(
    client,
    ctx,
    guild,
    members,
    onlineCount,
    idleCount,
    dndCount,
    offlineCount,
    offline7Days,
    offline30Days,
    color,
    emoji,
    generalMessages,
    globalEmoji,
    bannerURL
  ) {
    return client
      .embed()
      .setColor(color.main)
      .setThumbnail(guild.iconURL({ dynamic: true, extension: "png" }))
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", "SERVER INFO")
          .replace("%{mainRight}", emoji.mainRight)
      )
      .addFields([
        {
          name: `🆔 ID`,
          value: `${globalEmoji.arrow} **${guild.id}**`,
          inline: false,
        },
        {
          name: `📛 Name`,
          value: ` ${globalEmoji.arrow} **${guild.name}**`,
          inline: false,
        },
        {
          name: `👑 Owner`,
          value: `${globalEmoji.arrow} **<@${guild.ownerId}>**`,
          inline: false,
        },
        {
          name: "🔒 Verification",
          value: `${globalEmoji.arrow} ${
            verificationLevels[guild.verificationLevel]
          }`,
          inline: false,
        },
        {
          name: "📊 Channel",
          value: `Categories ${globalEmoji.arrow} **${
            guild.channels.cache.filter((ch) => ch.type === 4).size
          }**\nText channels ${globalEmoji.arrow} **${
            guild.channels.cache.filter((ch) => ch.type === 0).size
          }**\nVoice channels ${globalEmoji.arrow} **${
            guild.channels.cache.filter((ch) => ch.type === 2).size
          }**`,
          inline: false,
        },
        {
          name: "🧍 Member Status",
          value: `Online ${globalEmoji.arrow} **${onlineCount}** members\nIdle ${globalEmoji.arrow} **${idleCount}** members\nDo Not Disturb ${globalEmoji.arrow} **${dndCount}** members\nOffline ${globalEmoji.arrow} **${offlineCount}** members`,
          inline: false,
        },
        {
          name: "📅 Offline Members",
          value: `7 Days ${globalEmoji.arrow} **${offline7Days}** members\n30 Days ${globalEmoji.arrow} **${offline30Days}** members`,
          inline: false,
        },
        {
          name: "🚀 Boost Info",
          value: `Boosts ${globalEmoji.arrow} **${
            guild.premiumSubscriptionCount || 0
          }**\nBoost level ${globalEmoji.arrow} **${guild.premiumTier}**`,
          inline: false,
        },
        {
          name: "🎭 Roles and Emoji",
          value: `Roles ${globalEmoji.arrow} **${guild.roles.cache.size}**\nEmoji ${globalEmoji.arrow} **${guild.emojis.cache.size}**\nSticker ${globalEmoji.arrow} **${guild.stickers.cache.size}**`,
          inline: false,
        },
        {
          name: "👥 Total Members",
          value: `${globalEmoji.arrow} **${guild.memberCount}** members`,
          inline: false,
        },
        {
          name: "📅 Created At",
          value: `${globalEmoji.arrow} ${new Date(guild.createdTimestamp)
            .toLocaleDateString("en-GB", {
              day: "2-digit", // DD (e.g., 25)
              month: "short", // MMM (e.g., Feb)
              year: "numeric", // YYYY (e.g., 2025)
            })
            .replace(/ /g, " - ")}`, // Replace spaces with " - "
          inline: false,
        },
      ])
      .setImage(bannerURL)
      .setFooter({
        text:
          generalMessages.requestedBy.replace(
            "%{username}",
            ctx.author.displayName
          ) || `Requested by ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();
  }
};
