const { Command } = require("../../structures/index.js");
const Owners = require("../../schemas/owner");
const globalEmoji = require("../../utils/Emoji");

module.exports = class AddOwner extends Command {
  constructor(client) {
    super(client, {
      name: "addowner",
      description: {
        content: "Add an owner for the bot.",
        examples: ["addowner @user", "addowner 123456789012345678"],
        usage: "addowner <user>",
      },
      category: "owner",
      aliases: ["ao"],
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
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    // Check if argument is provided
    if (!args[0]) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Please provide a user to add as owner",
        color
      );
    }

    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first()?.user ||
        ctx.guild.members.cache.get(args[0])?.user ||
        args[0];

    let userId = typeof mention === "string" ? mention : mention?.id;

    // Validate userId format (Discord IDs are 17-19 digits)
    if (typeof userId === "string" && !/^\d{17,19}$/.test(userId)) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Invalid user ID format",
        color
      );
    }

    let userInfo;
    try {
      userInfo = await client.users.fetch(userId);
      if (userInfo.bot) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          "Bots cannot be added as owners",
          color
        );
      }
    } catch (error) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "User not found",
        color
      );
    }

    try {
      // Check if user is already an owner using user.id
      const existingOwner = await Owners.findOne({ "user.id": userInfo.id });
      if (existingOwner) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          "This user is already an owner!",
          color
        );
      }

      // Create new owner document with structured user data
      const newOwner = await Owners.create({
        user: {
          id: userInfo.id,
          username: userInfo.username,
          discriminator: userInfo.discriminator,
          global_name: userInfo.globalName || userInfo.displayName, // Fallback to displayName if globalName is unavailable
          avatar: userInfo.avatar,
          banner: userInfo.banner || null, // Banner might not always be available
          accent_color: userInfo.accentColor || null, // Accent color might not always be set
          banner_color: userInfo.hexAccentColor || null, // Hex color if available
        },
      });

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          `${globalEmoji.result.tick} Added **${userInfo.displayName}** as an owner successfully.`
        )
        .setFooter({
          text:
            generalMessages?.requestedBy.replace(
              "%{username}",
              ctx.author.displayName
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error adding owner:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to add owner. Check logs for details.",
        color
      );
    }
  }
};
