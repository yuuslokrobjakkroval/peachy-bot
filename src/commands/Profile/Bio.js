const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class Bio extends Command {
  constructor(client) {
    super(client, {
      name: "bio",
      description: {
        content: "Set your profile bio.",
        examples: ["bio I love coding", "bio reset", "bio show", "bio help"],
        usage: "bio <text || reset || show || help>",
      },
      category: "profile",
      aliases: [],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "reset",
          description: "Resets the bio to the default one",
          type: 1,
        },
        {
          name: "show",
          description: "Show the current bio for you.",
          type: 1,
        },
        {
          name: "help",
          description:
            "Displays example and usage information for the command.",
          type: 1,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const bioMessages = language.locales.get(language.defaultLocale)
      ?.profileMessages?.bioMessages;

    const user = await Users.findOne({ userId: ctx.author.id });
    const embed = client.embed().setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL(),
    });

    const subCommand = ctx.isInteraction
      ? ctx.interaction.options.data[0].name
      : args[0];

    switch (subCommand) {
      case "help": {
        embed
          .setColor(color.main)
          .setDescription(
            `${
              bioMessages?.usage || "**Usage:**"
            } \`bio <text || reset || show || help>\`\n\n**Examples:**\n\`bio I love coding\`\n\`bio reset\`\n\`bio show\`\n\`bio help\``
          );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "reset": {
        embed
          .setColor(color.main)
          .setDescription(
            bioMessages?.resetSuccess || "The bio for you has been reset."
          );

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "profile.bio": "No bio written." } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      case "show": {
        embed
          .setColor(color.main)
          .setDescription(
            user.profile.bio
              ? `\`\`\`arm\n${user.profile.bio}\`\`\``
              : bioMessages?.noBio || "No bio written."
          );

        await ctx.sendMessage({ embeds: [embed] });
        break;
      }

      default: {
        const text = ctx.isInteraction
          ? ctx.interaction.options.data[0]?.options[0]?.value?.toString()
          : args.join(" ");

        if (!text) {
          await client.utils.oops(
            client,
            ctx,
            bioMessages?.provideText ||
              "Please provide a bio text or a valid subcommand.",
            color
          );
          return;
        }

        if (text.length >= 300) {
          await client.utils.oops(
            client,
            ctx,
            bioMessages?.tooLong ||
              "The bio cannot be longer than 300 characters.",
            color
          );
          return;
        }

        embed
          .setDescription(
            bioMessages?.setSuccess || "The bio for you has been set."
          )
          .addFields([
            {
              name: "New bio",
              value: `\`\`\`arm\n${text}\n\`\`\``,
              inline: false,
            },
          ]);

        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { "profile.bio": text } }
        ).exec();
        await ctx.sendMessage({ embeds: [embed] });
        break;
      }
    }
  }
};
