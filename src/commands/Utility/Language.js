const { Command } = require("../../structures/index.js");
const Users = require('../../schemas/user.js');
const languages = ['en', 'kh']; // Add more languages as needed

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

    async run(client, ctx, args, color, emoji) {
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed().setTitle(`${emoji.mainLeft} 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ${emoji.mainRight}`);

        const convertSubCommand = subCommand?.toLowerCase();

        switch (convertSubCommand) {
            case 'en':
            case 'kh': {
                const selectedLang = convertSubCommand === 'kh' ? 'Khmer' : 'English';
                embed
                    .setColor(color.main)
                    .setDescription(`Your language has been set to **${client.utils.formatCapitalize(selectedLang)}**.`)
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'preferences.language': selectedLang } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed
                    .setTitle(`${emoji.mainLeft} 𝐋𝐀𝐍𝐆𝐔𝐀𝐆𝐄 𝐇𝐄𝐋𝐏 ${emoji.mainRight}`)
                    .setDescription('Manage your language settings.')
                    .addFields([
                        { name: 'Examples', value: '• language\n• language en\n• language kh' },
                        { name: 'Usage', value: '• language - Shows your current language\n• language en - Sets your language to English\n• language kh - Sets your language to Khmer' }
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

                embed
                    .setColor(color.main)
                    .setDescription(`Your current language is **${client.utils.formatCapitalize(currentLanguage)}**.`)
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
