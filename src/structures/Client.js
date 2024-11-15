const { ApplicationCommandType, Client, Collection, EmbedBuilder, PermissionsBitField, REST, Routes } = require('discord');
const { connect, connection } = require('mongoose');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const loadPlugins = require('../plugin/index');
const Utils = require('../utils/Utils');
const globalConfig = require('../utils/Config');
const { I18n } = require('@hammerhq/localization');
const config = require('../config');
const emojis = require('../emojis');

const configPeach = require('../theme/Peach/config');
const emojiPeach = require('../theme/Peach/emojis');

const configGoma = require('../theme/Goma/config');
const emojiGoma = require('../theme/Goma/emojis');

const configOcean = require('../theme/OceanBreeze/config');
const emojiOcean = require('../theme/OceanBreeze/emojis');

const configHalloween = require('../theme/Halloween/config');
const emojiHalloween = require('../theme/Halloween/emojis');

const configHalloweenNew = require('../theme/Halloween/configNew');
const emojiHalloweenNew = require('../theme/Halloween/emojisNew');

const configHeaven = require('../theme/CelestialGrace/config');
const emojiHeaven = require('../theme/CelestialGrace/emojis');

const configSakura = require('../theme/SakuraSerenity/config');
const emojiSakura = require('../theme/SakuraSerenity/emojis');

const configBee = require('../theme/BuzzingBliss/config');
const emojiBee = require('../theme/BuzzingBliss/emojis');

const Logger = require('./Logger');

module.exports = class PeachyClient extends Client {
    constructor(options) {
        super(options);
        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldown = new Collection();
        this.config = config;
        this.logger = new Logger();
        this.body = [];
        this.utils = Utils;
        this.color = config.color;
        this.emoji = emojis;
        this.moment = moment;
        this.i18n = new I18n(this.config.language);
    }

    embed() {
        return new EmbedBuilder();
    }

    async start(token) {
        this.loadCommands();
        this.logger.info('Successfully loaded commands!');
        this.loadEvents();
        this.logger.info('Successfully loaded events!');
        this.connectMongodb().catch(error => {
            console.error("Failed to connect to MongoDB:", error.message);
        });
        this.logger.info('Successfully connected to MongoDB.');
        loadPlugins(this);
        await this.login(token);
    }

    async connectMongodb() {
        if ([1, 2, 99].includes(connection.readyState)) return;
        await connect(globalConfig.database);
    }

    loadCommands() {
        const commandsPath = fs.readdirSync(path.join(__dirname, '../commands'));
        commandsPath.forEach(dir => {
            const commandFiles = fs.readdirSync(path.join(__dirname, `../commands/${dir}`)).filter(file => file.endsWith(''));
            commandFiles.forEach(async file => {
                const cmd = require(`../commands/${dir}/${file}`);
                const command = new cmd(this, file);
                command.category = dir;
                command.file = file;
                this.commands.set(command.name, command);
                if (command.aliases.length !== 0) {
                    command.aliases.forEach(alias => {
                        this.aliases.set(alias, command.name);
                    });
                }
                if (command.slashCommand) {
                    const data = {
                        name: command.name,
                        description: command.description.content,
                        type: ApplicationCommandType.ChatInput,
                        options: command.options ? command.options : null,
                        name_localizations: command.nameLocalizations ? command.nameLocalizations : null,
                        description_localizations: command.descriptionLocalizations ? command.descriptionLocalizations : null,
                        default_member_permissions: command.permissions.user.length > 0 ? command.permissions.user : null,
                    };
                    if (command.permissions.user.length > 0) {
                        const permissionValue = PermissionsBitField.resolve(command.permissions.user);
                        if (typeof permissionValue === 'bigint') {
                            data.default_member_permissions = permissionValue.toString();
                        } else {
                            data.default_member_permissions = permissionValue;
                        }
                    }
                    const json = JSON.stringify(data);
                    this.body.push(JSON.parse(json));
                }
            });
        });

        this.once('ready', async () => {
            const applicationCommands =
                globalConfig.production === true
                    ? Routes.applicationCommands(globalConfig.clientId ?? '')
                    : Routes.applicationGuildCommands(globalConfig.clientId ?? '', globalConfig.guildId ?? '');
            try {
                const rest = new REST({ version: '9' }).setToken(globalConfig.token ?? '');
                await rest.put(applicationCommands, { body: this.body });
                this.logger.info(`Successfully loaded slash commands!`);
            } catch (error) {
                this.logger.error(error);
            }
        });
    }

    loadEvents() {
        const eventsPath = fs.readdirSync(path.join(__dirname, '../events'));
        eventsPath.forEach(dir => {
            const events = fs.readdirSync(path.join(__dirname, `../events/${dir}`)).filter(file => file.endsWith(''));
            events.forEach(async file => {
                const event = require(`../events/${dir}/${file}`);
                const evt = new event(this, file);
                switch (dir) {
                    case 'player':
                        this.shoukaku.on(evt.name, (...args) => evt.run(...args));
                        break;
                    default:
                        this.on(evt.name, (...args) => evt.run(...args));
                        break;
                }
            });
        });
    }

    setColorBasedOnTheme(userId) {
        return this.utils.getUser(userId).then(user => {
            // Determine the user's language preference
            let userLanguage;
            if (user && user.preferences) {
                const { language = this.config.language.defaultLocale } = user.preferences;

                userLanguage = {
                    defaultLocale: language.split('-')[0],
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

            const localePath = path.join(userLanguage.directory, `${userLanguage.defaultLocale}.json`);
            if (fs.existsSync(localePath)) {
                const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
                language.locales.set(userLanguage.defaultLocale, localeData);
            } else {
                console.error("Locale file not found:", localePath);
            }

            if (!language.locales.size) {
                console.error("No locales loaded for language:", userLanguage.defaultLocale);
            }

            let color = config.color;
            let emoji = emojis;

            if (user && user.preferences && user.preferences.theme) {
                switch (user.preferences.theme) {
                    case 't01':
                        color = configOcean.color;
                        emoji = emojiOcean;
                        break;
                    case 't02':
                    case 'halloween':
                        color = configHalloween.color;
                        emoji = emojiHalloween;
                        break;
                    case 't03':
                        color = configHalloweenNew.color;
                        emoji = emojiHalloweenNew;
                        break;
                    case 'st01':
                        color = configHeaven.color;
                        emoji = emojiHeaven;
                        break;
                    case 'st02':
                        color = configSakura.color;
                        emoji = emojiSakura;
                        break;
                    case 'st03':
                        color = configBee.color;
                        emoji = emojiBee;
                        break;
                    case 'peach':
                        color = configPeach.color;
                        emoji = emojiPeach;
                        break;
                    case 'goma':
                        color = configGoma.color;
                        emoji = emojiGoma;
                        break;
                    default:
                        break;
                }
            }

            return { user, color, emoji, language };
        }).catch(error => {
            console.error("Error setting color and theme:", error.message);
            return { color: config.color, emoji: emojis, language: this.config.language };
        });
    }
};
