const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class Upset extends Command {
  constructor(client) {
    super(client, {
      name: "upset",
      description: {
        content: "Express that you're upset with another user.",
        examples: ["upset @User"],
        usage: "upset @User",
      },
      category: "actions",
      aliases: ["mad", "sad", "hurt"],
      cooldown: 5,
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
          description: "The user you are upset with",
          type: 6, // USER
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args) {
    try {
      const upsetMessages = [
        "Why do you always ignore me?",
        "It feels like you don’t care about me at all.",
        "I’m tired of pretending everything’s okay.",
        "You broke my heart again.",
        "I thought you were different, but I was wrong.",
        "You don’t listen to me when I talk.",
        "Why am I always the one trying?",
        "You don’t understand how much this hurts me.",
        "I feel so alone even when you’re around.",
        "You make me feel invisible.",
        "I don’t know why I keep trusting you.",
        "It’s like you’ve changed into someone else.",
        "Why do you never apologize?",
        "I wish you could see how sad you make me.",
        "I’m upset because you didn’t tell me the truth.",
        "You promised, but you didn’t keep your word.",
        "I feel like I’m walking on eggshells around you.",
        "You don’t care about my feelings.",
        "Why do you act like I don’t matter?",
        "I’m hurt that you forgot something important to me.",
        "You left me hanging when I needed you most.",
        "I’m tired of feeling like the bad guy.",
        "You don’t take me seriously.",
        "I wish things could go back to how they were.",
        "I’m upset because you didn’t defend me.",
        "It hurts when you don’t make time for me.",
        "I feel like I’m always the one giving.",
        "You shut me out when I try to talk.",
        "I’m sad because you don’t share your feelings.",
        "You don’t appreciate the things I do.",
        "Why do you keep making the same mistakes?",
      ];

      const targetUser = args[0] || (ctx.options && ctx.options.user);
      if (!targetUser) {
        return ctx.reply("Please mention a user to express your feelings to.");
      }

      const randomMessage =
        upsetMessages[Math.floor(Math.random() * upsetMessages.length)];
      return ctx.reply(`${targetUser}, ${randomMessage}`);
    } catch (error) {
      console.error("Error in upset command:", error);
      return ctx.reply("An error occurred while processing your request.");
    }
  }
};
