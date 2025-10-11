/**
 * Configuration for slash command registration priority
 * Due to Discord's limit of 100 application commands, we need to prioritize which commands get slash command registration
 */

module.exports = {
  // Maximum number of slash commands to register (leave room for Entry Point commands)
  maxSlashCommands: 85,

  // Essential commands that should always be registered as slash commands
  essentialCommands: [
    "help",
    "ping",
    "profile",
    "balance",
    "daily",
    "work",
    "shop",
    "inventory",
    "avatar",
    "userinfo",
    "serverinfo",
    "pay",
    "leaderboard",
  ],

  // Categories with high priority for slash command registration
  priorityCategories: ["Info", "Economy", "Profile", "Social", "Utility"],

  // Categories with medium priority
  mediumPriorityCategories: ["Games", "Gambling", "Bank", "Inventory"],

  // Categories with low priority (will be excluded if limit is reached)
  lowPriorityCategories: ["admin", "developer", "Staff"],

  // Commands that should never be registered as slash commands (admin/sensitive commands)
  excludedCommands: ["eval", "exec", "reload", "shutdown"],

  // Custom priority overrides for specific commands (higher number = higher priority)
  customPriorities: {
    help: 1000,
    ping: 900,
    profile: 800,
    balance: 750,
    daily: 700,
    work: 650,
    shop: 600,
    inventory: 550,
  },
};
