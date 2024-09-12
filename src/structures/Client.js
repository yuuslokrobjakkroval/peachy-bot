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

const configPeach = require('../theme/peach/config.js');
const emojiPeach = require('../theme/peach/emojis.js');

const configGoma = require('../theme/goma/config.js');
const emojiGoma = require('../theme/goma/emojis.js');

const configPjum = require('../theme/pjumben/config.js');
const emojiPjum = require('../theme/pjumben/emojis.js');

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
        this.db = Users;
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
        const user = await Users.findOne({ userId });
        if (user && user.preferences && user.preferences.theme) {
            if (user.preferences.theme === 'pjumben') {
                this.color = configPjum.color;
                this.emoji = emojiPjum;
            } else if (user.preferences.theme === 'peach') {
                this.color = configPeach.color;
                this.emoji = emojiPeach;
            } else if (user.preferences.theme === 'goma') {
                this.color = configGoma.color;
                this.emoji = emojiGoma;
            } else {
                this.color = config.color;
                this.emoji = emojis;
            }
        } else {
            this.color = config.color;
            this.emoji = emojis;
        }
    }
};
