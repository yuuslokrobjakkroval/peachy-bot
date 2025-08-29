const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class Facebook extends Command {
  constructor(client) {
    super(client, {
      name: "facebook",
      description: {
        content: `Manage your Facebook profile with style! 🌟`,
        examples: [
          "facebook - Shows your current Facebook details.",
          "facebook @mention - Shows the Facebook details of the mentioned user.",
          "facebook name YourFacebookName - Sets your Facebook name.",
          "facebook link https://facebook.com/YourFacebookLink - Sets your Facebook link.",
          "facebook clear - Clears your Facebook information.",
          "facebook help - Shows detailed command usage examples.",
        ],
        usage:
          "facebook\nfacebook @mention\nfacebook name <YourFacebookName>\nfacebook link <YourFacebookLink>\nfacebook clear\nfacebook help",
      },
      category: "profile",
      aliases: ["fb"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "name",
          description: "Sets your Facebook name in the profile card.",
          type: 1, // Sub-command type
          options: [
            {
              name: "name",
              description: "The Facebook name to set (up to 50 characters).",
              type: 3, // String type
              required: true,
            },
          ],
        },
        {
          name: "link",
          description: "Sets your Facebook link in the profile card.",
          type: 1, // Sub-command type
          options: [
            {
              name: "link",
              description: "The Facebook link to set.",
              type: 3, // String type
              required: true,
            },
          ],
        },
        {
          name: "view",
          description: "View Facebook profile information.",
          type: 1, // Sub-command type
          options: [
            {
              name: "user",
              description: "The user whose Facebook profile to view.",
              type: 6, // User type
              required: false,
            },
          ],
        },
        {
          name: "clear",
          description: "Clear your Facebook information.",
          type: 1, // Sub-command type
        },
        {
          name: "help",
          description: "Shows command usage examples and information.",
          type: 1, // Sub-command type
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const fbMessages = language.locales.get(language.defaultLocale)
      ?.socialMessages?.fbMessages;

    const subCommand = ctx.isInteraction
      ? ctx.interaction.options.getSubcommand()
      : args[0];

    const mentionedUser = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first() ||
        ctx.guild.members.cache.get(args[0]);

    // Handle different subcommands
    switch (subCommand) {
      case "name":
        return this.setFacebookName(
          client,
          ctx,
          args,
          color,
          emoji,
          fbMessages,
        );
      case "link":
        return this.setFacebookLink(
          client,
          ctx,
          args,
          color,
          emoji,
          fbMessages,
        );
      case "view":
        return this.viewFacebookProfile(
          client,
          ctx,
          mentionedUser,
          color,
          emoji,
          fbMessages,
        );
      case "clear":
        return this.clearFacebookProfile(client, ctx, color, emoji, fbMessages);
      case "help":
        return this.showHelpMessage(client, ctx, color, emoji, fbMessages);
      default:
        return this.viewFacebookProfile(
          client,
          ctx,
          mentionedUser,
          color,
          emoji,
          fbMessages,
        );
    }
  }

  async setFacebookName(client, ctx, args, color, emoji, fbMessages) {
    const name = ctx.isInteraction
      ? ctx.interaction.options.getString("name")
      : args.slice(1).join(" ");

    if (!name || name.length < 2 || name.length > 50) {
      const embed = client
        .embed()
        .setColor(color.danger)
        .setTitle(`${emoji.social.facebook} Facebook Name Error`)
        .setDescription(
          "❌ **Invalid Facebook name!**\n\n📝 **Requirements:**\n• Length: 2-50 characters\n• Use your real name or display name\n• No special characters",
        )
        .addFields([
          {
            name: "✅ Example",
            value: "`/facebook name John Smith`",
            inline: false,
          },
        ])
        .setFooter({ text: "💡 Tip: Use a name people can easily recognize!" });

      return ctx.sendMessage({ embeds: [embed] });
    }

    try {
      await Users.updateOne(
        { userId: ctx.author.id },
        { $set: { "social.facebook.name": name } },
        { upsert: true },
      );

      const embed = client
        .embed()
        .setColor(color.success)
        .setTitle(`${emoji.social.facebook} Facebook Name Updated!`)
        .setDescription(`🎉 **Successfully set your Facebook name!**`)
        .addFields([
          {
            name: "📝 New Facebook Name",
            value: `\`${name}\``,
            inline: false,
          },
          {
            name: "🔗 Next Step",
            value:
              "Set your Facebook link with:\n`/facebook link https://facebook.com/yourprofile`",
            inline: false,
          },
        ])
        .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: "Your social profile is looking great! 🌟" });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("facebook_set_link")
          .setLabel("Set Facebook Link")
          .setEmoji("🔗")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("view_socials")
          .setLabel("View All Socials")
          .setEmoji("📱")
          .setStyle(ButtonStyle.Secondary),
      );

      return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
    } catch (error) {
      return this.handleError(
        client,
        ctx,
        color,
        "Failed to update Facebook name. Please try again later.",
      );
    }
  }

  async setFacebookLink(client, ctx, args, color, emoji, fbMessages) {
    const link = ctx.isInteraction
      ? ctx.interaction.options.getString("link")
      : args.slice(1).join(" ");

    // Enhanced Facebook URL validation
    const facebookUrlPattern =
      /^https?:\/\/(www\.)?(facebook\.com|fb\.com|m\.facebook\.com)\/.+/i;

    if (!link || !facebookUrlPattern.test(link)) {
      const embed = client
        .embed()
        .setColor(color.danger)
        .setTitle(`${emoji.social.facebook} Facebook Link Error`)
        .setDescription(
          "❌ **Invalid Facebook link!**\n\n🔗 **Accepted formats:**",
        )
        .addFields([
          {
            name: "✅ Valid Examples",
            value:
              "• `https://facebook.com/yourprofile`\n• `https://www.facebook.com/yourprofile`\n• `https://fb.com/yourprofile`\n• `https://m.facebook.com/yourprofile`",
            inline: false,
          },
          {
            name: "📝 Requirements",
            value:
              "• Must start with http:// or https://\n• Must be a Facebook domain\n• Must include a profile path",
            inline: false,
          },
        ])
        .setFooter({
          text: "💡 Tip: Copy the link directly from your Facebook profile!",
        });

      return ctx.sendMessage({ embeds: [embed] });
    }

    try {
      const user = await Users.findOne({ userId: ctx.author.id });
      const currentName = user?.social?.facebook?.name;

      await Users.updateOne(
        { userId: ctx.author.id },
        { $set: { "social.facebook.link": link } },
        { upsert: true },
      );

      const embed = client
        .embed()
        .setColor(color.success)
        .setTitle(`${emoji.social.facebook} Facebook Link Updated!`)
        .setDescription(`🎉 **Successfully set your Facebook link!**`)
        .addFields([
          {
            name: "🔗 New Facebook Link",
            value: `[Visit Profile](${link})`,
            inline: false,
          },
        ])
        .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
        .setURL(link);

      if (!currentName) {
        embed.addFields([
          {
            name: "📝 Next Step",
            value: "Set your Facebook name with:\n`/facebook name YourName`",
            inline: false,
          },
        ]);
      } else {
        embed.addFields([
          {
            name: "✨ Profile Complete",
            value: `Your Facebook profile is now fully configured!\nName: \`${currentName}\``,
            inline: false,
          },
        ]);
      }

      embed.setFooter({ text: "Your social profile is looking awesome! 🌟" });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(link)
          .setLabel("Visit Facebook Profile")
          .setEmoji(emoji.social.facebook)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setCustomId("view_socials")
          .setLabel("View All Socials")
          .setEmoji("📱")
          .setStyle(ButtonStyle.Secondary),
      );

      return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
    } catch (error) {
      return this.handleError(
        client,
        ctx,
        color,
        "Failed to update Facebook link. Please try again later.",
      );
    }
  }

  async viewFacebookProfile(
    client,
    ctx,
    mentionedUser,
    color,
    emoji,
    fbMessages,
  ) {
    const targetUser = mentionedUser || ctx.author;
    const isOwnProfile = targetUser.id === ctx.author.id;

    const user = await Users.findOne({ userId: targetUser.id });

    if (!user) {
      const embed = client
        .embed()
        .setColor(color.danger)
        .setTitle(`${emoji.social.facebook} User Not Found`)
        .setDescription(
          `❌ ${fbMessages?.userNotFound || "User not found in our database."}`,
        )
        .setFooter({ text: "💡 User needs to interact with the bot first!" });
      return ctx.sendMessage({ embeds: [embed] });
    }

    const fbName = user.social.facebook.name;
    const fbLink = user.social.facebook.link;
    const isConfigured = fbName && fbLink;

    const embed = client
      .embed()
      .setColor(isConfigured ? color.main : color.warning)
      .setAuthor({
        name: `${targetUser.displayName}'s Facebook Profile`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 64 }),
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }));

    if (isConfigured) {
      embed
        .setDescription(
          `🎉 **Facebook Profile Active!**\n\n${emoji.social.facebook} **Name:** \`${fbName}\`\n🔗 **Link:** [Visit Profile](${fbLink})`,
        )
        .setURL(fbLink)
        .addFields([
          {
            name: "✅ Status",
            value: "**Fully Configured** - Profile is ready to share!",
            inline: false,
          },
        ]);
    } else {
      embed
        .setDescription(
          `${emoji.social.facebook} **Facebook Profile**\n\n📝 **Name:** ${fbName || "Not set"}\n🔗 **Link:** ${fbLink || "Not set"}`,
        )
        .addFields([
          {
            name: isOwnProfile ? "🚀 Get Started" : "📊 Status",
            value: isOwnProfile
              ? "Your Facebook profile isn't set up yet. Use the buttons below to get started!"
              : "This user hasn't configured their Facebook profile yet.",
            inline: false,
          },
        ]);
    }

    embed.setFooter({
      text: isOwnProfile
        ? "💡 Tip: A complete profile helps others connect with you!"
        : `Requested by ${ctx.author.username}`,
    });

    // Add action buttons for own profile
    let components = [];
    if (isOwnProfile) {
      const actionRow = new ActionRowBuilder();

      if (!fbName) {
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId("facebook_set_name")
            .setLabel("Set Name")
            .setEmoji("📝")
            .setStyle(ButtonStyle.Primary),
        );
      }

      if (!fbLink) {
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId("facebook_set_link")
            .setLabel("Set Link")
            .setEmoji("🔗")
            .setStyle(ButtonStyle.Primary),
        );
      }

      if (isConfigured) {
        actionRow.addComponents(
          new ButtonBuilder()
            .setURL(fbLink)
            .setLabel("Visit Profile")
            .setEmoji(emoji.social.facebook)
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setCustomId("facebook_clear")
            .setLabel("Clear")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Danger),
        );
      }

      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId("view_socials")
          .setLabel("All Socials")
          .setEmoji("📱")
          .setStyle(ButtonStyle.Secondary),
      );

      if (actionRow.components.length > 0) {
        components = [actionRow];
      }
    }

    return ctx.sendMessage({ embeds: [embed], components });
  }

  async clearFacebookProfile(client, ctx, color, emoji, fbMessages) {
    try {
      await Users.updateOne(
        { userId: ctx.author.id },
        {
          $unset: {
            "social.facebook.name": "",
            "social.facebook.link": "",
          },
        },
      );

      const embed = client
        .embed()
        .setColor(color.warning)
        .setTitle(`${emoji.social.facebook} Facebook Profile Cleared`)
        .setDescription(
          "🧹 **Your Facebook information has been cleared successfully!**",
        )
        .addFields([
          {
            name: "🔄 What's Next?",
            value:
              "You can set up your Facebook profile again anytime using:\n• `/facebook name YourName`\n• `/facebook link YourFacebookURL`",
            inline: false,
          },
        ])
        .setFooter({
          text: "Your data has been safely removed from our system.",
        });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("facebook_set_name")
          .setLabel("Set Name Again")
          .setEmoji("📝")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("view_socials")
          .setLabel("View All Socials")
          .setEmoji("📱")
          .setStyle(ButtonStyle.Secondary),
      );

      return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
    } catch (error) {
      return this.handleError(
        client,
        ctx,
        color,
        "Failed to clear Facebook profile. Please try again later.",
      );
    }
  }

  async showHelpMessage(client, ctx, color, emoji, fbMessages) {
    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle(`${emoji.social.facebook} Facebook Command Help`)
      .setDescription(
        "🚀 **Master your Facebook profile management!**\n\nHere's everything you can do with the Facebook command:",
      )
      .addFields([
        {
          name: "👀 View Facebook Profile",
          value:
            "• `/facebook` - View your Facebook profile\n• `/facebook view @user` - View someone else's profile",
          inline: false,
        },
        {
          name: "📝 Set Facebook Name",
          value:
            "• `/facebook name YourName` - Set your display name\n• Example: `/facebook name John Smith`",
          inline: false,
        },
        {
          name: "🔗 Set Facebook Link",
          value:
            "• `/facebook link YourURL` - Set your Facebook profile URL\n• Example: `/facebook link https://facebook.com/johnsmith`",
          inline: false,
        },
        {
          name: "🧹 Clear Information",
          value: "• `/facebook clear` - Remove all your Facebook information",
          inline: false,
        },
        {
          name: "📱 Additional Commands",
          value:
            "• `/socials` - View all your social media profiles\n• `/instagram` - Manage your Instagram profile\n• `/tiktok` - Manage your TikTok profile",
          inline: false,
        },
        {
          name: "💡 Pro Tips",
          value:
            "✨ Use your real name for better discoverability\n🔗 Make sure your Facebook profile is public\n🎯 Complete both name and link for full functionality\n🌟 Check `/socials` to see your complete social media hub",
          inline: false,
        },
      ])
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({
        text: "Ready to build your amazing social media presence? 🚀",
      });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("facebook_set_name")
        .setLabel("Set Name")
        .setEmoji("📝")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("facebook_set_link")
        .setLabel("Set Link")
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("view_socials")
        .setLabel("View All Socials")
        .setEmoji("📱")
        .setStyle(ButtonStyle.Secondary),
    );

    return ctx.sendMessage({ embeds: [embed], components: [actionRow] });
  }

  handleError(client, ctx, color, message) {
    const embed = client
      .embed()
      .setColor(color.danger)
      .setTitle("❌ Error")
      .setDescription(message)
      .setFooter({ text: "If this persists, please contact support." });

    return ctx.sendMessage({ embeds: [embed] });
  }
};
