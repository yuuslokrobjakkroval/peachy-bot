const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class Theme extends Command {
    constructor(client) {
        super(client, {
            name: 'theme',
            description: {
                content: 'Toggle between peach and goma themes or view your current theme setting.',
                examples: [
                    'theme - Shows your current theme.',
                    'theme set peach - Sets your theme to peach.',
                    'theme set goma - Sets your theme to goma.',
                    'theme help - Shows command usage examples.'
                ],
                usage: 'theme\n theme set <peach|goma>\n theme help',
            },
            category: 'utility',
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
                    name: 'set',
                    description: 'Set your theme to peach or goma.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'mode',
                            description: 'The theme to set (peach or goma).',
                            type: 3, // String type
                            required: true,
                            choices: [
                                { name: 'Peach', value: 'peach' },
                                { name: 'Goma', value: 'goma' }
                            ]
                        },
                    ],
                },
                {
                    name: 'help',
                    description: 'Shows command usage examples and information.',
                    type: 1, // Sub-command type
                },
                {
                    name: 'show',
                    description: 'View your current theme setting.',
                    type: 1, // Sub-command type
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed().setTitle(`${client.emoji.mainLeft} Theme Settings ${client.emoji.mainRight}`);

        switch (subCommand) {
            case 'set': {
                const mode = ctx.isInteraction ? ctx.interaction.options.getString('mode') : args[1];
                if (!['peach', 'goma'].includes(mode)) {
                    return await client.utils.oops(client, ctx, 'Invalid theme mode. Please choose either "peach" or "goma".');
                }

                embed.setDescription(`Your theme has been set to **${client.utils.formatCapitalize(mode)}**.`).setColor(mode === 'peach' ? '#BBDEE4' : '#664C36');

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'preferences.theme': mode } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed.setTitle('Theme Command Help')
                    .setDescription('Manage your theme settings with the following subcommands:')
                    .addFields([
                        { name: 'Show Current Theme', value: '`theme show`', inline: false },
                        { name: 'Set Theme to Peach', value: '`theme set peach`', inline: false },
                        { name: 'Set Theme to Goma', value: '`theme set goma`', inline: false },
                        { name: 'Command Help', value: '`theme help`', inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'show': {
                const user = await Users.findOne({ userId: ctx.author.id });
                const currentTheme = user?.preferences?.theme || 'Not set';

                embed
                    .setDescription(`Your current theme is **${client.utils.formatCapitalize(currentTheme)}**.`)
                    .setColor(mode === 'peach' ? '#BBDEE4' : '#664C36');

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                await client.utils.oops(client, ctx, 'Invalid sub-command. Use `theme help` for guidance.');
            }
        }
    }
};
