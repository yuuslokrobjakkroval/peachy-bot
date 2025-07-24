const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class QuoteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "quote",
      description: {
        content: "Sends a random quote (motivational or general)",
        examples: ["quote"],
        usage: "quote",
      },
      category: "fun",
      aliases: ["q", "ran", "quote"],
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

    // ✅ Combined quotes list (General + Motivational)
    const quotes = [
      // General Quotes
      "In the middle of every difficulty lies opportunity. – Albert Einstein",
      "Do what you can, with what you have, where you are. – Theodore Roosevelt",
      "Success is not final, failure is not fatal: It is the courage to continue that counts. – Winston Churchill",
      "Happiness depends upon ourselves. – Aristotle",
      "The best way to predict your future is to create it. – Abraham Lincoln",
      "It always seems impossible until it's done. – Nelson Mandela",
      "Start where you are. Use what you have. Do what you can. – Arthur Ashe",
      "Act as if what you do makes a difference. It does. – William James",
      "Keep your face always toward the sunshine—and shadows will fall behind you. – Walt Whitman",
      "What you get by achieving your goals is not as important as what you become by achieving your goals. – Zig Ziglar",
      "Believe you can and you're halfway there. – Theodore Roosevelt",
      "Dream big and dare to fail. – Norman Vaughan",
      "Do one thing every day that scares you. – Eleanor Roosevelt",
      "Don’t wait. The time will never be just right. – Napoleon Hill",
      "The secret of getting ahead is getting started. – Mark Twain",
      "Hardships often prepare ordinary people for an extraordinary destiny. – C.S. Lewis",
      "Turn your wounds into wisdom. – Oprah Winfrey",
      "Opportunities don't happen, you create them. – Chris Grosser",
      "Don’t let yesterday take up too much of today. – Will Rogers",
      "You are never too old to set another goal or to dream a new dream. – C.S. Lewis",
      "Be yourself; everyone else is already taken. – Oscar Wilde",
      "Happiness is not something ready made. It comes from your own actions. – Dalai Lama",
      "Doubt kills more dreams than failure ever will. – Suzy Kassem",
      "Don’t count the days, make the days count. – Muhammad Ali",
      "Go confidently in the direction of your dreams! Live the life you’ve imagined. – Henry David Thoreau",

      // Motivational Quotes
      "The best way to get started is to quit talking and begin doing. – Walt Disney",
      "It’s not whether you get knocked down, it’s whether you get up. – Vince Lombardi",
      "People who are crazy enough to think they can change the world are the ones who do.",
      "Failure will never overtake me if my determination to succeed is strong enough. – Og Mandino",
      "We may encounter many defeats but we must not be defeated. – Maya Angelou",
      "Push yourself, because no one else is going to do it for you.",
      "Great things never come from comfort zones.",
      "Dream it. Wish it. Do it.",
      "Act as if what you do makes a difference. It does. – William James",
      "Success is not final, failure is not fatal: It is the courage to continue that counts. – Winston Churchill",
      "Your limitation—it’s only your imagination.",
      "Small progress is still progress.",
      "Work hard in silence, let your success make the noise.",
      "Focus on being productive instead of busy. – Tim Ferriss",
      "Don’t watch the clock; do what it does. Keep going. – Sam Levenson",
      "The only way to do great work is to love what you do. – Steve Jobs",
      "If you cannot do great things, do small things in a great way. – Napoleon Hill",
      "Don’t stop when you’re tired. Stop when you’re done.",
      "Great things never come easy, but they are worth it.",
      "If you want something you’ve never had, you must be willing to do something you’ve never done.",
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", `QUOTE`)
          .replace("%{mainRight}", emoji.mainRight) +
          `\n\n📜 **${randomQuote}**`
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
