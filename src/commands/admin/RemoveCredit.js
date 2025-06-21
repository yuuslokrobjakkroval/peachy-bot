const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class RemoveCredit extends Command {
  constructor(client) {
    super(client, {
      name: "removecredit",
      description: {
        content: "Remove credit from the user's balance.",
        examples: ["removecredit @user 100"],
        usage: "removecredit <user> <amount>",
      },
      category: "admin",
      aliases: ["rc"],
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

    if (!user) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              client.i18n.get(language, "commands", "user_not_found"),
            ),
        ],
      });
    }

    const { coin, bank, credit } = user.balance;

    if (mention.bot)
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        client.i18n.get(language, "commands", "mention_to_bot"),
        color,
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
      const amountMap = { all: credit, half: Math.ceil(credit / 2) };
      const multiplier = { k: 1000, m: 1000000, b: 1000000000 };

      if (amount in amountMap) amount = amountMap[amount];
      else if (amount.match(/\d+[kmb]/i)) {
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
                client.i18n.get(language, "commands", "invalid_amount"),
              ),
          ],
        });
      }
    }

    const baseAmount = parseInt(amount);
    const newCredit = Math.max(credit - baseAmount, 0);

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Removed **${client.utils.formatNumber(
          baseAmount,
        )}** ${globalEmoji.card.apple} from ${mention} balance.`,
      );

    await Users.updateOne(
      { userId: mention.id },
      {
        $set: {
          "balance.coin": coin,
          "balance.bank": bank,
          "balance.credit": newCredit,
        },
      },
    ).exec();

    return await ctx.sendMessage({ embeds: [embed] });
  }
};
