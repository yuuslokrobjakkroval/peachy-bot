const { Command } = require("../../structures/index.js");
const numeral = require("numeral");
const Currency = require("../../schemas/currency.js");
const { COIN, getEmojiForTime } = require("../../utils/Emoji");

const cooldowns = {};

class Daily extends Command {
  constructor(client) {
    super(client, {
      name: "daily",
      description: {
        content: "Claim your daily skyrealm",
        examples: ["daily"],
        usage: "daily",
      },
      category: "economy",
      aliases: ["daily"],
      cooldown: 1,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,  // Ensure this is false if you are using message-based commands
      options: [],
    });
  }

  async run(client, ctx, args) {
    const userId = ctx.author.id;  // Should be ctx.author.id for a Message object
    const minDailyAmount = 100000;
    const maxDailyAmount = 400000;
    const cooldownTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const lastDailyTime = cooldowns[userId] || 0;
    const currentTime = Date.now();

    if (lastDailyTime && (currentTime - lastDailyTime < cooldownTime)) {
      const remainingTime = cooldownTime - (currentTime - lastDailyTime);
      const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

      return ctx.channel.send(`You can claim your daily skyrealm again in ${remainingHours} hours and ${remainingMinutes} minutes.`);
    }

    const dailyAmount = Math.floor(Math.random() * (maxDailyAmount - minDailyAmount + 1)) + minDailyAmount;

    let user = await Currency.findOne({ userId });
    if (!user) {
      await Currency.create({
        userId: ctx.author.id,
        balance: dailyAmount,
        bank: 0,
        bankSpace: 5000,
      });
    } else {
      await Currency.updateOne({ userId }, { $inc: { balance: dailyAmount } }, { upsert: true });
    }

    cooldowns[userId] = currentTime;

    const embed = this.client.embed()
        .setColor(this.client.color.main)
        .setTitle(`**${getEmojiForTime()} ${ctx.author.globalName} claimed their daily reward! **`)
        .setDescription(`${COIN} **\`+${numeral(dailyAmount).format('0,0')}\`** coins`);

    return await ctx.channel.send({ embeds: [embed] });
  }
}

module.exports = Daily;
