const { Command } = require("../../structures/index.js");

module.exports = class ChangeBanner extends Command {
  constructor(client) {
    super(client, {
      name: "changebanner",
      description: {
        content: "Changes the bot's profile banner using an attachment.",
        examples: ["changebanner (attach an image)"],
        usage: "changebanner (attach an image)",
      },
      category: "utility",
      aliases: ["setbanner", "botbanner"],
      cooldown: 5,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: true, // Only bot developers can use this command
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "image",
          type: 11, // ATTACHMENT input
          description: "Upload an image for the bot's new profile banner",
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const bannerMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.bannerMessages;

    if (!ctx.isBotDeveloper) {
      return client.utils.sendErrorMessage(client, ctx, "Only bot developers can change the bot's banner.", color);
    }

    // Get the attachment from interaction or message
    const imageAttachment = ctx.isInteraction 
      ? ctx.interaction.options.getAttachment("image") 
      : ctx.message.attachments.first();

    if (!imageAttachment) {
      return client.utils.sendErrorMessage(client, ctx, "Please attach an image.", color);
    }

    const imageUrl = imageAttachment.url;

    try {
      await client.user.setBanner(imageUrl);

      const embed = client.embed()
        .setColor(color.main)
        .setDescription(`✅ Successfully changed the bot's profile banner!`)
        .setImage(imageUrl)
        .setFooter({
          text: `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      return ctx.isInteraction 
        ? await ctx.interaction.reply({ embeds: [embed] }) 
        : await ctx.sendMessage({ embeds: [embed] });

    } catch (error) {
      console.error("Failed to change bot's banner:", error);
      return client.utils.sendErrorMessage(client, ctx, "Failed to update the bot's profile banner. Make sure the image is valid and your bot has Nitro.", color);
    }
  }
};
