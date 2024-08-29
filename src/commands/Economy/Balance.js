const { Command } = require("../../structures");
const Users = require("../../schemas/User");
const numeral = require("numeral");
const { TITLE, COIN, DAILY } = require("../../utils/Emoji");

class Balance extends Command {
  constructor(client) {
    super(client, {
      name: "balance",
      description: {
        content: "Shows the coin balance",
        examples: ["coin"],
        usage: "coin",
      },
      category: "economy",
      aliases: ["bal", "cash", "coin"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  async run(client, ctx, args) {
    let user = await Users.findOne({ userId: ctx.author.id });

    // Check if the user is trying to give coins to themselves
    if (ctx.author.id === ctx.target?.id) {
      return ctx.sendMessage({
        content: "You cannot give coins to yourself!",
        ephemeral: true,
      });
    }

    let embed = this.client.embed();
    let balance = user.balance;
    let prefix = this.client.config.prefix;

    return await ctx.sendMessage({
      embeds: [
        embed
            .setColor(this.client.color.main)
            .setTitle(`**${TITLE} ${ctx.author.displayName} ${TITLE}**`)
            .setDescription(
                `Coin: **${numeral(balance.toLocaleString()).format()} ${COIN}**\n` +
                `\nClaim your daily reward using **\`${prefix}daily!\`** ${DAILY}`
            ),
      ],
    });
  }
}

module.exports = Balance;
