const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class AddMoney extends Command {
  constructor(client) {
    super(client, {
      name: "addmoney",
      description: {
        content: "Add coin to a user's balance.",
        examples: ["addmoney @user 100"],
        usage: "addmoney <user> <amount>",
      },
      category: "admin",
      aliases: ["addm", "am"],
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
      ? ctx.interaction.options.getUser("user") || ctx.author
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];

    const userId = typeof mention === "string" ? mention : mention.id;

    let syncUser;
    try {
      syncUser = await client.users.fetch(userId);
    } catch (error) {
      console.error("Error fetching user:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.invalidUser || "Could not find the specified user.",
        color
      );
    }

    if (syncUser.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.botTransfer || "Cannot add money to a bot's balance.",
        color
      );
    }

    let user = await Users.findOne({ userId: syncUser.id });
    if (!user) {
      user = new Users({
        userId: syncUser.id,
        balance: {
          coin: 0,
          bank: 0,
        },
      });
    }

    const { coin, bank } = user.balance;

    let amount = ctx.isInteraction
      ? ctx.interaction.options.data[1]?.value || 1
      : args[1] || 1;

    if (
      isNaN(amount) ||
      amount <= 0 ||
      amount.toString().includes(".") ||
      amount.toString().includes(",")
    ) {
      const multipliers = { k: 1000, m: 1000000, b: 1000000000 };
      if (amount.match(/\d+[kmb]/i)) {
        const unit = amount.slice(-1).toLowerCase();
        const number = parseInt(amount);
        amount = number * multipliers[unit];
      } else {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages?.invalidAmount ||
            "Invalid amount. Please provide a positive number (e.g., 100, 1k, 1m).",
          color
        );
      }
    }

    const baseCoins = parseInt(amount);
    const newCoin = coin + baseCoins;

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Added **${client.utils.formatNumber(
          baseCoins
        )}** ${emoji.coin} to ${syncUser.tag}'s balance.`
      );

    try {
      await Users.updateOne(
        { userId: syncUser.id },
        { $set: { "balance.coin": newCoin, "balance.bank": bank } },
        { upsert: true }
      ).exec();
    } catch (error) {
      console.error("Error updating user balance:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.databaseError ||
          "An error occurred while updating the balance. Please try again.",
        color
      );
    }

    return await ctx.sendMessage({ embeds: [embed] });
  }
};
