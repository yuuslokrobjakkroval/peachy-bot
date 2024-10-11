const { Command } = require("../../structures/index.js");
const Users = require('../../schemas/user.js');

const languageNames = {
    cn: 'Chinese (CN)',
    en: 'English',
    fr: 'French',
    jp: 'Japanese',
    kh: 'Khmer',
    kr: 'Korean',
    lo: 'Lao',
    th: 'Thai',
    tw: 'Chinese (TW)',
    vn: 'Vietnamese',
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
                    'language jp - Sets your language to Japanese.',
                    'language kr - Sets your language to Korean.',
                    'language th - Sets your language to Thai.',
                    'language fr - Sets your language to French.',
                    'language vn - Sets your language to Vietnamese.',
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
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed().setTitle(`${emoji.mainLeft} 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ${emoji.mainRight}`);

        const convertSubCommand = subCommand?.toLowerCase();

        switch (convertSubCommand) {
            case 'en':
            case 'kh':
            case 'cn':
            case 'tw':
            case 'jp':
            case 'kr':
            case 'fr':
            case 'th':
            case 'vn':
            case 'lo': {
                const selectedLang = languageNames[convertSubCommand];
                embed
                    .setColor(color.main)
                    .setTitle(`${emoji.mainLeft} 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄 ${emoji.mainRight}`)
                    .setDescription(`Your language has been set to **${client.utils.formatCapitalize(selectedLang)}**.`)
                    .setThumbnail(client.utils.emojiToImage(client.emoji.countryFlag[convertSubCommand]))
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'preferences.language': convertSubCommand } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed
                    .setTitle(`${emoji.mainLeft} 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄 𝐇𝐄𝐋𝐏 ${emoji.mainRight}`)
                    .setDescription('Manage your language settings.')
                    .addFields([
                        { name: 'Examples', value: '• language\n• language en\n• language kh\n• language cn\n• language tw\n• language jp\n• language kr\n• language fr\n• language vn\n• language lo' },
                        { name: 'Usage', value: '• language - Shows your current language\n• language en - Sets your language to English\n• language kh - Sets your language to Khmer\n• language cn - Sets your language to Chinese (CN)\n• language tw - Sets your language to Chinese (TW)\n• language jp - Sets your language to Japanese\n• language kr - Sets your language to Korean\n• language fr - Sets your language to French\n• language vn - Sets your language to Vietnamese\n• language lo - Sets your language to Lao' }
                    ])
                    .setColor(color.main)
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
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
                    .setTitle(`${emoji.mainLeft} 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄 ${emoji.mainRight}`)
                    .setDescription(`Your current language is **${client.utils.formatCapitalize(formatLanguage)}**.`)
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }
        }
    }
};
