const { Command } = require("../../structures/index.js");
const { MessageEmbed } = require("discord.js");

class Quote extends Command {
  constructor(client) {
    super(client, {
      name: "quote",
      description: {
        content: "Saves and displays memorable quotes",
        examples: ['quote add "This is a quote!"', 'quote random'],
        usage: 'quote <add|random> [message]',
      },
      category: "fun",
      aliases: ["q"],
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
          name: "action",
          description: "Action to perform (add or random)",
          type: 3, // STRING type
          required: true,
          choices: [
            { name: "Add", value: "add" },
            { name: "Random", value: "random" },
          ],
        },
        {
          name: "message",
          description: "The quote message to add",
          type: 3, // STRING type
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args) {
    const [action, ...message] = args;
    const quotes = client.db.get("quotes") || [];

    if (action === "add") {
      if (!message.length) return ctx.sendMessage("Please provide a quote message.");
      quotes.push(message.join(" "));
      client.db.set("quotes", quotes);
      ctx.sendMessage("Quote added!");
    } else if (action === "random") {
      if (!quotes.length) return ctx.sendMessage("No quotes available.");
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      const embed = new MessageEmbed()
        .setColor(client.color.main)
        .setTitle("Random Quote")
        .setDescription(`"${randomQuote}"`)
        .setFooter({
          text: `Requested by ${ctx.author.username}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();
      ctx.sendMessage({ embeds: [embed] });
    } else {
      ctx.sendMessage("Invalid action. Use `add` or `random`.");
    }
  }
}

module.exports = Quote;
