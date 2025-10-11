/**
 * Utility script to clear all application commands
 * Use this if you need to reset your slash commands due to hitting the limit
 *
 * Usage: node clearCommands.js
 */

const { REST, Routes } = require("discord.js");
const config = require("../config");

async function clearAllCommands() {
  try {
    console.log("🧹 Starting to clear all application commands...");

    const rest = new REST({ version: "10" }).setToken(config.token);

    // Clear global commands
    const globalCommands = Routes.applicationCommands(config.clientId);

    // Clear guild commands (if in development)
    const guildCommands = config.production
      ? null
      : Routes.applicationGuildCommands(config.clientId, config.guildId);

    // Get current commands first
    console.log("📋 Fetching current commands...");
    const currentGlobalCommands = await rest.get(globalCommands);
    console.log(`Found ${currentGlobalCommands.length} global commands`);

    let currentGuildCommands = [];
    if (guildCommands) {
      try {
        currentGuildCommands = await rest.get(guildCommands);
        console.log(`Found ${currentGuildCommands.length} guild commands`);
      } catch (error) {
        console.log("No guild commands found or error fetching guild commands");
      }
    }

    // Clear global commands
    if (currentGlobalCommands.length > 0) {
      console.log("🗑️  Clearing global commands...");
      await rest.put(globalCommands, { body: [] });
      console.log("✅ Global commands cleared!");
    }

    // Clear guild commands
    if (guildCommands && currentGuildCommands.length > 0) {
      console.log("🗑️  Clearing guild commands...");
      await rest.put(guildCommands, { body: [] });
      console.log("✅ Guild commands cleared!");
    }

    console.log("🎉 All commands cleared successfully!");
    console.log(
      "ℹ️  You can now restart your bot to register commands with the new priority system."
    );
  } catch (error) {
    console.error("❌ Error clearing commands:", error);

    if (error.code === 50001) {
      console.log(
        "⚠️  Missing access - make sure your bot has the applications.commands scope"
      );
    } else if (error.code === 10002) {
      console.log("⚠️  Unknown application - check your client ID in config");
    }
  }
}

// Add confirmation prompt
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("⚠️  This will clear ALL application commands for your bot.");
console.log("Are you sure you want to continue? This action cannot be undone.");
rl.question('Type "yes" to confirm: ', (answer) => {
  if (answer.toLowerCase() === "yes") {
    clearAllCommands().finally(() => rl.close());
  } else {
    console.log("Operation cancelled.");
    rl.close();
  }
});

module.exports = { clearAllCommands };
