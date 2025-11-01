const { REST, Routes, PermissionsBitField } = require("discord.js");
require("dotenv").config();

const globalConfig = require("./src/utils/Config");
const fs = require("fs");
const path = require("path");

async function registerSlashCommands() {
  console.log("🔧 Starting slash command registration...");

  try {
    let rest = new REST({ version: "10" }).setToken(globalConfig.token);

    // Load all commands
    const commands = [];
    const commandsPath = path.join(__dirname, "src/commands");
    const commandDirs = fs.readdirSync(commandsPath);

    console.log("📂 Loading commands from directories...");

    for (const dir of commandDirs) {
      const commandFiles = fs
        .readdirSync(path.join(commandsPath, dir))
        .filter((file) => file.endsWith(".js"));

      console.log(
        `📁 Processing ${dir} directory (${commandFiles.length} files)`
      );

      for (const file of commandFiles) {
        try {
          const CommandClass = require(`./src/commands/${dir}/${file}`);

          // Create a minimal client mock for the command constructor
          const mockClient = {
            config: globalConfig,
            utils: {
              formatCapitalize: (str) =>
                str.charAt(0).toUpperCase() + str.slice(1),
            },
          };

          const command = new CommandClass(mockClient, file);

          if (command.slashCommand) {
            const defaultPerms =
              command.permissions &&
              command.permissions.user &&
              command.permissions.user.length > 0
                ? PermissionsBitField.resolve(
                    command.permissions.user
                  ).toString()
                : null;

            const data = {
              name: command.name,
              description: command.description.content,
              type: 1, // CHAT_INPUT
              options: command.options || [],
              default_member_permissions: defaultPerms,
            };

            commands.push(data);
            console.log(`✅ Added command: ${command.name}`);
          }
        } catch (error) {
          console.log(`❌ Failed to load ${file}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Total commands to register: ${commands.length}`);

    // Determine the route
    const applicationCommands = globalConfig.production
      ? Routes.applicationCommands(globalConfig.clientId)
      : Routes.applicationGuildCommands(
          globalConfig.clientId,
          globalConfig.guildId
        );

    console.log(
      `🎯 Target: ${globalConfig.production ? "Global" : "Guild"} commands`
    );

    // Get existing commands first
    console.log("🔍 Checking existing commands...");
    const existingCommands = await rest.get(applicationCommands);
    console.log(`📋 Found ${existingCommands.length} existing commands`);

    // Filter out Entry Point commands
    const entryPointCommands = existingCommands.filter(
      (cmd) =>
        cmd.integration_types_config && cmd.integration_types_config !== null
    );

    if (entryPointCommands.length > 0) {
      console.log(
        `🔗 Found ${entryPointCommands.length} Entry Point commands to preserve`
      );

      // Add Entry Point commands to our list
      entryPointCommands.forEach((entryCmd) => {
        const existsInOurCommands = commands.find(
          (cmd) => cmd.name === entryCmd.name
        );
        if (!existsInOurCommands) {
          commands.push({
            name: entryCmd.name,
            description: entryCmd.description,
            type: entryCmd.type,
            options: entryCmd.options || [],
            integration_types_config: entryCmd.integration_types_config,
            contexts: entryCmd.contexts,
            default_member_permissions: entryCmd.default_member_permissions,
            dm_permission: entryCmd.dm_permission,
            nsfw: entryCmd.nsfw,
          });
          console.log(`🔗 Preserved Entry Point command: ${entryCmd.name}`);
        }
      });
    }

    // Register commands
    console.log(`\n🚀 Registering ${commands.length} commands...`);
    await rest.put(applicationCommands, { body: commands });

    console.log("✅ Successfully registered all slash commands!");
    console.log(
      `📈 Registered commands: ${commands.map((cmd) => cmd.name).join(", ")}`
    );
  } catch (error) {
    console.error("❌ Error registering commands:", error);

    if (error.code === 50240) {
      console.log(
        "\n💡 Entry Point command error detected. Trying alternative approach..."
      );

      try {
        // Get existing commands and merge with ours
        // Ensure rest is available here; re-create it if necessary
        if (typeof rest === "undefined" || !rest) {
          rest = new REST({ version: "10" }).setToken(globalConfig.token);
        }
        const existingCommands = await rest.get(applicationCommands);
        const allCommands = [...existingCommands];

        // Update or add our commands
        commands.forEach((newCmd) => {
          const existingIndex = allCommands.findIndex(
            (cmd) => cmd.name === newCmd.name
          );
          if (existingIndex >= 0) {
            allCommands[existingIndex] = newCmd;
          } else {
            allCommands.push(newCmd);
          }
        });

        await rest.put(applicationCommands, { body: allCommands });
        console.log(
          "✅ Successfully registered commands using alternative method!"
        );
      } catch (secondError) {
        console.error("❌ Alternative method also failed:", secondError);
      }
    }
  }
}

// Run the script
registerSlashCommands()
  .then(() => {
    console.log("\n🎉 Command registration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
