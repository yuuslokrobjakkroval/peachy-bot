const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class LoveQuote extends Command {
  constructor(client) {
    super(client, {
      name: "lovequote",
      description: {
        content: "Sends a random love quote",
        examples: ["lovequote"],
        usage: "lovequote",
      },
      category: "fun",
      aliases: ["lquote", "romance", "lq"],
      cooldown: 5,
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
      language.defaultLocale
    )?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    }

    // Extended list of love quotes
    const loveQuotes = [
      "Love is not about how many days, months, or years you’ve been together. Love is about how much you love each other every single day.",
      "You are my today and all of my tomorrows.",
      "If I know what love is, it is because of you. – Hermann Hesse",
      "I have waited for this opportunity for more than half a century, to repeat to you once again my vow of eternal fidelity and everlasting love. – Gabriel García Márquez",
      "Every love story is beautiful, but ours is my favorite.",
      "You are the source of my joy, the center of my world, and the whole of my heart.",
      "In your smile, I see something more beautiful than the stars.",
      "I would rather spend one lifetime with you than face all the ages of this world alone. – J.R.R. Tolkien",
      "Love is composed of a single soul inhabiting two bodies. – Aristotle",
      "You have bewitched me, body and soul, and I love, I love, I love you. – Pride & Prejudice",
      "When I look into your eyes, I know I have found the mirror of my soul.",
      "To love and be loved is to feel the sun from both sides. – David Viscott",
      "A hundred hearts would be too few to carry all my love for you.",
      "I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more. – Angelita Lim",
      "I swear I couldn’t love you more than I do right now, and yet I know I will tomorrow. – Leo Christopher",
      "You are the last thought in my mind before I drift off to sleep and the first thought when I wake up each morning.",
      "Forever is a long time, but I wouldn’t mind spending it by your side.",
      "True love stories never have endings. – Richard Bach",
    ];

    const randomQuote =
      loveQuotes[Math.floor(Math.random() * loveQuotes.length)];

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", `LOVE QUOTE`)
          .replace("%{mainRight}", emoji.mainRight) +
          `\n\n💖 **${randomQuote}**`
      )
      .setFooter({
        text:
          generalMessages.requestedBy.replace(
            "%{username}",
            ctx.author.displayName
          ) || `Requested by ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    return ctx.isInteraction
      ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
      : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};
