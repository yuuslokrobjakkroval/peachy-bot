const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class Instagram extends Command {
  constructor(client) {
    super(client, {
      name: "instagram",
      description: {
        content: `Manage your instagram profile.`,
        examples: [
          "instagram - Shows your current Instagram details.",
          "instagram @mention - Shows the Instagram details of the mentioned user.",
          "instagram name YourInstagramName - Sets your Instagram name.",
          "instagram link https://instagram.com/YourInstagramLink - Sets your Instagram link.",
          "instagram help - Shows command usage examples.",
        ],
        usage:
          "instagram\ninstagram @mention\ninstagram name <YourInstagramName>\ninstagram link <YourInstagramLink>\ninstagram help",
      },
      category: "profile",
      aliases: ["ig"],
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
          description: "Sets your Instagram name in the profile card.",
          type: 1, // Sub-command type
          options: [
            {
              name: "name",
              description: "The Instagram name to set.",
              type: 3, // String type
              required: true,
            },
          ],
        },
        {
          name: "link",
          description: "Sets your Instagram link in the profile card.",
          type: 1, // Sub-command type
          options: [
            {
              name: "link",
              description: "The Instagram link to set.",
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
    const igMessages = language.locales.get(language.defaultLocale)
      ?.socialMessages?.igMessages;

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
        igMessages?.userNotFound || "User not found.",
        color
      );
    }

    const embed = client
      .embed()
      .setTitle(
        `${emoji.mainLeft} ${
          igMessages?.settingsTitle || "Instagram Settings for"
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
            igMessages?.invalidName ||
              "Please provide a valid Instagram name (up to 21 characters).",
            color
          );
        }

        embed
          .setDescription(
            igMessages?.nameUpdated || "Your Instagram name has been set."
          )
          .addFields([
            {
              name: igMessages?.newName || "New Instagram Name",
              value: `\`\`\`${name}\n\`\`\``,
              inline: false,
            },
          ]);

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "social.instagram.name": name } }
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
            igMessages?.invalidLink || "Please provide a valid Instagram link.",
            color
          );
        }

        embed
          .setDescription(
            igMessages?.linkUpdated || "Your Instagram link has been set."
          )
          .addFields([
            {
              name: igMessages?.newLink || "New Instagram Link",
              value: `\`\`\`${link}\n\`\`\``,
              inline: false,
            },
          ])
          .setURL(link);

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "social.instagram.link": link } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "help": {
        embed
          .setTitle(igMessages?.helpTitle || "Instagram Command Help")
          .setDescription(
            igMessages?.helpDescription ||
              "Manage your Instagram details with the following subcommands:"
          )
          .addFields([
            {
              name: igMessages?.showDetails || "Show Instagram Details",
              value: "````instagram` or `instagram @mention```",
              inline: false,
            },
            {
              name: igMessages?.setName || "Set Instagram Name",
              value: "````instagram name YourInstagramName```",
              inline: false,
            },
            {
              name: igMessages?.setLink || "Set Instagram Link",
              value:
                "````instagram link https://instagram.com/YourInstagramLink```",
              inline: false,
            },
            {
              name: igMessages?.commandHelp || "Command Help",
              value: "````instagram help```",
              inline: false,
            },
          ]);

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      default: {
        const igName =
          user.social.instagram.name || igMessages?.notSet || "Not set";
        const igLink = user.social.instagram.link || "";

        embed
          .setColor(color.main)
          .setDescription(
            `**${emoji.social.instagram} : ${
              igName && igLink
                ? `[${igName}](${igLink})`
                : igName
                ? igName
                : igMessages?.notSet || "Not set"
            }**`
          );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }
    }
  }
};
