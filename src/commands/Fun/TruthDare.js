const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji.js");

module.exports = class TruthOrDareCommand extends Command {
  constructor(client) {
    super(client, {
      name: "truthordare",
      description: {
        content: "Play Truth or Dare. Choose randomly or specify 'truth' or 'dare'",
        examples: ["truthordare", "truthordare truth", "truthordare dare"],
        usage: "truthordare [truth|dare]",
      },
      category: "fun",
      aliases: ["tod", "truthdare"],
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
      options: [
        {
          name: "choice",
          description: "Choose truth or dare",
          type: 3, // STRING
          required: false,
          choices: [
            { name: "Truth", value: "truth" },
            { name: "Dare", value: "dare" },
          ],
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

    const userChoice = args[0] || ctx.interaction?.options.getString("choice");
    const choice = userChoice ? userChoice.toLowerCase() : null;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(
        generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    }

    // ✅ Truth Questions
    const truths = [
      "What’s the most embarrassing thing you’ve ever done?",
      "Have you ever lied to your best friend?",
      "What’s a secret you’ve never told anyone?",
      "Who was your first crush?",
      "What’s the biggest mistake you’ve made in a relationship?",
      "What’s your most embarrassing childhood memory?",
      "Have you ever cheated on a test?",
      "What’s the weirdest thing you’ve ever eaten?",
      "Have you ever stolen something?",
      "Who do you secretly admire?",
      "What’s the worst gift you’ve ever received?",
      "Have you ever pretended to like a gift you hated?",
      "What’s your guilty pleasure song?",
      "What’s your biggest fear?",
      "If you could change one thing about yourself, what would it be?",
      "Have you ever had a crush on a friend’s partner?",
      "What’s the last lie you told?",
      "Who is the last person you stalked on social media?",
      "Have you ever been caught doing something you shouldn’t?",
      "What’s the strangest dream you’ve ever had?",
      "If you could marry any celebrity, who would it be?",
      "What’s your most awkward date experience?",
      "What’s the biggest secret you’re hiding right now?",
      "What’s the most childish thing you still do?",
      "What’s your worst habit?",
    ];

    // ✅ Dares (50+)
    const dares = [
      "Send a selfie with your funniest face in this chat.",
      "Change your nickname to 'I Love Broccoli' for 10 minutes.",
      "Post the last photo in your gallery (if appropriate).",
      "Speak in emojis only for the next 5 messages.",
      "Send a voice note saying 'I am Batman!'",
      "Pretend you’re a cat for 2 minutes in chat.",
      "Text your crush 'Hi' and screenshot the reply.",
      "Do 10 pushups and send proof.",
      "Send your last search on Google.",
      "Send the first word that comes to your mind right now.",
      "Send a random meme from your gallery.",
      "React to the last 10 messages with 🔥.",
      "Change your profile picture to a potato for 1 hour.",
      "Write a poem and send it here.",
      "Say 'I’m a legend' after every message for 5 mins.",
      "Send a GIF that describes your mood.",
      "Confess something embarrassing in the chat.",
      "Use CAPS LOCK for the next 5 messages.",
      "Say 'I love pineapples on pizza' 3 times.",
      "Act like a robot in the chat for 2 mins.",
      "Change your status to 'I bark IRL' for 10 mins.",
      "Sing the chorus of your favorite song in voice chat.",
      "Copy the last message you received and send it here.",
      "Set your profile name to 'Clown' for 15 mins.",
      "Send a random emoji every 10 seconds for 1 min.",
      "Ping the server owner and say 'You're the best!'",
      "Send your best joke.",
      "Describe yourself in 3 emojis.",
      "Type without using the letter 'E' for the next 5 messages.",
      "Send a video of you dancing for 5 seconds.",
      "Make a heart using emojis ❤️💛💚💙💜.",
      "Say the alphabet backward in one message.",
      "Act like a monkey in the chat for 2 minutes.",
      "Send the oldest photo on your phone.",
      "Draw something with your mouse and send it.",
      "Pretend to be a bot and reply with 'Command not found.'",
      "Type your next 3 messages with your eyes closed.",
      "Post a funny childhood story.",
      "Make a fake love confession to someone in chat.",
      "Send your current wallpaper screenshot.",
      "Send the 3rd picture in your gallery.",
      "Type your next message backwards.",
      "Change your nickname to something funny for 1 hour.",
      "Say 'I am the king' after every sentence for 10 mins.",
      "Send a video of you saying 'Discord is life!'",
      "Send 5 random emojis that describe your day.",
      "Act like a dog in the chat for 2 mins.",
      "Send a selfie doing a weird face.",
      "Send a random lyric from a song.",
      "React to this message with 10 different emojis.",
      "Send a meme you’ve never shared before.",
    ];

    // Decide if user specified truth/dare or pick random
    let category;
    if (choice === "truth") {
      category = truths;
    } else if (choice === "dare") {
      category = dares;
    } else {
      category = Math.random() < 0.5 ? truths : dares;
    }

    const randomItem = category[Math.floor(Math.random() * category.length)];
    const title = category === truths ? "TRUTH" : "DARE";

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", title)
          .replace("%{mainRight}", emoji.mainRight) +
          `\n\n🎲 **${randomItem}**`
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
