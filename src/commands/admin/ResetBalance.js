const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class ResetBalance extends Command {
  constructor(client) {
    super(client, {
      name: "resetbalance",
      description: {
        content: "Reset all balance fields for all users (inventory is kept).",
        examples: ["resetbalance"],
        usage: "resetbalance",
      },
      category: "admin",
      aliases: ["rb"],
      cooldown: 1,
      args: false,
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
    // Default values from schema
    const defaultBalance = {
      coin: 25000,
      bank: 0,
      credit: 0,
      sponsor: 0,
      slots: 0,
      blackjack: 0,
      coinflip: 0,
      klaklouk: 0,
    };

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Reset all balance fields for every user. Inventory and other data are kept.`
      );

    try {
      await Users.updateMany({}, { $set: { balance: defaultBalance } }).exec();

      return await ctx.sendMessage({ embeds: [embed] });
    } catch (err) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while resetting the balances.",
        color
      );
    }
  }
};
