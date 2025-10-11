/**
 * Utility script to analyze and manage slash command registration
 * Run this to see which commands would be registered with current priority settings
 */

const fs = require("fs");
const path = require("path");
const slashCommandConfig = require("./slashCommandConfig");

async function analyzeCommands() {
  const commandsPath = path.join(__dirname, "../commands");
  const commandDirs = fs.readdirSync(commandsPath);

  const {
    maxSlashCommands,
    essentialCommands,
    priorityCategories,
    mediumPriorityCategories,
    lowPriorityCategories,
    excludedCommands,
    customPriorities,
  } = slashCommandConfig;

  const commandsToRegister = [];
  let totalCommands = 0;

  console.log("🔍 Analyzing commands for slash command registration...\n");

  for (const dir of commandDirs) {
    const commandFiles = fs
      .readdirSync(path.join(commandsPath, dir))
      .filter((file) => file.endsWith(".js"));

    console.log(`📁 ${dir} (${commandFiles.length} files)`);

    for (const file of commandFiles) {
      try {
        const cmd = require(`../commands/${dir}/${file}`);
        const CommandClass = cmd;
        // Create a mock client object for command initialization
        const mockClient = { config: {}, logger: { error: () => {} } };
        const command = new CommandClass(mockClient, file);

        totalCommands++;

        if (command.slashCommand) {
          // Skip excluded commands
          if (excludedCommands.includes(command.name.toLowerCase())) {
            console.log(`  ❌ ${command.name} (EXCLUDED)`);
            continue;
          }

          // Calculate priority score
          let priority = 0;
          let prioritySource = "";

          // Custom priorities override everything
          if (customPriorities[command.name.toLowerCase()]) {
            priority = customPriorities[command.name.toLowerCase()];
            prioritySource = "Custom";
          } else {
            // Essential commands get highest priority
            if (essentialCommands.includes(command.name.toLowerCase())) {
              priority += 1000;
              prioritySource = "Essential";
            }

            // Category-based priorities
            if (priorityCategories.includes(dir)) {
              priority += 500;
              prioritySource += prioritySource
                ? " + High Category"
                : "High Category";
            } else if (
              mediumPriorityCategories &&
              mediumPriorityCategories.includes(dir)
            ) {
              priority += 250;
              prioritySource += prioritySource
                ? " + Medium Category"
                : "Medium Category";
            } else if (
              lowPriorityCategories &&
              lowPriorityCategories.includes(dir.toLowerCase())
            ) {
              priority += 50;
              prioritySource += prioritySource
                ? " + Low Category"
                : "Low Category";
            } else {
              priority += 100;
              prioritySource += prioritySource
                ? " + Default Category"
                : "Default Category";
            }
          }

          commandsToRegister.push({
            name: command.name,
            category: dir,
            priority,
            prioritySource,
          });
        } else {
          console.log(`  ⚪ ${command.name} (no slash command)`);
        }
      } catch (error) {
        console.log(`  ❌ ${file} (failed to load)`);
      }
    }
    console.log("");
  }

  // Sort by priority (highest first)
  commandsToRegister.sort((a, b) => b.priority - a.priority);

  console.log(`📊 SUMMARY:`);
  console.log(`Total commands found: ${totalCommands}`);
  console.log(
    `Commands with slash command enabled: ${commandsToRegister.length}`
  );
  console.log(`Maximum slash commands allowed: ${maxSlashCommands}`);
  console.log("");

  console.log("🎯 TOP PRIORITY COMMANDS (will be registered):");
  const selectedCommands = commandsToRegister.slice(0, maxSlashCommands);
  selectedCommands.forEach((cmd, index) => {
    console.log(
      `  ${index + 1}. ${cmd.name} (${cmd.category}) - Priority: ${cmd.priority} (${cmd.prioritySource})`
    );
  });

  if (commandsToRegister.length > maxSlashCommands) {
    console.log("\n❌ EXCLUDED COMMANDS (over limit):");
    const excludedFromLimit = commandsToRegister.slice(maxSlashCommands);
    excludedFromLimit.forEach((cmd, index) => {
      console.log(
        `  ${index + 1}. ${cmd.name} (${cmd.category}) - Priority: ${cmd.priority} (${cmd.prioritySource})`
      );
    });

    console.log(
      `\n⚠️  ${excludedFromLimit.length} commands will be excluded due to Discord's 100 command limit.`
    );
  } else {
    console.log(`\n✅ All commands will fit within the limit!`);
  }

  // Show category breakdown
  console.log("\n📋 CATEGORY BREAKDOWN:");
  const categoryBreakdown = {};
  selectedCommands.forEach((cmd) => {
    if (!categoryBreakdown[cmd.category]) {
      categoryBreakdown[cmd.category] = { selected: 0, total: 0 };
    }
    categoryBreakdown[cmd.category].selected++;
  });

  commandsToRegister.forEach((cmd) => {
    if (!categoryBreakdown[cmd.category]) {
      categoryBreakdown[cmd.category] = { selected: 0, total: 0 };
    }
    categoryBreakdown[cmd.category].total++;
  });

  Object.keys(categoryBreakdown)
    .sort()
    .forEach((category) => {
      const { selected, total } = categoryBreakdown[category];
      const percentage = ((selected / total) * 100).toFixed(1);
      console.log(`  ${category}: ${selected}/${total} (${percentage}%)`);
    });
}

if (require.main === module) {
  analyzeCommands().catch(console.error);
}

module.exports = { analyzeCommands };
