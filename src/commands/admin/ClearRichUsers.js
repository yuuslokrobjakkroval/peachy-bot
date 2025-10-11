const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class ClearRichUsers extends Command {
  constructor(client) {
    super(client, {
      name: "clearrichusers",
      description: {
        content: "Clear balances for all users with coin or bank > 1 billion.",
        examples: ["clearrichusers", "clearrichusers --confirm"],
        usage: "clearrichusers [--confirm]",
      },
      category: "admin",
      aliases: ["cru", "clearrich"],
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
    const THRESHOLD = 1000000000; // 1 billion (1000m)

    // Parse confirmation argument
    let confirmed = false;
    if (ctx.isInteraction) {
      confirmed = ctx.options?.getBoolean("confirm") || false;
    } else {
      confirmed = args.includes("--confirm") || args.includes("-c");
    }

    try {
      // First, get count of users who would be affected
      const affectedUsers = await Users.find({
        $or: [
          { "balance.coin": { $gt: THRESHOLD } },
          { "balance.bank": { $gt: THRESHOLD } },
        ],
      })
        .select("userId balance.coin balance.bank")
        .exec();

      if (affectedUsers.length === 0) {
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            `${globalEmoji.result.tick} No users found with balances over ${client.utils.formatNumber(THRESHOLD)} coins.`
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

          previewText += `• **${displayName}** - `;
          previewText += `Coin: ${client.utils.formatNumber(user.balance.coin)}, `;
          previewText += `Bank: ${client.utils.formatNumber(user.balance.bank)}\n`;
        }

        if (affectedUsers.length > maxPreview) {
          previewText += `\n... and ${affectedUsers.length - maxPreview} more users`;
        }

        const warningEmbed = client
          .embed()
          .setColor(color.warning || "#FFA500")
          .setTitle("⚠️ Mass Balance Clear Warning")
          .setDescription(
            `**${affectedUsers.length}** users found with balances over ${client.utils.formatNumber(THRESHOLD)} coins.\n\n` +
              "**Affected Users Preview:**\n" +
              previewText +
              "\n\n" +
              "**⚠️ This action cannot be undone!**\n" +
              "Use `clearrichusers --confirm` or `/clearrichusers confirm:True` to proceed."
          )
          .setFooter({
            text: "This will reset both coin and bank balances to 0 for all affected users",
          });

        return await ctx.sendMessage({ embeds: [warningEmbed] });
      }

      // Execute the mass clear
      const result = await Users.updateMany(
        {
          $or: [
            { "balance.coin": { $gt: THRESHOLD } },
            { "balance.bank": { $gt: THRESHOLD } },
          ],
        },
        {
          $set: {
            "balance.coin": 0,
            "balance.bank": 0,
          },
        }
      ).exec();

      // Calculate total money removed
      const totalCoinsRemoved = affectedUsers.reduce((total, user) => {
        const coinAmount =
          user.balance.coin > THRESHOLD ? user.balance.coin : 0;
        const bankAmount =
          user.balance.bank > THRESHOLD ? user.balance.bank : 0;
        return total + coinAmount + bankAmount;
      }, 0);

      const successEmbed = client
        .embed()
        .setColor(color.success || "#00FF00")
        .setTitle("✅ Mass Balance Clear Completed")
        .setDescription(
          `Successfully cleared balances for **${result.modifiedCount}** users.\n\n` +
            `**Statistics:**\n` +
            `• Users affected: ${result.modifiedCount}\n` +
            `• Total money removed: ${client.utils.formatNumber(totalCoinsRemoved)} ${emoji.coin}\n` +
            `• Threshold used: ${client.utils.formatNumber(THRESHOLD)} ${emoji.coin}`
        )
        .addFields({
          name: "📊 Action Summary",
          value: `Both coin and bank balances have been reset to 0 for all users with either balance exceeding ${client.utils.formatNumber(THRESHOLD)} coins.`,
          inline: false,
        })
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
          `${globalEmoji.result.cross} An error occurred while clearing rich user balances.\n\n` +
            `**Error:** ${error.message}`
        );

      return await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }
};
