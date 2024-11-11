const { Command } = require("../../structures/index.js");

module.exports = class Avatar extends Command {
  constructor(client) {
    super(client, {
      name: "avatar",
      description: {
        content: "Displays a user's avatar",
        examples: ["avatar @User"],
        usage: "avatar [@User]",
      },
      category: "utility",
      aliases: ["av", "pfp"],
      cooldown: 3,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user to get the avatar of",
          type: 6, // USER type
          required: false,
        },
      ],
    });
  }

  run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const avatarMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.avatarMessages;

    const mention = ctx.isInteraction
        ? ctx.interaction.options.getUser("user") || ctx.author
        : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

    if (!mention) {
      const errorMessage = avatarMessages?.noUserMentioned || "No user mentioned";
      return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
    }

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', `𝐀𝐕𝐀𝐓𝐀𝐑 𝐎𝐅 ${mention.displayName}`)
                .replace('%{mainRight}', emoji.mainRight)
        )
        .setImage(mention.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.sendMessage({ embeds: [embed] });
  }

};
