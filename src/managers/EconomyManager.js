const Users = require("../schemas/user");

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
      // Get current user data
      let user = await Users.findOne({ userId });

      if (!user) {
        // Create new user with default balance
        user = new Users({
          userId,
          balance: {
            coin: 25000,
            bank: 0,
            credit: 0,
            sponsor: 0,
            slots: 0,
            blackjack: 0,
            coinflip: 0,
            klaklouk: 0,
          },
        });
      }

      // Update balance
      user.balance.coin += amount;
      const updatedUser = await user.save();

      // Log transaction
      this.logTransaction(userId, amount, "add", reason);

      // Check for achievements
      if (this.client.achievementManager) {
        await this.client.achievementManager.checkEconomyAchievements(
          userId,
          updatedUser.balance.coin + updatedUser.balance.bank
        );
      }

      return updatedUser;
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
      // Get current user data
      const user = await Users.findOne({ userId });
      if (!user || user.balance.coin < amount) return null;

      // Update user balance
      user.balance.coin -= amount;
      const updatedUser = await user.save();

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
        error
      );
      return false;
    }
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
}

module.exports = EconomyManager;
