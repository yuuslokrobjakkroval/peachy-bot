const {
  ApplicationCommandType,
  Client,
  Collection,
  EmbedBuilder,
  PermissionsBitField,
  REST,
  Routes,
} = require("discord.js");
const { connect, connection } = require("mongoose");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const loadPlugins = require("../plugin/index");
const Utils = require("../utils/Utils");
const Abilities = require("../utils/Abilities");
const globalConfig = require("../utils/Config");
const { I18n } = require("@hammerhq/localization");
const themeConfig = require("../config");
const slashCommandConfig = require("../config/slashCommandConfig");

// Emojis - Centralized in one object for easier management
const emojis = require("../emojis");
const themeEmojis = {
  // Mapping theme ID to emojis - more maintainable
  peach: require("../theme/Peach/emojis"),
  goma: require("../theme/Goma/emojis"),
  t01: require("../theme/OceanBreeze/emojis"),
  t02: require("../theme/FrightFest/emojis"),
  halloween: require("../theme/FrightFest/emojis"),
  t03: require("../theme/BooBash/emojis"),
  t04: require("../theme/Christmas/emojis"),
  t05: require("../theme/FestiveFrost/emojis"),
  t06: require("../theme/KingFrost/emojis"),
  t07: require("../theme/QueenFrost/emojis"),
  t08: require("../theme/Gangyu/emojis"),
  st01: require("../theme/CelestialGrace/emojis"),
  st02: require("../theme/SakuraSerenity/emojis"),
  st03: require("../theme/BuzzingBliss/emojis"),
  st04: require("../theme/Froggy/emojis"),
  st05: require("../theme/ASleepyPeach/emojis"),
  st06: require("../theme/MagicalForest/emojis"),
  st07: require("../theme/Matchalatte/emojis"),
  st09: require("../theme/SpringBear/emojis"),
  st0705: require("../theme/PandaChef/emojis"),
  st20: require("../theme/TangerineDepth/emojis"),
  st21: require("../theme/DiaryCat/emojis"),
  st99: require("../theme/QuirkyQuackers/emojis"),
  st2707: require("../theme/KeoYuu/emojis"),
  st168: require("../theme/GhastlyGrins/emojis"),
  st272: require("../theme/LoveBunnie/emojis"),
  st1111: require("../theme/EnchantedCatLake/emojis"),
  st2601: require("../theme/Yuyuzu/emojis"),
  st2002: require("../theme/Yara/emojis"),
  st2025: require("../theme/CatAna/emojis"),
  //
  ct002: require("../theme/PaoInh/emojis"),
};

const Logger = require("./Logger");

module.exports = class PeachyClient extends Client {
  constructor(options) {
    super(options);
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldown = new Collection();
    this.config = globalConfig;
    this.prefix = globalConfig.prefix.toLowerCase();
    this.logger = new Logger();
    this.body = [];
    this.utils = Utils;
    this.abilities = Abilities;
    this.defaultColor = themeConfig.normal.color;
    this.color = globalConfig.color;
    this.emoji = emojis;
    this.moment = moment;
    this.i18n = new I18n(globalConfig.language);
  }

  embed() {
    return new EmbedBuilder();
  }

  async start(token) {
    await this.loadCommands();
    this.logger.info("Successfully loaded commands!");
    await this.loadEvents();
    this.logger.info("Successfully loaded events!");
    await this.connectMongodb().catch((error) => {
      console.error("Failed to connect to MongoDB:", error.message);
    });
    this.logger.info("Successfully connected to MongoDB.");
    loadPlugins(this);
    await this.login(token);
  }

  async connectMongodb() {
    if ([1, 2, 99].includes(connection.readyState)) return;
    await connect(globalConfig.database);
  }

  async loadCommands() {
    let commandCounter = 0;
    const commandsPath = path.join(__dirname, "../commands");
    const commandDirs = fs.readdirSync(commandsPath);

    // Load configuration for slash command prioritization
    const {
      maxSlashCommands,
      essentialCommands,
      priorityCategories,
      mediumPriorityCategories,
      lowPriorityCategories,
      excludedCommands,
      customPriorities,
    } = slashCommandConfig;

    // Store commands for priority sorting
    const commandsToRegister = [];

    for (const dir of commandDirs) {
      const commandFiles = fs
        .readdirSync(path.join(commandsPath, dir))
        .filter((file) => file.endsWith(".js")); // Ensure only .js files
      for (const file of commandFiles) {
        try {
          const cmd = require(`../commands/${dir}/${file}`);
          const command = new cmd(this, file); // Pass 'file' name
          command.category = dir;
          command.file = file;
          this.commands.set(command.name, command);

          if (command.aliases && command.aliases.length > 0) {
            // Check if aliases exist
            command.aliases.forEach((alias) =>
              this.aliases.set(alias, command.name)
            );
          }

          if (command.slashCommand) {
            // Skip excluded commands
            if (excludedCommands.includes(command.name.toLowerCase())) {
              continue; // Skip this command entirely
            }

            const data = {
              name: command.name,
              description: command.description.content,
              type: ApplicationCommandType.ChatInput,
              options: command.options || null,
              name_localizations: command.nameLocalizations || null,
              description_localizations:
                command.descriptionLocalizations || null,
              default_member_permissions:
                command.permissions.user.length > 0
                  ? PermissionsBitField.resolve(
                      command.permissions.user
                    ).toString()
                  : null,
            };

            // Calculate priority score
            let priority = 0;

            // Custom priorities override everything
            if (customPriorities[command.name.toLowerCase()]) {
              priority = customPriorities[command.name.toLowerCase()];
            } else {
              // Essential commands get highest priority
              if (essentialCommands.includes(command.name.toLowerCase())) {
                priority += 1000;
              }

              // Category-based priorities
              if (priorityCategories.includes(dir)) {
                priority += 500;
              } else if (
                mediumPriorityCategories &&
                mediumPriorityCategories.includes(dir)
              ) {
                priority += 250;
              } else if (
                lowPriorityCategories &&
                lowPriorityCategories.includes(dir.toLowerCase())
              ) {
                priority += 50; // Very low priority
              } else {
                priority += 100; // Default priority
              }
            }

            commandsToRegister.push({
              data,
              priority,
              category: dir,
              name: command.name,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to load command ${file} in category ${dir}:`,
            error
          );
        }
      }
    }

    // Sort by priority (highest first) and limit to maxSlashCommands
    commandsToRegister.sort((a, b) => b.priority - a.priority);
    const selectedCommands = commandsToRegister.slice(0, maxSlashCommands);

    // Add selected commands to body
    selectedCommands.forEach((cmd) => {
      this.body.push(cmd.data);
      commandCounter++;
    });

    this.logger.info(`Loaded ${this.commands.size} total commands.`);
    this.logger.info(
      `Selected ${commandCounter} commands for slash command registration (limit: ${maxSlashCommands}).`
    );

    // Log which commands were excluded if any
    if (commandsToRegister.length > maxSlashCommands) {
      const excluded = commandsToRegister.slice(maxSlashCommands);
      this.logger.warn(
        `${excluded.length} commands excluded from slash registration due to Discord's 100 command limit.`
      );
      this.logger.info(
        `Excluded commands: ${excluded.map((c) => c.name).join(", ")}`
      );
    }

    this.once("clientReady", async () => {
      const applicationCommands = globalConfig.production
        ? Routes.applicationCommands(this.config.clientId ?? "")
        : Routes.applicationGuildCommands(
            this.config.clientId ?? "",
            this.config.guildId ?? ""
          );
      try {
        const rest = new REST({ version: "10" }).setToken(
          this.config.token ?? ""
        );

        // Try to get existing commands and handle Entry Point commands properly
        let existingCommands = [];
        try {
          existingCommands = await rest.get(applicationCommands);
        } catch (error) {
          this.logger.warn("Could not fetch existing commands:", error.message);
        }

        // Find Entry Point commands that need to be preserved
        const entryPointCommands = existingCommands.filter((cmd) => {
          // Check for Entry Point command indicators
          return (
            cmd.integration_types_config ||
            (cmd.contexts && cmd.contexts.length > 0) ||
            cmd.integration_types
          );
        });

        // Start with Entry Point commands to ensure they're preserved
        let commandsToRegister = [];

        // First, add all Entry Point commands (they must be preserved)
        entryPointCommands.forEach((entryCmd) => {
          commandsToRegister.push({
            ...entryCmd,
            // Ensure required fields are present and clean up the object
            id: undefined, // Remove id to avoid conflicts
            version: undefined, // Remove version
            application_id: undefined, // Remove application_id
            guild_id: undefined, // Remove guild_id
            name: entryCmd.name,
            description: entryCmd.description || "Entry Point Command",
            type: entryCmd.type || 1,
          });
        });

        // Calculate how many bot commands we can add
        const remainingSlots = 100 - commandsToRegister.length;
        const botCommandsToAdd = Math.min(this.body.length, remainingSlots);

        // Add our bot commands (up to the remaining limit)
        const selectedBotCommands = this.body.slice(0, botCommandsToAdd);
        commandsToRegister = [...commandsToRegister, ...selectedBotCommands];

        this.logger.info(
          `Registering ${commandsToRegister.length} commands (${botCommandsToAdd} bot commands + ${entryPointCommands.length} entry point commands)`
        );

        if (this.body.length > botCommandsToAdd) {
          const excludedCount = this.body.length - botCommandsToAdd;
          this.logger.warn(
            `${excludedCount} bot commands excluded due to Entry Point commands taking ${entryPointCommands.length} slots.`
          );
        }

        await rest.put(applicationCommands, { body: commandsToRegister });
        this.logger.info(`Successfully loaded slash commands!`);
      } catch (error) {
        this.logger.error("Failed to register slash commands:", error);
        // Fallback: Clear and re-register commands to handle Entry Point conflicts
        try {
          this.logger.info(
            "Attempting fallback: clearing and re-registering commands..."
          );
          const rest = new REST({ version: "10" }).setToken(
            this.config.token ?? ""
          );

          // First, try to clear all commands
          this.logger.info("Clearing existing commands...");
          await rest.put(applicationCommands, { body: [] });

          // Wait a moment for the clear to process
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Then register just our bot commands
          this.logger.info(
            `Re-registering ${this.body.length} bot commands...`
          );
          await rest.put(applicationCommands, { body: this.body });

          this.logger.info("Fallback registration completed successfully");
        } catch (fallbackError) {
          this.logger.error(
            "Fallback registration also failed:",
            fallbackError
          );

          // Final fallback: register commands one by one
          try {
            this.logger.info("Attempting individual command registration...");
            const rest = new REST({ version: "10" }).setToken(
              this.config.token ?? ""
            );

            let successCount = 0;
            for (const command of this.body) {
              try {
                await rest.post(applicationCommands, { body: command });
                successCount++;
              } catch (individualError) {
                this.logger.warn(
                  `Failed to register command ${command.name}:`,
                  individualError.message
                );
              }
            }
            this.logger.info(
              `Individual registration completed: ${successCount}/${this.body.length} commands registered`
            );
          } catch (finalError) {
            this.logger.error("All registration methods failed:", finalError);
          }
        }
      }
    });
  }

  async loadEvents() {
    const eventsPath = path.join(__dirname, "../events");
    const eventDirs = fs.readdirSync(eventsPath);

    for (const dir of eventDirs) {
      const eventFiles = fs
        .readdirSync(path.join(eventsPath, dir))
        .filter((file) => file.endsWith(".js"));
      for (const file of eventFiles) {
        try {
          const event = require(`../events/${dir}/${file}`);
          const evt = new event(this, file);
          this.on(evt.name, (...args) => evt.run(...args)); //Simplify this
        } catch (error) {
          this.logger.error(
            `Failed to load event ${file} in category ${dir}:`,
            error
          );
        }
      }
      this.logger.info(`Loaded events from ${dir}`);
    }
  }

  async setColorBasedOnTheme(userId) {
    try {
      const user = await this.utils.getUser(userId);
      let userLanguage;

      if (user && user.preferences) {
        const { language = this.config.language.defaultLocale } =
          user.preferences;
        userLanguage = {
          defaultLocale: language.split("-")[0],
          directory: path.resolve(`./src/languages`),
        };
      } else {
        userLanguage = {
          defaultLocale: this.config.language.defaultLocale,
          directory: path.resolve(`./src/languages`),
        };
      }

      const language = new I18n({
        defaultLocale: userLanguage.defaultLocale,
        directory: userLanguage.directory,
      });

      const localePath = path.join(
        userLanguage.directory,
        `${userLanguage.defaultLocale}.json`
      );
      if (fs.existsSync(localePath)) {
        const localeData = JSON.parse(fs.readFileSync(localePath, "utf8"));
        language.locales.set(userLanguage.defaultLocale, localeData);
      } else {
        console.error("Locale file not found:", localePath);
      }

      if (!language.locales.size) {
        console.error(
          "No locales loaded for language:",
          userLanguage.defaultLocale
        );
      }

      let color = this.defaultColor;
      let emoji = this.emoji;

      if (user && user.preferences && user.preferences.theme) {
        const themeId = user.preferences.theme;

        const themeEmoji = themeEmojis[themeId]; // Look up emoji
        if (themeEmoji) {
          emoji = themeEmoji;
        }

        if (themeConfig[themeId] && themeConfig[themeId].color) {
          color = themeConfig[themeId].color; // Look up color
        } else if (
          themeConfig[themeId.toLowerCase()] &&
          themeConfig[themeId.toLowerCase()].color
        ) {
          color = themeConfig[themeId.toLowerCase()].color; // Look up color with lower case
        }
      }

      return { user, color, emoji, language };
    } catch (error) {
      console.error("Error setting color and theme:", error.message);
      return {
        color: this.defaultColor,
        emoji: this.emoji,
        language: this.i18n,
      };
    }
  }
};
