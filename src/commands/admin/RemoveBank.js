const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class RemoveBank extends Command {
  constructor(client) {
    super(client, {
      name: "removebank",
      description: {
        content: "Remove coin from the user's bank.",
        examples: ["removebank @user 100"],
        usage: "removebank <user> <amount>",
      },
      category: "admin",
      aliases: ["rb"],
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        ctx.author;
    const user = await Users.findOne({ userId: mention.id });
    const { coin, bank } = user.balance;

    if (mention.bot)
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        client.i18n.get(language, "commands", "mention_to_bot"),
        color
      );

    let amount = ctx.isInteraction
      ? ctx.interaction.options.data[0]?.value || 1
      : args[1] || 1;
    if (
      isNaN(amount) ||
      amount < 1 ||
      amount.toString().includes(".") ||
      amount.toString().includes(",")
    ) {
      const amountMap = { all: bank, half: Math.ceil(bank / 2) };
      const multiplier = { k: 1000, m: 1000000, b: 1000000000 };

      if (amount in amountMap) amount = amountMap[amount];
      else if (amount.match(/\d+[kmbtq]/i)) {
        const unit = amount.slice(-1).toLowerCase();
        const number = parseInt(amount);
        amount = number * (multiplier[unit] || 1);
      } else {
        return await ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                client.i18n.get(language, "commands", "invalid_amount")
              ),
          ],
        });
      }
    }

    const baseAmount = parseInt(Math.min(amount));
    const newBank = Math.max(bank - baseAmount, 0); // Ensure bank balance doesn't go negative

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Removed **${client.utils.formatNumber(
          baseAmount
        )}** ${emoji.coin} from ${mention}'s bank balance.`
      );

    await Users.updateOne(
      { userId: mention.id },
      { $set: { "balance.coin": coin, "balance.bank": newBank } }
    ).exec();

    return await ctx.sendMessage({ embeds: [embed] });
  }
};
