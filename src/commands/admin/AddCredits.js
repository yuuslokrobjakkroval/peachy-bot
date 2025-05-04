const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user.js");
const globalEmoji = require("../../utils/Emoji.js");

module.exports = class AddCredit extends Command {
  constructor(client) {
    super(client, {
      name: "addcredit",
      description: {
        content: "Add credit to a user's balance.",
        examples: ["addcredit @user 100"],
        usage: "addcredit <user> <amount>",
      },
      category: "admin",
      aliases: ["ac"],
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
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];

    const userId = typeof mention === "string" ? mention : mention.id;
    const syncUser = await client.users.fetch(userId);

    if (syncUser && syncUser?.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.botTransfer,
        color
      );
    }

    let user = await Users.findOne({ userId: syncUser.id });
    if (!user) {
      user = new Users({
        userId,
        balance: {
          coin: 0,
          bank: 0,
          credit: 0,
        },
      });
    }

    const { coin, bank, credit } = user.balance;

    let amount = ctx.isInteraction
      ? ctx.interaction.options.data[1]?.value || 1
      : args[1] || 1;
    if (
      isNaN(amount) ||
      amount <= 0 ||
      amount.toString().includes(".") ||
      amount.toString().includes(",")
    ) {
      const multiplier = { k: 1000, m: 1000000, b: 1000000000 };
      if (amount.match(/\d+[kmb]/i)) {
        const unit = amount.slice(-1).toLowerCase();
        const number = parseInt(amount);
        amount = number * multiplier[unit];
      } else {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(generalMessages.invalidAmount),
          ],
        });
      }
    }

    const baseCredits = parseInt(amount);
    const newCredit = credit + baseCredits;

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Added **${client.utils.formatNumber(
          baseCredits
        )}** ${globalEmoji.card.apple} to ${mention} balance.`
      );

    await Users.updateOne(
      { userId: mention.id },
      {
        $set: {
          "balance.credit": newCredit,
          "balance.coin": coin,
          "balance.bank": bank,
        },
      },
      { upsert: true }
    ).exec();

    return await ctx.sendMessage({ embeds: [embed] });
  }
};
