const User = require("../schemas/user.js");

class QuestTracker {
  static async updateQuestProgress(userId, action, amount = 1) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return;

      let updated = false;

      // Check daily quest
      if (user.quests?.daily && !user.quests.daily.completed) {
        if (
          this.checkQuestCompletion(
            user.quests.daily.objective,
            action,
            amount,
            user
          )
        ) {
          user.quests.daily.completed = true;
          updated = true;
        }
      }

      // Check weekly quest
      if (user.quests?.weekly && !user.quests.weekly.completed) {
        if (
          this.checkQuestCompletion(
            user.quests.weekly.objective,
            action,
            amount,
            user
          )
        ) {
          user.quests.weekly.completed = true;
          updated = true;
        }
      }

      if (updated) {
        await user.save();
      }
    } catch (error) {
      console.error("Quest tracking error:", error);
    }
  }

  static checkQuestCompletion(objective, action, amount, user) {
    // Check if objective exists and is a string
    if (!objective || typeof objective !== "string") {
      return false;
    }

    // Message-based quests
    if (
      objective.includes("Send") &&
      objective.includes("messages") &&
      action === "message"
    ) {
      const match = objective.match(/\d+/);
      if (!match) return false;
      const target = parseInt(match[0]);
      return (user.activity?.totalMessagesSent || 0) >= target;
    }

    // Pet training quests
    if (
      objective.includes("Train") &&
      objective.includes("pet") &&
      action === "pet_train"
    ) {
      const match = objective.match(/\d+/);
      if (!match) return false;
      const target = parseInt(match[0]);
      return (user.petTrainingCount || 0) >= target;
    }

    // Pet quest wins
    if (
      objective.includes("Win") &&
      objective.includes("pet quest") &&
      action === "pet_quest_win"
    ) {
      const match = objective.match(/\d+/);
      if (!match) return false;
      const target = parseInt(match[0]);
      return (user.petQuestWins || 0) >= target;
    }

    // Item collection
    if (
      objective.includes("Collect") &&
      objective.includes("items") &&
      action === "collect_item"
    ) {
      const match = objective.match(/\d+/);
      if (!match) return false;
      const target = parseInt(match[0]);
      const totalItems =
        user.inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      return totalItems >= target;
    }

    // Reactions
    if (
      objective.includes("React") &&
      objective.includes("messages") &&
      action === "reaction"
    ) {
      const match = objective.match(/\d+/);
      if (!match) return false;
      const target = parseInt(match[0]);
      return (user.reactionCount || 0) >= target;
    }

    // Pet level
    if (objective.includes("Reach pet level") && action === "pet_level") {
      const match = objective.match(/\d+/);
      if (!match) return false;
      const target = parseInt(match[0]);
      // Check if any pet in zoo reached target level
      return user.zoo?.some((pet) => pet.level >= target) || false;
    }

    return false;
  }

  static async checkAllQuests(userId) {
    // Force check all possible quest completions
    await this.updateQuestProgress(userId, "message");
    await this.updateQuestProgress(userId, "pet_train");
    await this.updateQuestProgress(userId, "pet_quest_win");
    await this.updateQuestProgress(userId, "collect_item");
    await this.updateQuestProgress(userId, "reaction");
    await this.updateQuestProgress(userId, "pet_level");
  }
}

module.exports = QuestTracker;
