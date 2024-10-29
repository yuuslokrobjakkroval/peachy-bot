const { Command } = require("../../structures/index.js");
const Users = require('../../schemas/user.js');
const emojiGlobal = require('../../utils/Emoji.js');

const languageNames = {
    cn: 'Chinese (CN)',
    en: 'English',
    fr: 'French',
    ja: 'Japanese',
    kh: 'Khmer',
    ko: 'Korean',
    lo: 'Lao',
    th: 'Thai',
    tw: 'Chinese (TW)',
    vi: 'Vietnamese',
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
                    'language cn - Sets your language to Chinese (CN).',
                    'language tw - Sets your language to Chinese (TW).',
                    'language ja - Sets your language to Japanese.',
                    'language ko - Sets your language to Korean.',
                    'language th - Sets your language to Thai.',
                    'language fr - Sets your language to French.',
                    'language vi - Sets your language to Vietnamese.',
                    'language lo - Sets your language to Lao.',
                    'language help - Shows command usage examples.'
                ],
                usage: 'language show\nlanguage en\nlanguage kh\nlanguage cn\nlanguage tw\nlanguage jp\nlanguage kr\nlanguage th\nlanguage fr\nlanguage vn\nlanguage lo\nlanguage help',
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
        const languageMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.languageMessages; // Access languageMessages

        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed().setTitle(`${emoji.mainLeft} ${languageMessages?.title} ${emoji.mainRight}`);

        const convertSubCommand = subCommand?.toLowerCase();

        switch (convertSubCommand) {
            case 'en':
            case 'kh':
            case 'cn':
            case 'tw':
            case 'ja':
            case 'ko':
            case 'fr':
            case 'th':
            case 'vi':
            case 'lo': {
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
                        { name: languageMessages?.examples || 'Examples', value: languageMessages?.exampleCommands || '• language\n• language en\n• language kh\n• language cn\n• language tw\n• language ja\n• language ko\n• language fr\n• language vi\n• language lo' },
                        { name: languageMessages?.usage || 'Usage', value: languageMessages?.usageCommands || '• language - Shows your current language\n• language en - Sets your language to English\n• language kh - Sets your language to Khmer\n• language cn - Sets your language to Chinese (CN)\n• language tw - Sets your language to Chinese (TW)\n• language ja - Sets your language to Japanese\n• language ko - Sets your language to Korean\n• language fr - Sets your language to French\n• language vi - Sets your language to Vietnamese\n• language lo - Sets your language to Lao' }
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
                const formatLanguage = languageNames[currentLanguage.split('-')[0]] || 'Unknown Language';
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
                break;
            }
        }
    }
};
