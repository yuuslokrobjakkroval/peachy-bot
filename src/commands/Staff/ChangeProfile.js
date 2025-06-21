const { Command } = require("../../structures/index.js");

module.exports = class ChangeProfile extends Command {
  constructor(client) {
    super(client, {
      name: "changeprofile",
      description: {
        content: "𝑪𝒉𝒂𝒏𝒈𝒆𝒔 𝒕𝒉𝒆 𝒃𝒐𝒕'𝒔 𝒑𝒓𝒐𝒇𝒊𝒍𝒆 𝒑𝒊𝒄𝒕𝒖𝒓𝒆.",
        examples: ["𝒄𝒉𝒂𝒏𝒈𝒆𝒑𝒓𝒐𝒇𝒊𝒍𝒆 (attach an image)"],
        usage: "𝒄𝒉𝒂𝒏𝒈𝒆𝒑𝒓𝒐𝒇𝒊𝒍𝒆 (attach an image)",
      },
      category: "staff",
      aliases: ["setavatar", "botavatar"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: true, // Only bot developers can use this
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "image",
          type: 11, // ATTACHMENT input
          description: "Upload an image for the bot's profile picture",
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
      await client.user.setAvatar(imageAttachment.url);

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "𝐏𝐑𝐎𝐅𝐈𝐋𝐄 !")
            .replace("%{mainRight}", emoji.mainRight),
        )
        .setImage(imageAttachment.url)
        .setTimestamp();

      return ctx.isInteraction
        ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
        : await ctx.editMessage({ content: "", embeds: [embed] });
    } catch (error) {
      console.error("Failed to change bot's avatar:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to update the bot's profile picture.",
        color,
      );
    }
  }
};
