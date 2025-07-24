const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Pat extends Command {
  constructor(client) {
    super(client, {
      name: "pat",
      description: {
        content: "Pat another user to show affection.",
        examples: ["pat @User"],
        usage: "pat @User",
      },
      category: "actions",
      aliases: ["headpat", "pats"],
      cooldown: 3,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user you want to pat",
          type: 6, // USER type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages || {
        title: "%{mainLeft} %{title} %{mainRight}",
        requestedBy: "Requested by %{username}",
      };

      // Get target user
      const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first() || (await client.users.fetch(args[0]).catch(() => null));

      if (!target) {
        return await client.utils.sendErrorMessage(client, ctx, "You need to mention a user to pat.", color);
      }

      if (target.id === ctx.author.id) {
        return await client.utils.sendErrorMessage(client, ctx, "You can't pat yourself!", color);
      }

      // Example pat GIFs (replace or add your own)
      const patGifs = [
        "https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif",
        "https://media.giphy.com/media/109ltuoSQT212w/giphy.gif",
        "https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif",
      ];

      const patBackGifs = [
        "https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
        "https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif",
        "https://media.giphy.com/media/nyGFcsP0kAobm/giphy.gif",
      ];

      const randomPatGif = client.utils.getRandomElement(patGifs);

      // Create embed for initial pat
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft || "🤗")
            .replace("%{title}", "PAT")
            .replace("%{mainRight}", emoji.mainRight || "🤗") +
          `\n\n**${ctx.author.username}** pats **${target.username}**!`
        )
        .setImage(randomPatGif)
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Create "Pat back" button
      const patBackButton = new ButtonBuilder()
        .setCustomId(`pat_back_${ctx.author.id}_${target.id}`)
        .setLabel("Pat back")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🤗");

      const row = new ActionRowBuilder().addComponents(patBackButton);

      // Send the message with button
      const message =
