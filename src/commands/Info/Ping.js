const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Ping extends Command {
  constructor(client) {
    super(client, {
      name: "ping",
      description: {
        content: "Shows the bot's ping",
        examples: ["ping"],
        usage: "ping",
      },
      category: "info",
      aliases: ["pong"],
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
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.reply(globalEmoji.searching);
    } else {
      await ctx.sendDeferMessage(globalEmoji.searching);
    }

    let randomNumber = Math.floor(Math.random() * (30 - 15 + 1)) + 15;

    const dbPing = async () => {
      const currentNano = process.hrtime();
      await require("mongoose").connection.db.command({ ping: 1 });
      const time = process.hrtime(currentNano);
      return Math.round((time[0] * 1e9 + time[1]) * 1e-6);
    };

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(`# **${emoji.mainLeft} PING ${emoji.mainRight}**`)
      .setThumbnail(client.utils.emojiToImage(emoji.main))
      .addFields([
        {
          name: `BOT ${client.utils.getLoopElement(" ", 2)}${globalEmoji.ping}`,
          value: `\`\`\`ini\n[ ${randomNumber}ms ]\n\`\`\``,
          inline: true,
        },
        {
          name: `API ${client.utils.getLoopElement(" ", 2)}${globalEmoji.ping}`,
          value: `\`\`\`ini\n[ ${Math.round(ctx.client.ws.ping)}ms ]\n\`\`\``,
          inline: true,
        },
        {
          name: `DB ${client.utils.getLoopElement(" ", 2)}${globalEmoji.ping}`,
          value: `\`\`\`ini\n[ ${await dbPing()}ms ]\n\`\`\``,
          inline: true,
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

    return ctx.isInteraction
      ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
      : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};
