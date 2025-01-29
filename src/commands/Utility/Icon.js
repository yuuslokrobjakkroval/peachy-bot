const { Command } = require("../../structures/index.js");

module.exports = class Icon extends Command {
  constructor(client) {
    super(client, {
      name: "icon",
      description: {
        content: "𝑫𝒊𝒔𝒑𝒍𝒂𝒚𝒔 𝒕𝒉𝒆 𝒔𝒆𝒓𝒗𝒆𝒓'𝒔 𝒊𝒄𝒐𝒏",
        examples: ["𝒊𝒄𝒐𝒏"],
        usage: "𝒊𝒄𝒐𝒏",
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
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
    }

    const guild = ctx.guild;

    if (!guild.icon) {
      const errorMessage = iconMessages?.noIconAvailable || "This server has no icon.";
      return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
    }

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', `𝐒𝐄𝐑𝐕𝐄𝐑 𝐈𝐂𝐎𝐍`)
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
