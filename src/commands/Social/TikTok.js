const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class TikTok extends Command {
  constructor(client) {
    super(client, {
      name: "tiktok",
      description: {
        content: `Manage your TikTok profile.`,
        examples: [
          "tiktok - Shows your current TikTok details.",
          "tiktok @mention - Shows the TikTok details of the mentioned user.",
          "tiktok name YourTikTokName - Sets your TikTok name.",
          "tiktok link https://tiktok.com/@YourTikTokLink - Sets your TikTok link.",
          "tiktok help - Shows command usage examples.",
        ],
        usage:
          "tiktok\n tiktok @mention\n tiktok name <YourTikTokName>\n tiktok link <YourTikTokLink>\n tiktok help",
      },
      category: "profile",
      aliases: ["tt"],
      cooldown: 5,
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
          description: "Sets your TikTok name in the profile card.",
          type: 1, // Sub-command type
          options: [
            {
              name: "name",
              description: "The TikTok name to set.",
              type: 3, // String type
              required: true,
            },
          ],
        },
        {
          name: "link",
          description: "Sets your TikTok link in the profile card.",
          type: 1, // Sub-command type
          options: [
            {
              name: "link",
              description: "The TikTok link to set.",
              type: 3, // String type
              required: true,
            },
          ],
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
    const ttMessages = language.locales.get(language.defaultLocale)
      ?.socialMessages?.ttMessages;

    const subCommand = ctx.isInteraction
      ? ctx.interaction.options.getSubcommand()
      : args[0];
    const mentionedUser = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        ctx.author;
    const targetUserId = mentionedUser ? mentionedUser.id : ctx.author.id;
    const user = await Users.findOne({ userId: targetUserId });
    const targetUsername = mentionedUser
      ? mentionedUser.displayName
      : ctx.author.displayName;

    if (!user) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        ttMessages?.userNotFound || "User not found.",
        color
      );
    }

    const embed = client
      .embed()
      .setTitle(
        `${emoji.mainLeft} ${
          ttMessages?.settingsTitle || "TikTok Settings for"
        } ${targetUsername} ${emoji.mainRight}`
      );

    switch (subCommand) {
      case "name": {
        const name = ctx.isInteraction
          ? ctx.interaction.options.getString("name")
          : args.slice(1).join(" ");
        if (!name || name.length > 21) {
          return await client.utils.oops(
            client,
            ctx,
            ttMessages?.invalidName ||
              "Please provide a valid TikTok name (up to 21 characters).",
            color
          );
        }

        embed
          .setDescription(
            ttMessages?.nameUpdated || "Your TikTok name has been set."
          )
          .addFields([
            {
              name: ttMessages?.newName || "New TikTok Name",
              value: `\`\`\`${name}\n\`\`\``,
              inline: false,
            },
          ]);

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "social.tiktok.name": name } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "link": {
        const link = ctx.isInteraction
          ? ctx.interaction.options.getString("link")
          : args.slice(1).join(" ");
        const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/;

        if (!link || !urlPattern.test(link)) {
          return await client.utils.oops(
            client,
            ctx,
            ttMessages?.invalidLink || "Please provide a valid TikTok link.",
            color
          );
        }

        embed
          .setDescription(
            ttMessages?.linkUpdated || "Your TikTok link has been set."
          )
          .addFields([
            {
              name: ttMessages?.newLink || "New TikTok Link",
              value: `\`\`\`${link}\n\`\`\``,
              inline: false,
            },
          ])
          .setURL(link);

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "social.tiktok.link": link } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "help": {
        embed
          .setTitle(ttMessages?.helpTitle || "TikTok Command Help")
          .setDescription(
            ttMessages?.helpDescription ||
              "Manage your TikTok details with the following subcommands:"
          )
          .addFields([
            {
              name: ttMessages?.showDetails || "Show TikTok Details",
              value: "````tiktok` or `tiktok @mention```",
              inline: false,
            },
            {
              name: ttMessages?.setName || "Set TikTok Name",
              value: "````tiktok name YourTikTokName```",
              inline: false,
            },
            {
              name: ttMessages?.setLink || "Set TikTok Link",
              value: "````tiktok link https://tiktok.com/@YourTikTokLink```",
              inline: false,
            },
            {
              name: ttMessages?.commandHelp || "Command Help",
              value: "````tiktok help```",
              inline: false,
            },
          ]);

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      default: {
        const ttName =
          user.social.tiktok.name || ttMessages?.notSet || "Not set";
        const ttLink = user.social.tiktok.link || "";

        embed
          .setColor(color.main)
          .setDescription(
            `**${emoji.social.tiktok} : ${
              ttName && ttLink
                ? `[${ttName}](${ttLink})`
                : ttName
                ? ttName
                : ttMessages?.notSet || "Not set"
            }**`
          );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }
    }
  }
};
