const { Command } = require("../../structures/index.js");

module.exports = class ResetProfile extends Command {
  constructor(client) {
    super(client, {
      name: "resetprofile",
      description: {
        content: "𝑹𝒆𝒔𝒆𝒕𝒔 𝒕𝒉𝒆 𝒃𝒐𝒕'𝒔 𝒂𝒗𝒂𝒕𝒂𝒓 𝒂𝒏𝒅 𝒃𝒂𝒏𝒏𝒆𝒓.",
        examples: ["𝒓𝒆𝒔𝒆𝒕𝒑𝒓𝒐𝒇𝒊𝒍𝒆"],
        usage: "𝒓𝒆𝒔𝒆𝒕𝒑𝒓𝒐𝒇𝒊𝒍𝒆",
      },
      category: "staff",
      aliases: ["resetbot"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: true, // Only bot developers can use this command
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
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", emoji.searching),
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", emoji.searching),
      );
    }

    try {
      await client.user.setAvatar(null); // Reset avatar
      await client.user.setBanner(null); // Reset banner ()

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "𝐏𝐅 𝐑𝐄𝐒𝐄𝐓")
            .replace("%{mainRight}", emoji.mainRight),
        )
        .setImage(
          client.user.displayAvatarURL({
            dynamic: true,
            extension: "png",
            size: 1024,
          }),
        )
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
    } catch (error) {
      console.error("Failed to reset bot profile:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to reset bot profile. Ensure the bot has Nitro for banner reset.",
        color,
      );
    }
  }
};
