const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Icon extends Command {
  constructor(client) {
    super(client, {
      name: "icon",
      description: {
        content: "Displays the server's icon",
        examples: ["icon"],
        usage: "icon",
      },
      category: "utility",
      aliases: ["servericon", "guildicon"],
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
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const iconMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.iconMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', globalEmoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
    }

    const guild = ctx.guild;

    if (!guild.icon) {
      const errorMessage = iconMessages?.noIcon.noIconAvailable || "This server has no icon.";
      return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
    }

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', `SERVER ICON`)
                .replace('%{mainRight}', emoji.mainRight)
        )
        .setImage(guild.iconURL({ dynamic: true, extension: "png", size: 1024 }))
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};