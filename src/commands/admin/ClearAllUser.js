const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class ClearAllUser extends Command {
  constructor(client) {
    super(client, {
      name: "clearalluser",
      description: {
        content:
          "Reset ALL user data (balances, inventory, equip) and remove unused fields for database optimization.",
        examples: ["clearalluser", "clearalluser --confirm"],
        usage: "clearalluser [--confirm]",
      },
      category: "admin",
      aliases: ["cau", "clearall", "resetallusers"],
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
      // Get ALL users in the database
      const allUsers = await Users.find({})
        .select("userId balance inventory equip consumedItems cooldowns")
        .exec();

      if (allUsers.length === 0) {
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            `${globalEmoji.result.tick} No users found in the database.`
          );
        return await ctx.sendMessage({ embeds: [embed] });
      }

      // If not confirmed, show preview
      if (!confirmed) {
        // Calculate statistics
        let usersWithBalances = 0;
        let usersWithInventory = 0;
        let usersWithEquip = 0;
        let totalMoney = 0;
        let totalInventoryItems = 0;
        let totalEquipItems = 0;

        allUsers.forEach((user) => {
          const hasBalance =
            user.balance.coin > 0 ||
            user.balance.bank > 0 ||
            user.balance.credit > 0 ||
            user.balance.sponsor > 0 ||
            user.balance.slots > 0 ||
            user.balance.blackjack > 0 ||
            user.balance.coinflip > 0 ||
            user.balance.klaklouk > 0;

          if (hasBalance) {
            usersWithBalances++;
            totalMoney +=
              (user.balance.coin || 0) +
              (user.balance.bank || 0) +
              (user.balance.credit || 0) +
              (user.balance.sponsor || 0) +
              (user.balance.slots || 0) +
              (user.balance.blackjack || 0) +
              (user.balance.coinflip || 0) +
              (user.balance.klaklouk || 0);
          }

          if (user.inventory && user.inventory.length > 0) {
            usersWithInventory++;
            totalInventoryItems += user.inventory.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );
          }

          if (user.equip && user.equip.length > 0) {
            usersWithEquip++;
            totalEquipItems += user.equip.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );
          }
        });

        const warningEmbed = client
          .embed()
          .setColor(color.warning || "#FFA500")
          .setTitle("⚠️ COMPLETE DATABASE RESET WARNING")
          .setDescription(
            `**TOTAL USERS:** ${allUsers.length}\n\n` +
              "**📊 Current Database Statistics:**\n" +
              `• Users with money: ${usersWithBalances}\n` +
              `• Users with inventory: ${usersWithInventory}\n` +
              `• Users with equipment: ${usersWithEquip}\n` +
              `• Total money: ${client.utils.formatNumber(totalMoney)} ${emoji.coin}\n` +
              `• Total inventory items: ${totalInventoryItems}\n` +
              `• Total equipment items: ${totalEquipItems}\n\n` +
              "**🔥 THIS WILL COMPLETELY RESET ALL USERS:**\n\n" +
              "**💰 Balance Reset:**\n" +
              "• All coins → 25,000 (default)\n" +
              "• All other balances → 0\n\n" +
              "**🎒 Inventory & Equipment:**\n" +
              "• All inventory items → DELETED\n" +
              "• All equipped items → DELETED\n\n" +
              "**🗑️ Cleanup Operations:**\n" +
              "• Remove consumed items history\n" +
              "• Clear all cooldowns\n" +
              "• Reset gambling statistics\n" +
              "• Clear credit banking data\n" +
              "• Remove unused fields\n\n" +
              "**⚠️ THIS ACTION CANNOT BE UNDONE!**\n" +
              "Use `clearalluser --confirm` to proceed."
          )
          .setFooter({
            text: "⚠️ DANGER: This will COMPLETELY WIPE all user progress! ⚠️",
          });

        return await ctx.sendMessage({ embeds: [warningEmbed] });
      }

      // Execute the complete reset
      const updateOperations = {
        $set: {
          // Reset all balances
          "balance.coin": 25000, // Default starting amount
          "balance.bank": 0,
          "balance.credit": 0,
          "balance.sponsor": 0,
          "balance.slots": 0,
          "balance.blackjack": 0,
          "balance.coinflip": 0,
          "balance.klaklouk": 0,

          // Clear inventory and equip
          inventory: [],
          equip: [],

          // Reset progress data
          "peachy.streak": 0,
          "goma.streak": 0,

          // Reset validation flags
          "validation.isMultiTransfer": false,
          "validation.isKlaKlouk": false,
        },
        $unset: {
          // Remove unused/redundant fields to optimize database
          petTrainingCount: 0,
          petQuestWins: 0,
          reactionCount: 0,
          sellPetCount: 0,
          feedCount: 0,
          isDailyClaim: false,
          consumedItems: "",
          cooldowns: "",
          soldPets: "",
          achievements: "",
          gambling: "", // Reset all gambling statistics
          sponsorTransactions: "",
          adventurePet: "", // Reset adventure pet data
          zoo: "", // Clear zoo data

          // Remove gathering system completely
          gathering: "",

          // Remove quest system completely
          quests: "",

          // Remove credit banking system completely
          creditBank: "",
        },
      };

      const result = await Users.updateMany({}, updateOperations).exec();

      // Calculate what was reset
      const successEmbed = client
        .embed()
        .setColor(color.success || "#00FF00")
        .setTitle("🔥 COMPLETE DATABASE RESET COMPLETED")
        .setDescription(
          `Successfully reset **${result.modifiedCount}** user profiles.\n\n` +
            `**📊 Reset Statistics:**\n` +
            `• Users processed: ${result.modifiedCount}\n` +
            `• Money redistributed: ${client.utils.formatNumber(result.modifiedCount * 25000)} ${emoji.coin}\n` +
            `• Database operations: Complete cleanup`
        )
        .addFields(
          {
            name: "💰 Balance Reset",
            value: `• Coins: 25,000 ${emoji.coin}\n• All other balances: 0\n• Credit bank: Cleared`,
            inline: true,
          },
          {
            name: "🎒 Items & Progress",
            value: `• Inventory: Cleared\n• Equipment: Cleared\n• Streaks: Reset to 0`,
            inline: true,
          },
          {
            name: "🗑️ Database Optimization",
            value: `• Removed consumed items\n• Cleared cooldowns\n• Reset gambling stats\n• Cleaned unused fields`,
            inline: false,
          },
          {
            name: "📋 What Was Preserved",
            value: `• User IDs and usernames\n• Profile information\n• Social links\n• Preferences & themes\n• Relationship data\n• Work positions`,
            inline: false,
          }
        )
        .setFooter({
          text: `Database reset executed by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      return await ctx.sendMessage({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error in clearalluser command:", error);

      const errorEmbed = client
        .embed()
        .setColor(color.error || "#FF0000")
        .setDescription(
          `${globalEmoji.result.cross} An error occurred while resetting user data.\n\n` +
            `**Error:** ${error.message}\n\n` +
            `Please check the console for more details.`
        );

      return await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }
};
