const { Command } = require("../../structures/index.js");

class EightBall extends Command {
  constructor(client) {
    super(client, {
      name: "8ball",
      description: {
        content: "Answers your yes/no question with a classic 8-ball response",
        examples: ['8ball "Will I pass my exam?"'],
        usage: '8ball <question>',
      },
      category: "fun",
      aliases: ["magic8", "fortune"],
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
        client: ["SendMessages", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "question",
          description: "Your yes/no question",
          type: 3, // STRING type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args) {
    const responses = [
      "Yes.",
      "No.",
      "Maybe.",
      "Ask again later.",
      "Definitely!",
      "I wouldn't count on it.",
      "Without a doubt.",
      "Very doubtful.",
      "Outlook good.",
      "Outlook not so good.",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    ctx.sendMessage(`🎱 ${response}`);
  }
}

module.exports = EightBall;
