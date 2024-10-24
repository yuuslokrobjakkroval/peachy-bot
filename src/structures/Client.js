const { ApplicationCommandType, Client, Collection, EmbedBuilder, PermissionsBitField, REST, Routes } = require('discord.js');
const { connect, connection } = require('mongoose');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const loadPlugins = require('../plugin/index.js');
const Utils = require('../utils/Utils.js');
const { I18n } = require('@hammerhq/localization');
const Users = require('../schemas/user.js');
const config = require('../config.js');
const emojis = require('../emojis.js');

const configPeach = require('../theme/Peach/config.js');
const emojiPeach = require('../theme/Peach/emojis.js');

const configGoma = require('../theme/Goma/config.js');
const emojiGoma = require('../theme/Goma/emojis.js');

const configPjum = require('../theme/Pjumben/config.js');
const emojiPjum = require('../theme/Pjumben/emojis.js');

const configOcean = require('../theme/OceanBreeze/config.js');
const emojiOcean = require('../theme/OceanBreeze/emojis.js');

const configHeaven = require('../theme/CelestialGrace/config.js');
const emojiHeaven = require('../theme/CelestialGrace/emojis.js');

const configSakura = require('../theme/SakuraSerenity/config.js');
const emojiSakura = require('../theme/SakuraSerenity/emojis.js');

const configHalloween = require('../theme/Halloween/config.js');
const emojiHalloween = require('../theme/Halloween/emojis.js');

const Logger = require('./Logger.js');

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
        this.connectMongodb();
        this.logger.info('Successfully connected to MongoDB.');
        loadPlugins(this);
        await this.login(token);
    }

    async connectMongodb() {
        if ([1, 2, 99].includes(connection.readyState)) return;
        await connect(this.config.database);
    }

    async loadCommands() {
        const commandsPath = fs.readdirSync(path.join(__dirname, '../commands'));
        commandsPath.forEach(dir => {
            const commandFiles = fs.readdirSync(path.join(__dirname, `../commands/${dir}`)).filter(file => file.endsWith('.js'));
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
                this.config.production === true
                    ? Routes.applicationCommands(this.config.clientId ?? '')
                    : Routes.applicationGuildCommands(this.config.clientId ?? '', this.config.guildId ?? '');
            try {
                const rest = new REST({ version: '9' }).setToken(this.config.token ?? '');
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
            const events = fs.readdirSync(path.join(__dirname, `../events/${dir}`)).filter(file => file.endsWith('.js'));
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

    async setColorBasedOnTheme(userId) {
        try {
            const user = await Users.findOne({ userId });
            let userLanguage;

            // Determine the user's language preference
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
                        color = configPjum.color;
                        emoji = emojiPjum;
                        break;
                    case 'st01':
                        color = configHeaven.color;
                        emoji = emojiHeaven;
                        break;
                    case 'st02':
                        color = configSakura.color;
                        emoji = emojiSakura;
                        break;
                    case 't03':
                    case 'halloween':
                        color = configHalloween.color;
                        emoji = emojiHalloween;
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
            return { color, emoji, language };
        } catch (error) {
            console.error("Error setting color and theme:", error.message);
            return { color: config.color, emoji: emojis, language: this.config.language };
        }
    }
};
