const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class UserInfo extends Command {
  constructor(client) {
    super(client, {
      name: "userinfo",
      description: {
        content: "Displays information about a user",
        examples: ["userinfo @User"],
        usage: "userinfo [@User]",
      },
      category: "utility",
      aliases: ["user", "whois"],
      cooldown: 3,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user to get info about",
          type: 6, // USER type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", globalEmoji.searching),
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", globalEmoji.searching),
      );
    }

    const target = ctx.isInteraction
      ? ctx.interaction.options.getUser("user") ||
        ctx.interaction.options.getMember("user") ||
        ctx.author
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        ctx.message.mentions.users.first() ||
        args[0];

    if (!target) {
      return ctx.sendErrorMessage(
        client,
        ctx,
        generalMessages?.userNotFound,
        color,
      );
    }
    const { guild } = ctx;
    const userId = typeof target === "string" ? target : target.id;
    const guildMember = guild.members.cache.get(userId);
    const user = guildMember?.user || target;

    // Fetch user to get banner
    let fetchedUser;
    try {
      fetchedUser = await client.users.fetch(userId, { force: true });
    } catch (error) {
      console.error("Error fetching user:", error);
    }

    const avatarURL = user.displayAvatarURL({
      dynamic: true,
      size: 1024,
      extension: "png",
    });
    const bannerURL =
      fetchedUser?.bannerURL({ format: "png", size: 1024 }) ||
      client.config.links.banner;

    // Create the main embed
    const mainEmbed = this.createMainEmbed(
      client,
      ctx,
      user,
      guildMember,
      guild,
      emoji,
      color,
      generalMessages,
      globalEmoji,
    );

    // Create buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("avatar")
        .setLabel("Avatar")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🖼️"),
      new ButtonBuilder()
        .setCustomId("banner")
        .setLabel("Banner")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🏞️"),
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

      if (interaction.customId === "avatar") {
        // Create avatar embed
        const avatarEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle(`${user.displayName}'s Avatar`)
          .setImage(avatarURL)
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName,
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          })
          .setTimestamp();

        // Create buttons for avatar view
        const avatarRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("home")
            .setLabel("Home")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏠"),
          new ButtonBuilder()
            .setCustomId("banner")
            .setLabel("Banner")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏞️"),
        );

        await interaction.update({
          embeds: [avatarEmbed],
          components: [avatarRow],
        });
      } else if (interaction.customId === "banner") {
        // Create banner embed
        const bannerEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle(`${user.displayName}'s Banner`)
          .setImage(bannerURL)
          .setFooter({
            text: fetchedUser?.bannerURL()
              ? ""
              : "This user does not have a custom banner.",
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
            .setCustomId("avatar")
            .setLabel("Avatar")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖼️"),
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
          .setCustomId("avatar_disabled")
          .setLabel("Avatar")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🖼️")
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("banner_disabled")
          .setLabel("Banner")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🏞️")
          .setDisabled(true),
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
    user,
    guildMember,
    guild,
    emoji,
    color,
    generalMessages,
    globalEmoji,
  ) {
    return client
      .embed()
      .setColor(color.main)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, extension: "png" }))
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", "USER INFO")
          .replace("%{mainRight}", emoji.mainRight),
      )
      .addFields([
        {
          name: `🆔 ID`,
          value: `${globalEmoji.arrow} **${user.id}**`,
          inline: false,
        },
        {
          name: `📛 Name`,
          value: `${globalEmoji.arrow} **${user.displayName}** (**${user.username}**)`,
          inline: false,
        },
        {
          name: `🙋 Joined ${guild.name} at`,
          value: `**${globalEmoji.arrow} ${
            guildMember?.joinedTimestamp
              ? `${Math.floor(
                  (Date.now() - guildMember.joinedTimestamp) /
                    (1000 * 60 * 60 * 24),
                )} days ago`
              : "N/A"
          }**`,
          inline: false,
        },
        {
          name: `🤖 Bot`,
          value: `${globalEmoji.arrow} **${user.bot ? "True" : "False"}**`,
          inline: false,
        },
        {
          name: `🚀 Boosted this server`,
          value: `${globalEmoji.arrow} **${
            guildMember?.premiumSince ? "True" : "False"
          }**`,
          inline: false,
        },
        {
          name: `⭐ Top role`,
          value: `${globalEmoji.arrow} **${
            guildMember?.roles.highest.name || "None"
          }**`,
          inline: false,
        },
        {
          name: "📅 Created At",
          value: `${globalEmoji.arrow} **${Math.floor(
            (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365),
          )}** years ago`,
          inline: false,
        },
      ])
      .setFooter({
        text:
          generalMessages.requestedBy.replace(
            "%{username}",
            ctx.author.displayName,
          ) || `Requested by ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();
  }
};
