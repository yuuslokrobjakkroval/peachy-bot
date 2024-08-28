const { Command } = require("../../structures/index.js");

class Poll extends Command {
  constructor(client) {
    super(client, {
      name: "poll",
      description: {
        content: "Creates a poll that users can vote on",
        examples: ['poll "Is this a good bot?" "Yes" "No"'],
        usage: 'poll "Question" "Option 1" "Option 2"',
      },
      category: "fun",
      aliases: ["vote"],
      cooldown: 5,
      args: true,
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
          name: "question",
          description: "The poll question",
          type: 3, // STRING type
          required: true,
        },
        {
          name: "option1",
          description: "First option",
          type: 3, // STRING type
          required: true,
        },
        {
          name: "option2",
          description: "Second option",
          type: 3, // STRING type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args) {
    const [question, ...options] = args.join(" ").split('"').filter((str, i) => i % 2);
    if (options.length < 2) return ctx.sendMessage("Please provide at least two options.");

    const pollEmbed = this.client.embed()
      .setColor(this.client.color.main)
      .setTitle(`Poll: ${question}`)
      .setDescription(options.map((opt, i) => `${i + 1}. ${opt}`).join("\n"))
      .setFooter({
        text: `Poll created by ${ctx.author.username}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    const pollMessage = await ctx.sendMessage({ embeds: [pollEmbed] });
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojis[i]);
    }
  }
}

module.exports = Poll;
