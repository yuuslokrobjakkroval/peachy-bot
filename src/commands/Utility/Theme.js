const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');
const gif = require("../../utils/Gif");

module.exports = class Theme extends Command {
    constructor(client) {
        super(client, {
            name: 'theme',
            description: {
                content: 'Toggle between peach, goma, and normal themes or view your current theme setting.',
                examples: [
                    'theme show - Shows your current theme.',
                    'theme normal - Sets your theme to love.',
                    'theme peach - Sets your theme to peach.',
                    'theme goma - Sets your theme to goma.',
                    'theme halloween - Sets your theme to halloween.',
                    'theme help - Shows command usage examples.'
                ],
                usage: 'theme show\n theme peach\n theme goma\n theme love\n theme help',
            },
            category: 'utility',
            aliases: ['t'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'show',
                    description: 'View your current theme setting.',
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
        const embed = client.embed().setTitle(`${emoji.mainLeft} 𝐓𝐇𝐄𝐌𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ${emoji.mainRight}`);

        const convertSubCommand = subCommand?.toLowerCase();
        switch (convertSubCommand) {
            case 'normal':
            case 'peach':
            case 'goma': {
                const theme = convertSubCommand;
                const images = theme === 'peach' ? gif.welcomeToPeach : theme === 'goma' ? gif.welcomeToGoma : gif.welcomeToPeachAndGoma;
                embed
                    .setColor(color.main)
                    .setDescription(`Your theme has been set to **${client.utils.formatCapitalize(theme)}**.`)
                    .setImage(images)
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    })
                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'preferences.theme': theme } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                const embed = client.embed()
                    .setTitle(`${emoji.mainLeft} 𝐓𝐇𝐄𝐌𝐄 𝐇𝐄𝐋𝐏 ${emoji.mainRight}`)
                    .setDescription('Manage your theme settings.')
                    .addFields([
                        { name: 'Examples', value: '• theme\n• theme normal\n• theme peach\n• theme goma' },
                        { name: 'Usage', value: '• theme - Shows your current theme\n• theme normal - Sets your theme to normal\n• theme peach - Sets your theme to peach\n• theme goma - Sets your theme to goma' }
                    ])
                    .setColor(color.main)
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    })
                return ctx.sendMessage({ embeds: [embed] });
            }

            default: {
                const user = await Users.findOne({ userId: ctx.author.id });
                const currentTheme = user?.preferences?.theme || 'Not set';
                let imageTheme;

                switch (currentTheme) {
                    case 'peach':
                        imageTheme = gif.welcomeToPeach;
                        break;
                    case 'goma':
                        imageTheme = gif.welcomeToGoma;
                        break;
                    case 't01':
                        imageTheme = gif.welcomeToOceanBreeze;
                        break;
                    case 't02':
                        imageTheme = gif.welcomeToPjumBen;
                        break;
                    case 'halloween':
                    case 't03':
                        imageTheme = client.utils.getRandomElement([gif.welcomeToPeachHalloween, gif.welcomeToGomaHalloween]);
                        break;
                    case 'st01':
                        imageTheme = gif.welcomeToCelestialGrace;
                        break;
                    default:
                        imageTheme = gif.welcomeToPeachAndGoma;
                }
                embed
                    .setColor(color.main)
                    .setDescription(`Your current theme is **${client.utils.formatCapitalize(currentTheme)}**.`)
                    .setImage(imageTheme)
                    .setFooter({
                        text: `Request By ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    })

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }
        }
    }
};
