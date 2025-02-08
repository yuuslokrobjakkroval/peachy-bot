const { Command } = require("../../structures/index.js");

module.exports = class ChangeProfile extends Command {
  constructor(client) {
    super(client, {
      name: "changeprofile",
      description: {
        content: "Changes the bot's profile picture using an attachment.",
        examples: ["changeprofile (attach an image)"],
        usage: "changeprofile (attach an image)",
      },
      category: "utility",
      aliases: ["setavatar", "botavatar"],
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
          description: "Upload an image for the bot's new profile picture",
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const profileMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.profileMessages;

    if (!ctx.isBotDeveloper) {
      return client.utils.sendErrorMessage(client, ctx, "Only bot developers can change the bot's profile picture.", color);
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
      await client.user.setAvatar(imageUrl);

      const embed = client.embed()
        .setColor(color.main)
        .setDescription(`✅ Successfully changed the bot's profile picture!`)
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
      console.error("Failed to change bot's avatar:", error);
      return client.utils.sendErrorMessage(client, ctx, "Failed to update the bot's profile picture. Make sure the image is valid.", color);
    }
  }
};
