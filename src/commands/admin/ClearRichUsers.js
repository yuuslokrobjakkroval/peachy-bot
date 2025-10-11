const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class ClearRichUsers extends Command {
  constructor(client) {
    super(client, {
      name: "clearrichusers",
      description: {
        content:
          "Clear ALL balances for ALL users (coin, bank, credit, sponsor, gambling balances).",
        examples: ["clearrichusers", "clearrichusers --confirm"],
        usage: "clearrichusers [--confirm]",
      },
      category: "admin",
      aliases: ["cru", "clearrich", "clearallmoney"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "confirm",
          description: "Confirm the action (required for execution)",
          type: 5, // Boolean
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    // Parse confirmation argument
    let confirmed = false;
    if (ctx.isInteraction) {
      confirmed = ctx.options?.getBoolean("confirm") || false;
    } else {
      confirmed = args.includes("--confirm") || args.includes("-c");
    }

    try {
      // Get ALL users with any balance (excluding those with 0 in all fields)
      const affectedUsers = await Users.find({
        $or: [
          { "balance.coin": { $gt: 0 } },
          { "balance.bank": { $gt: 0 } },
          { "balance.credit": { $gt: 0 } },
          { "balance.sponsor": { $gt: 0 } },
          { "balance.slots": { $gt: 0 } },
          { "balance.blackjack": { $gt: 0 } },
          { "balance.coinflip": { $gt: 0 } },
          { "balance.klaklouk": { $gt: 0 } },
        ],
      })
        .select("userId balance")
        .exec();

      if (affectedUsers.length === 0) {
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            `${globalEmoji.result.tick} No users found with any balances to clear.`
          );
        return await ctx.sendMessage({ embeds: [embed] });
      }

      // If not confirmed, show preview
      if (!confirmed) {
        let previewText = "";
        const maxPreview = 10;

        for (let i = 0; i < Math.min(affectedUsers.length, maxPreview); i++) {
          const user = affectedUsers[i];
          const member = await ctx.guild.members
            .fetch(user.userId)
            .catch(() => null);
          const displayName = member
            ? member.displayName
            : `User ${user.userId}`;

          const totalBalance =
            user.balance.coin +
            user.balance.bank +
            user.balance.credit +
            user.balance.sponsor +
            user.balance.slots +
            user.balance.blackjack +
            user.balance.coinflip +
            user.balance.klaklouk;

          previewText += `• **${displayName}** - `;
          previewText += `Total: ${client.utils.formatNumber(totalBalance)} `;
          previewText += `(C: ${client.utils.formatNumber(user.balance.coin)}, `;
          previewText += `B: ${client.utils.formatNumber(user.balance.bank)})\n`;
        }

        if (affectedUsers.length > maxPreview) {
          previewText += `\n... and ${affectedUsers.length - maxPreview} more users`;
        }

        const warningEmbed = client
          .embed()
          .setColor(color.warning || "#FFA500")
          .setTitle("⚠️ MASS MONEY WIPE WARNING")
          .setDescription(
            `**${affectedUsers.length}** users found with balances to clear.\n\n` +
              "**Affected Users Preview:**\n" +
              previewText +
              "\n\n" +
              "**⚠️ THIS WILL CLEAR ALL MONEY FROM ALL USERS!**\n" +
              "**⚠️ This action cannot be undone!**\n\n" +
              "This will reset ALL balance types to 0:\n" +
              "• Coins • Bank • Credit • Sponsor\n" +
              "• Slots • Blackjack • Coinflip • KlaKlouk\n\n" +
              "Use `clearrichusers --confirm` or `/clearrichusers confirm:True` to proceed."
          )
          .setFooter({
            text: "⚠️ DANGER: This will reset ALL balances for ALL users to 0 ⚠️",
          });

        return await ctx.sendMessage({ embeds: [warningEmbed] });
      }

      // Execute the mass clear - Clear ALL balances for ALL users
      const result = await Users.updateMany(
        {
          $or: [
            { "balance.coin": { $gt: 0 } },
            { "balance.bank": { $gt: 0 } },
            { "balance.credit": { $gt: 0 } },
            { "balance.sponsor": { $gt: 0 } },
            { "balance.slots": { $gt: 0 } },
            { "balance.blackjack": { $gt: 0 } },
            { "balance.coinflip": { $gt: 0 } },
            { "balance.klaklouk": { $gt: 0 } },
          ],
        },
        {
          $set: {
            "balance.coin": 0,
            "balance.bank": 0,
            "balance.credit": 0,
            "balance.sponsor": 0,
            "balance.slots": 0,
            "balance.blackjack": 0,
            "balance.coinflip": 0,
            "balance.klaklouk": 0,
          },
        }
      ).exec();

      // Calculate total money removed
      const totalMoneyRemoved = affectedUsers.reduce((total, user) => {
        return (
          total +
          user.balance.coin +
          user.balance.bank +
          user.balance.credit +
          user.balance.sponsor +
          user.balance.slots +
          user.balance.blackjack +
          user.balance.coinflip +
          user.balance.klaklouk
        );
      }, 0);

      const successEmbed = client
        .embed()
        .setColor(color.success || "#00FF00")
        .setTitle("💸 MASS MONEY WIPE COMPLETED")
        .setDescription(
          `Successfully cleared ALL balances for **${result.modifiedCount}** users.\n\n` +
            `**Statistics:**\n` +
            `• Users affected: ${result.modifiedCount}\n` +
            `• Total money removed: ${client.utils.formatNumber(totalMoneyRemoved)} ${emoji.coin}\n` +
            `• Balance types cleared: ALL (8 types)`
        )
        .addFields(
          {
            name: "💰 Cleared Balance Types",
            value: `• Coins\n• Bank\n• Credit\n• Sponsor`,
            inline: true,
          },
          {
            name: "🎰 Gambling Balances",
            value: `• Slots\n• Blackjack\n• Coinflip\n• KlaKlouk`,
            inline: true,
          },
          {
            name: "📊 Action Summary",
            value: `ALL balance types have been reset to 0 for ALL users with any existing balances. No threshold was applied - everyone's money has been wiped.`,
            inline: false,
          }
        )
        .setFooter({
          text: `Executed by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      return await ctx.sendMessage({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error in clearrichusers command:", error);

      const errorEmbed = client
        .embed()
        .setColor(color.error || "#FF0000")
        .setDescription(
          `${globalEmoji.result.cross} An error occurred while clearing all user balances.\n\n` +
            `**Error:** ${error.message}`
        );

      return await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }
};
