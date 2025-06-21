const { Command } = require("../../structures/index.js");

module.exports = class ChangeBanner extends Command {
  constructor(client) {
    super(client, {
      name: "changebanner",
      description: {
        content: "𝑪𝒉𝒂𝒏𝒈𝒆𝒔 𝒕𝒉𝒆 𝒃𝒐𝒕'𝒔 𝒑𝒓𝒐𝒇𝒊𝒍𝒆 𝒃𝒂𝒏𝒏𝒆𝒓.",
        examples: ["𝒄𝒉𝒂𝒏𝒈𝒆𝒃𝒂𝒏𝒏𝒆𝒓 (attach an image)"],
        usage: "𝒄𝒉𝒂𝒏𝒈𝒆𝒃𝒂𝒏𝒏𝒆𝒓 (attach an image)",
      },
      category: "staff",
      aliases: ["setbanner", "botbanner"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "image",
          type: 11,
          description: "Upload an image for the bot's profile banner",
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", emoji.searching),
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", emoji.searching),
      );
    }

    const imageAttachment = ctx.isInteraction
      ? ctx.interaction.options.getAttachment("image")
      : ctx.message.attachments.first();

    if (!imageAttachment) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Please attach an image.",
        color,
      );
    }

    try {
      await client.user.setBanner(imageAttachment.url);

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "𝐁𝐀𝐍𝐍𝐄𝐑 !")
            .replace("%{mainRight}", emoji.mainRight),
        )
        .setImage(imageAttachment.url)
        .setTimestamp();

      return ctx.isInteraction
        ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
        : await ctx.editMessage({ content: "", embeds: [embed] });
    } catch (error) {
      console.error("Failed to change bot's banner:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to update the bot's profile banner.",
        color,
      );
    }
  }
};
