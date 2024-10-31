const { Command } = require("../../structures/index.js");
const Users = require('../../schemas/user.js');
const emojiGlobal = require('../../utils/Emoji.js');

const languageNames = {
    en: 'English',
    kh: 'Khmer',
};

module.exports = class Language extends Command {
    constructor(client) {
        super(client, {
            name: 'language',
            description: {
                content: 'Manage your language settings or view your current language.',
                examples: [
                    'language show - Shows your current language.',
                    'language en - Sets your language to English.',
                    'language kh - Sets your language to Khmer.',
                    'language help - Shows command usage examples.'
                ],
                usage: 'language show\nlanguage en\nlanguage kh\nlanguage help',
            },
            category: 'utility',
            aliases: ['lang'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'show',
                    description: 'View your current language setting.',
                    type: 1, // Sub-command type
                },
                {
                    name: 'help',
                    description: 'Shows command usage examples and information.',
                    type: 1, // Sub-command type
                }
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const languageMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.languageMessages;

        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed().setTitle(`${emoji.mainLeft} ${languageMessages?.title} ${emoji.mainRight}`);

        const convertSubCommand = subCommand?.toLowerCase();

        switch (convertSubCommand) {
            case 'en':
            case 'kh': {
                const selectedLang = languageNames[convertSubCommand];
                embed
                    .setColor(color.main)
                    .setTitle(`${emoji.mainLeft} ${languageMessages?.languageSetTitle} ${emoji.mainRight}`)
                    .setThumbnail(client.utils.emojiToImage(emojiGlobal.countryFlag[convertSubCommand]))
                    .setDescription(languageMessages?.languageSetDescription.replace('%{language}', client.utils.formatCapitalize(selectedLang)) || `Your language has been set to **${client.utils.formatCapitalize(selectedLang)}**.`)
                    .setFooter({
                        text: languageMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'preferences.language': convertSubCommand } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed
                    .setTitle(`${emoji.mainLeft} ${languageMessages?.helpTitle} ${emoji.mainRight}`)
                    .setDescription(languageMessages?.helpDescription || 'Manage your language settings.')
                    .addFields([
                        { name: languageMessages?.examples || 'Examples', value: languageMessages?.exampleCommands || '• language\n• language en\n• language kh' },
                        { name: languageMessages?.usage || 'Usage', value: languageMessages?.usageCommands || '• language - Shows your current language\n• language en - Sets your language to English\n• language kh - Sets your language to Khmer' }
                    ])
                    .setColor(color.main)
                    .setFooter({
                        text: languageMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                return ctx.sendMessage({ embeds: [embed] });
            }

            default: {
                const user = await Users.findOne({ userId: ctx.author.id });
                const currentLanguage = user?.preferences?.language || 'Not set';
                const formatLanguage = languageNames[currentLanguage] || 'Unknown Language';
                embed
                    .setColor(color.main)
                    .setTitle(`${emoji.mainLeft} ${languageMessages?.currentLanguageTitle} ${emoji.mainRight}`)
                    .setThumbnail(client.utils.emojiToImage(emojiGlobal.countryFlag[currentLanguage]))
                    .setDescription(languageMessages?.currentLanguageDescription.replace('%{language}', client.utils.formatCapitalize(formatLanguage)) || `Your current language is **${client.utils.formatCapitalize(formatLanguage)}**.`)
                    .setFooter({
                        text: languageMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                await ctx.sendMessage({ embeds: [embed] });
            }
        }
    }
};
