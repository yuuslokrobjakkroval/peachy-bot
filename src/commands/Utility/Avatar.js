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

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const avatarMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.avatarMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
    }


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
                .replace('%{title}', `𝐀𝐕𝐀𝐓𝐀𝐑`)
                .replace('%{mainRight}', emoji.mainRight)
        )
        .setImage(mention.displayAvatarURL({ format: 'png', size: 1024 }))
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};
