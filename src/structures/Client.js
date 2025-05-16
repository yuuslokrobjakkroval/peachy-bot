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
  st99: require("../theme/QuirkyQuackers/emojis"),
  st2707: require("../theme/KeoYuu/emojis"),
  st168: require("../theme/GhastlyGrins/emojis"),
  st272: require("../theme/LoveBunnie/emojis"),
  st1111: require("../theme/EnchantedCatLake/emojis"),
  st2601: require("../theme/Yuyuzu/emojis"),
};

const Logger = require("./Logger");

module.exports = class PeachyClient extends Client {
  constructor(options) {
    super(options);
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldown = new Collection();
    this.config = globalConfig;
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
            this.body.push(data);
            commandCounter++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to load command ${file} in category ${dir}:`,
            error
          );
        }
      }
    }

    this.logger.info(`Loaded a total of ${commandCounter} commands.`);

    this.once("ready", async () => {
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
        await rest.put(applicationCommands, { body: this.body });
        this.logger.info(`Successfully loaded slash commands!`);
      } catch (error) {
        this.logger.error(error);
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
