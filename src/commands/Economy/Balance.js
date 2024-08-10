const { Command } = require("../../structures");
const Currency = require("../../schemas/user");
const numeral = require("numeral");
const { TITLE , COIN} = require("../../utils/Emoji");

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
    let data = await Currency.findOne({ userId: ctx.author.id });
    if (!data) {
      data = await Currency.create({
        userId: ctx.author.id,
        balance: 500,
      });
    }

    let embed = this.client.embed();
    let balance = data.balance;

    return await ctx.sendMessage({
      embeds: [
        embed
          .setColor(this.client.color.main)
            .setTitle(`${TITLE} ${ctx.author.globalName ? ctx.author.globalName : ctx.author.username} ${TITLE}`)
            .setDescription(`Coin: **${numeral(balance.toLocaleString()).format()} ${COIN}**`),
      ],
    });
  }
}

module.exports = Balance;