const Users = require("../schemas/user");
const BotLog = require("../utils/BotLog");

class EconomyManager {
  constructor(client) {
    this.client = client;
    this.transactionLog = new Map(); // Store recent transactions for analytics
    this.economyStats = {
      totalCoins: 0,
      totalTransactions: 0,
      largestTransaction: 0,
      lastUpdated: new Date(),
    };

    // Initialize economy stats
    this.updateEconomyStats();

    // Update stats every hour
    setInterval(() => this.updateEconomyStats(), 3600000);
  }

  /**
   * Add coins to a user's wallet
   * @param {string} userId - The user ID
   * @param {number} amount - Amount of coins to add
   * @param {string} reason - Reason for adding coins
   * @returns {Promise<Object>} Updated user data
   */
  async addCoins(userId, amount, reason = "Unknown") {
    if (!userId || amount <= 0) return null;

    try {
      // Update user balance
      const user = await Users.findOneAndUpdate(
        { userId },
        { $inc: { "balance.coin": amount } },
        { new: true, upsert: true },
      );

      // Log transaction
      this.logTransaction(userId, amount, "add", reason);

      // Check for achievements
      if (this.client.achievementManager) {
        await this.client.achievementManager.checkEconomyAchievements(
          userId,
          user.balance.coin + user.balance.bank,
        );
      }

      return user;
    } catch (error) {
      console.error(`[ECONOMY] Error adding coins to ${userId}:`, error);
      return null;
    }
  }

  /**
   * Remove coins from a user's wallet
   * @param {string} userId - The user ID
   * @param {number} amount - Amount of coins to remove
   * @param {string} reason - Reason for removing coins
   * @returns {Promise<Object|null>} Updated user data or null if insufficient funds
   */
  async removeCoins(userId, amount, reason = "Unknown") {
    if (!userId || amount <= 0) return null;

    try {
      // Get current balance
      const user = await Users.findOne({ userId });
      if (!user || user.balance.coin < amount) return null;

      // Update user balance
      const updatedUser = await Users.findOneAndUpdate(
        { userId },
        { $inc: { "balance.coin": -amount } },
        { new: true },
      );

      // Log transaction
      this.logTransaction(userId, amount, "remove", reason);

      return updatedUser;
    } catch (error) {
      console.error(`[ECONOMY] Error removing coins from ${userId}:`, error);
      return null;
    }
  }

  /**
   * Transfer coins between users
   * @param {string} senderId - Sender's user ID
   * @param {string} receiverId - Receiver's user ID
   * @param {number} amount - Amount to transfer
   * @returns {Promise<boolean>} Success status
   */
  async transferCoins(senderId, receiverId, amount) {
    if (!senderId || !receiverId || amount <= 0 || senderId === receiverId)
      return false;

    try {
      // Check sender's balance
      const sender = await Users.findOne({ userId: senderId });
      if (!sender || sender.balance.coin < amount) return false;

      // Remove from sender
      await this.removeCoins(senderId, amount, `Transfer to ${receiverId}`);

      // Add to receiver
      await this.addCoins(receiverId, amount, `Transfer from ${senderId}`);

      // Log transaction
      this.logTransaction(senderId, amount, "transfer", `To ${receiverId}`);

      return true;
    } catch (error) {
      console.error(
        `[ECONOMY] Error transferring coins from ${senderId} to ${receiverId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Deposit coins to bank
   * @param {string} userId - User ID
   * @param {number} amount - Amount to deposit
   * @returns {Promise<Object|null>} Updated user data or null if failed
   */
  async depositCoins(userId, amount) {
    if (!userId || amount <= 0) return null;

    try {
      // Check wallet balance
      const user = await Users.findOne({ userId });
      if (!user || user.balance.coin < amount) return null;

      // Update balances
      const updatedUser = await Users.findOneAndUpdate(
        { userId },
        {
          $inc: {
            "balance.coin": -amount,
            "balance.bank": amount,
          },
        },
        { new: true },
      );

      // Log transaction
      this.logTransaction(userId, amount, "deposit", "Bank deposit");

      return updatedUser;
    } catch (error) {
      console.error(`[ECONOMY] Error depositing coins for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Withdraw coins from bank
   * @param {string} userId - User ID
   * @param {number} amount - Amount to withdraw
   * @returns {Promise<Object|null>} Updated user data or null if failed
   */
  async withdrawCoins(userId, amount) {
    if (!userId || amount <= 0) return null;

    try {
      // Check bank balance
      const user = await Users.findOne({ userId });
      if (!user || user.balance.bank < amount) return null;

      // Update balances
      const updatedUser = await Users.findOneAndUpdate(
        { userId },
        {
          $inc: {
            "balance.coin": amount,
            "balance.bank": -amount,
          },
        },
        { new: true },
      );

      // Log transaction
      this.logTransaction(userId, amount, "withdraw", "Bank withdrawal");

      return updatedUser;
    } catch (error) {
      console.error(`[ECONOMY] Error withdrawing coins for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user's economic rank based on net worth
   * @param {number} netWorth - User's net worth (coin + bank)
   * @returns {string} Economic rank title
   */
  getEconomicRank(netWorth) {
    if (netWorth >= 1000000000) return "Billionaire";
    if (netWorth >= 100000000) return "Tycoon";
    if (netWorth >= 10000000) return "Magnate";
    if (netWorth >= 1000000) return "Millionaire";
    if (netWorth >= 100000) return "Wealthy";
    if (netWorth >= 10000) return "Comfortable";
    if (netWorth >= 1000) return "Aspiring";
    return "Beginner";
  }

  /**
   * Log a transaction for analytics
   * @param {string} userId - User ID
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {string} reason - Transaction reason
   */
  logTransaction(userId, amount, type, reason) {
    const transaction = {
      userId,
      amount,
      type,
      reason,
      timestamp: new Date(),
    };

    // Store in recent transactions (limit to 100 most recent)
    const userTransactions = this.transactionLog.get(userId) || [];
    userTransactions.unshift(transaction);
    if (userTransactions.length > 100) userTransactions.pop();
    this.transactionLog.set(userId, userTransactions);

    // Update stats
    this.economyStats.totalTransactions++;
    if (amount > this.economyStats.largestTransaction) {
      this.economyStats.largestTransaction = amount;
    }
  }

  /**
   * Update overall economy statistics
   */
  async updateEconomyStats() {
    try {
      // Calculate total coins in circulation
      const result = await Users.aggregate([
        {
          $group: {
            _id: null,
            totalCoins: { $sum: { $add: ["$balance.coin", "$balance.bank"] } },
          },
        },
      ]);

      if (result && result.length > 0) {
        this.economyStats.totalCoins = result[0].totalCoins;
        this.economyStats.lastUpdated = new Date();
      }
    } catch (error) {
      console.error("[ECONOMY] Error updating economy stats:", error);
    }
  }

  /**
   * Get recent transactions for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of transactions to return
   * @returns {Array} Recent transactions
   */
  getUserTransactions(userId, limit = 10) {
    const transactions = this.transactionLog.get(userId) || [];
    return transactions.slice(0, limit);
  }

  /**
   * Get economy statistics
   * @returns {Object} Economy statistics
   */
  getEconomyStats() {
    return this.economyStats;
  }

  /**
   * Award an item to a user
   * @param {string} userId - The user's Discord ID
   * @param {string} itemId - The item ID
   * @param {number} quantity - Quantity to award
   * @param {string} source - Source of the item
   * @returns {Promise<{success: boolean, error: string}>}
   */
  async awardItem(userId, itemId, quantity = 1, source = "system") {
    try {
      if (quantity <= 0) {
        return { success: false, error: "Quantity must be positive" };
      }

      const user = await Users.findOne({ userId });
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Find the item in the user's inventory
      const itemIndex = user.inventory.findIndex((item) => item.id === itemId);

      if (itemIndex > -1) {
        // Item exists, update quantity
        await Users.updateOne(
          { userId, "inventory.id": itemId },
          { $inc: { "inventory.$.quantity": quantity } },
        );
      } else {
        // Item doesn't exist, add it
        await Users.updateOne(
          { userId },
          { $push: { inventory: { id: itemId, quantity } } },
        );
      }

      // Log the item award
      BotLog.send(
        this.client,
        `Awarded ${quantity}x ${itemId} to user ${userId} from ${source}`,
        "info",
      );

      // Check for inventory-related achievements
      if (this.client.achievementManager) {
        await this.client.achievementManager.checkInventoryAchievements(userId);
      }

      return { success: true };
    } catch (error) {
      console.error("Error awarding item:", error);
      return { success: false, error: "Internal error" };
    }
  }

  /**
   * Get a user's economic statistics
   * @param {string} userId - The user's Discord ID
   * @returns {Promise<{balance: Object, netWorth: number, transactions: Array}>}
   */
  async getUserEconomyStats(userId) {
    try {
      const user = await Users.findOne({ userId });
      if (!user) {
        return null;
      }

      // Calculate net worth (coins + bank + item values)
      const coinBalance = user.balance.coin || 0;
      const bankBalance = user.balance.bank || 0;

      // Get recent transactions
      const recentTransactions = this.getUserTransactions(userId, 10);

      return {
        balance: user.balance,
        netWorth: coinBalance + bankBalance,
        transactions: recentTransactions,
      };
    } catch (error) {
      console.error("Error getting user economy stats:", error);
      return null;
    }
  }

  /**
   * Get server-wide economy statistics
   * @returns {Promise<{totalCoins: number, richestUsers: Array, averageBalance: number}>}
   */
  async getServerEconomyStats() {
    try {
      // Get all users
      const users = await Users.find({});

      // Calculate total coins in circulation
      const totalCoins = this.economyStats.totalCoins;

      // Get top 10 richest users
      const usersWithNetWorth = await Users.aggregate([
        {
          $project: {
            userId: 1,
            username: 1,
            netWorth: { $add: ["$balance.coin", "$balance.bank"] },
          },
        },
        { $sort: { netWorth: -1 } },
        { $limit: 10 },
      ]);

      const richestUsers = usersWithNetWorth.map((user) => ({
        userId: user.userId,
        username: user.username || user.userId,
        netWorth: user.netWorth,
      }));

      // Calculate average balance
      const averageBalance = users.length > 0 ? totalCoins / users.length : 0;

      return {
        totalCoins,
        richestUsers,
        averageBalance,
        userCount: users.length,
      };
    } catch (error) {
      console.error("Error getting server economy stats:", error);
      return null;
    }
  }
}

module.exports = EconomyManager;
