const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class Theme extends Command {
    constructor(client) {
        super(client, {
            name: 'theme',
            description: {
                content: 'Toggle between peach, goma, and normal themes or view your current theme setting.',
                examples: [
                    'theme show - Shows your current theme.',
                    'theme peach - Sets your theme to peach.',
                    'theme goma - Sets your theme to goma.',
                    'theme normal - Sets your theme to normal.',
                    'theme help - Shows command usage examples.'
                ],
                usage: 'theme show\n theme peach\n theme goma\n theme normal\n theme help',
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

    async run(client, ctx, args) {
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed().setTitle(`${client.emoji.mainLeft} 𝐓𝐇𝐄𝐌𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ${client.emoji.mainRight}`);

        switch (subCommand) {
            case 'peach':
            case 'goma':
            case 'normal': {
                const mode = subCommand;
                embed
                    .setColor(mode === 'peach' ? '#BBDEE4' : mode === 'goma' ? '#664C36' : '#FFFFFF')
                    .setDescription(`Your theme has been set to **${client.utils.formatCapitalize(mode)}**.`);
                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'preferences.theme': mode } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                const embed = client.embed()
                    .setTitle(`${client.emoji.mainLeft} 𝐓𝐇𝐄𝐌𝐄 𝐇𝐄𝐋𝐏 ${client.emoji.mainRight}`)
                    .setDescription('Manage your theme settings.')
                    .addFields([
                        { name: 'Examples', value: '• theme\n• theme peach\n• theme goma\n• theme normal' },
                        { name: 'Usage', value: '• theme - Shows your current theme\n• theme peach - Sets your theme to peach\n• theme goma - Sets your theme to goma\n• theme normal - Sets your theme to normal' }
                    ])
                    .setColor(client.color.main);
                return ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                const user = await Users.findOne({ userId: ctx.author.id });
                const currentTheme = user?.preferences?.theme || 'Not set';

                const themeColor = currentTheme === 'peach' ? '#BBDEE4' : currentTheme === 'goma' ? '#664C36' : '#FFFFFF';

                embed
                    .setDescription(`Your current theme is **${client.utils.formatCapitalize(currentTheme)}**.`)
                    .setColor(themeColor);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }
        }
    }
};
