const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const { TITLE , COIN, DAILY} = require("../../utils/Emoji");

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

    let embed = this.client.embed();
    let balance = user.balance;
    let prefix = this.client.config.prefix;

    return await ctx.sendMessage({
      embeds: [
        embed
            .setColor(this.client.color.main)
            .setTitle(`**${TITLE} ${ctx.author.globalName ? ctx.author.globalName : ctx.author.username} ${TITLE}**`)
            .setDescription(`Coin: **${numeral(balance.toLocaleString()).format()} ${COIN}**\n` + `\nClaim your daily reward using **\`${prefix}daily!\`** ${DAILY}`)
      ],
    });
  }
}

module.exports = Balance;