/**
 * Manual Entry Point command management utility
 * This script helps you manage Entry Point commands separately from your bot commands
 */

const { REST, Routes } = require("discord.js");
const config = require("../utils/Config");

async function manageEntryPointCommands() {
  try {
    console.log("🔍 Fetching current commands...");

    const rest = new REST({ version: "10" }).setToken(config.token);
    const applicationCommands = config.production
      ? Routes.applicationCommands(config.clientId)
      : Routes.applicationGuildCommands(config.clientId, config.guildId);

    const commands = await rest.get(applicationCommands);
    console.log(`📋 Found ${commands.length} total commands`);

    // Separate Entry Point commands from bot commands
    const entryPointCommands = commands.filter(
      (cmd) =>
        cmd.integration_types_config ||
        (cmd.contexts && cmd.contexts.length > 0) ||
        cmd.integration_types
    );

    const regularCommands = commands.filter(
      (cmd) =>
        !cmd.integration_types_config &&
        !(cmd.contexts && cmd.contexts.length > 0) &&
        !cmd.integration_types
    );

    console.log(`🎯 Entry Point commands: ${entryPointCommands.length}`);
    console.log(`🤖 Regular bot commands: ${regularCommands.length}`);
    console.log("");

    if (entryPointCommands.length > 0) {
      console.log("📝 Entry Point Commands:");
      entryPointCommands.forEach((cmd, i) => {
        console.log(`  ${i + 1}. ${cmd.name} (ID: ${cmd.id})`);
      });
      console.log("");
    }

    // Interactive menu
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function askQuestion(question) {
      return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
      });
    }

    console.log("🛠️  What would you like to do?");
    console.log("1. Delete ALL Entry Point commands");
    console.log("2. Delete specific Entry Point commands");
    console.log("3. Keep only essential Entry Point commands (limit to 15)");
    console.log("4. Show detailed command information");
    console.log("5. Exit without changes");

    const choice = await askQuestion("\nEnter your choice (1-5): ");

    switch (choice) {
      case "1":
        // Delete all Entry Point commands
        console.log("⚠️  This will delete ALL Entry Point commands!");
        const confirm = await askQuestion('Type "DELETE ALL" to confirm: ');
        if (confirm === "DELETE ALL") {
          for (const cmd of entryPointCommands) {
            try {
              await rest.delete(`${applicationCommands}/${cmd.id}`);
              console.log(`✅ Deleted: ${cmd.name}`);
            } catch (error) {
              console.log(`❌ Failed to delete ${cmd.name}:`, error.message);
            }
          }
          console.log("🎉 All Entry Point commands deleted!");
        } else {
          console.log("❌ Cancelled");
        }
        break;

      case "2":
        // Delete specific commands
        if (entryPointCommands.length === 0) {
          console.log("No Entry Point commands to delete.");
          break;
        }

        const indices = await askQuestion(
          "Enter command numbers to delete (comma-separated, e.g., 1,3,5): "
        );
        const commandsToDelete = indices
          .split(",")
          .map((i) => parseInt(i.trim()) - 1);

        for (const index of commandsToDelete) {
          if (index >= 0 && index < entryPointCommands.length) {
            try {
              const cmd = entryPointCommands[index];
              await rest.delete(`${applicationCommands}/${cmd.id}`);
              console.log(`✅ Deleted: ${cmd.name}`);
            } catch (error) {
              console.log(
                `❌ Failed to delete ${entryPointCommands[index].name}:`,
                error.message
              );
            }
          }
        }
        break;

      case "3":
        // Keep only essential Entry Point commands
        if (entryPointCommands.length <= 15) {
          console.log(
            "✅ Already within limit (15 or fewer Entry Point commands)"
          );
          break;
        }

        console.log(
          "🎯 Keeping first 15 Entry Point commands, deleting the rest..."
        );
        const commandsToKeep = entryPointCommands.slice(0, 15);
        const commandsToRemove = entryPointCommands.slice(15);

        for (const cmd of commandsToRemove) {
          try {
            await rest.delete(`${applicationCommands}/${cmd.id}`);
            console.log(`✅ Deleted: ${cmd.name}`);
          } catch (error) {
            console.log(`❌ Failed to delete ${cmd.name}:`, error.message);
          }
        }
        console.log(
          `🎉 Kept ${commandsToKeep.length} essential Entry Point commands`
        );
        break;

      case "4":
        // Show detailed information
        for (const cmd of entryPointCommands) {
          console.log(`\n📄 ${cmd.name}:`);
          console.log(`   ID: ${cmd.id}`);
          console.log(`   Description: ${cmd.description || "No description"}`);
          console.log(`   Type: ${cmd.type}`);
          if (cmd.contexts)
            console.log(`   Contexts: ${cmd.contexts.join(", ")}`);
          if (cmd.integration_types)
            console.log(
              `   Integration Types: ${cmd.integration_types.join(", ")}`
            );
        }
        break;

      case "5":
        console.log("👋 Exiting without changes");
        break;

      default:
        console.log("❌ Invalid choice");
    }

    rl.close();
  } catch (error) {
    console.error("❌ Error managing Entry Point commands:", error);
  }
}

manageEntryPointCommands();
