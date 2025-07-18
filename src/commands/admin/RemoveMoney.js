const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class RemoveMoney extends Command {
  constructor(client) {
    super(client, {
      name: "removemoney",
      description: {
        content: "Remove coin from user.",
        examples: ["removemoney @user 100"],
        usage: "removemoney <user> <amount>",
      },
      category: "admin",
      aliases: ["rm"],
      cooldown: 1,
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
        args[0];

    const userId = typeof mention === "string" ? mention : mention.id;
    const syncUser = await client.users.fetch(userId);
    const user = await Users.findOne({ userId: syncUser.id });
    const { coin, bank } = user.balance;

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
      const amountMap = { all: coin, half: Math.ceil(coin / 2) };
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
                client.i18n.get(language, "commands", "invalid_amount"),
              ),
          ],
        });
      }
    }

    const baseCoins = parseInt(Math.min(amount));
    const newCoin = coin - baseCoins;

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Removed **${client.utils.formatNumber(
          baseCoins,
        )}** ${emoji.coin} to ${mention} balance.`,
      );

    await Promise.all([
      Users.updateOne(
        { userId: mention.id },
        { $set: { "balance.coin": newCoin, "balance.bank": bank } },
      ).exec(),
    ]);

    return await ctx.sendMessage({ embeds: [embed] });
  }
};
