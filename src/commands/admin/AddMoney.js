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
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

    // Defer reply to handle potential delays
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
    }

    // Parse user mention or ID
    let mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user") || ctx.author
      : ctx.message.mentions.members.first()?.user ||
        ctx.guild.members.cache.get(args[0])?.user ||
        args[0];

    // Extract user ID from mention or input
    let userId;
    if (typeof mention === "string") {
      // Handle raw mention (e.g., "<@926038347187634207>")
      const match = mention.match(/^<@!?(\d+)>$/);
      if (match) {
        userId = match[1]; // Extract the numeric ID
      } else {
        // Try treating the input as a raw ID
        userId = mention;
      }
    } else {
      userId = mention.id;
    }

    // Validate userId is a snowflake (numeric and reasonable length)
    if (!/^\d{17,19}$/.test(userId)) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.invalidUser || "Invalid user provided. Please mention a user or provide a valid user ID.",
        color
      );
    }

    // Fetch user from Discord API
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

    // Check if user is a bot
    if (syncUser.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.botTransfer || "Cannot add money to a bot's balance.",
        color
      );
    }

    // Fetch or create user in database
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

    // Parse amount
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
          generalMessages?.invalidAmount || "Invalid amount. Please provide a positive number (e.g., 100, 1k, 1m).",
          color
        );
      }
    }

    const baseCoins = parseInt(amount);
    const newCoin = coin + baseCoins;

    // Create success embed
    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Added **${client.utils.formatNumber(baseCoins)}** ${
          emoji.coin
        } to ${syncUser.tag}'s balance.`
      );

    // Update user balance in database
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
        generalMessages?.databaseError || "An error occurred while updating the balance. Please try again.",
        color
      );
    }

    // Send success message
    return await client.utils.sendSuccessMessage(
      client,
      ctx,
      embed.description,
      color,
      5000
    );
  }
};