const Command = require('../../structures/Command.js');
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const globalEmoji = require('../../utils/Emoji');
const { formatCapitalize } = require('../../utils/Utils.js');

module.exports = class Help extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            description: {
                content: 'Displays the commands of the bot',
                examples: ['help', 'help balance'],
                usage: 'help [command]',
            },
            category: 'info',
            aliases: ['h'],
            cooldown: 3,
            args: false,
            player: {
                voice: false,
                dj: false,
                active: false,
                djPerm: null,
            },
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'command',
                    description: 'The command you want to get info on',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const prefix = client.config.prefix;
        const adminCategory = ['admin', 'company', 'dev', 'developer', 'guild', 'owner', 'staff'];

        const categories = [
            {
                name: 'actions',
                emoji: emoji.help.actions ? emoji.help.actions : globalEmoji.help.actions || '⚡',
                description: 'User interaction commands',
            },
            {
                name: 'bank',
                emoji: emoji.help.bank ? emoji.help.bank : globalEmoji.help.bank || '🏦',
                description: 'Banking and money management',
            },
            {
                name: 'building',
                emoji: emoji.help.building ? emoji.help.building : globalEmoji.help.building || '🏗️',
                description: 'Building and construction',
            },
            {
                name: 'economy',
                emoji: emoji.help.economy ? emoji.help.economy : globalEmoji.help.economy || '💰',
                description: 'Economy and trading system',
            },
            {
                name: 'emotes',
                emoji: emoji.help.emotes ? emoji.help.emotes : globalEmoji.help.emotes || '😊',
                description: 'Fun emoji and reaction commands',
            },
            {
                name: 'gambling',
                emoji: emoji.help.gambling ? emoji.help.gambling : globalEmoji.help.gambling || '🎲',
                description: 'Risk and reward games',
            },
            {
                name: 'games',
                emoji: emoji.help.games ? emoji.help.games : globalEmoji.help.games || '🎮',
                description: 'Interactive gaming commands',
            },
            {
                name: 'giveaways',
                emoji: emoji.help.giveaways ? emoji.help.giveaways : globalEmoji.help.giveaways || '🎁',
                description: 'Giveaway management tools',
            },
            {
                name: 'info',
                emoji: emoji.help.info ? emoji.help.info : globalEmoji.help.info || 'ℹ️',
                description: 'Information and help commands',
            },
            {
                name: 'inventory',
                emoji: emoji.help.inventory ? emoji.help.inventory : globalEmoji.help.inventory || '🎒',
                description: 'Item and inventory management',
            },
            {
                name: 'profile',
                emoji: emoji.help.profile ? emoji.help.profile : globalEmoji.help.profile || '👤',
                description: 'User profile customization',
            },
            {
                name: 'rank',
                emoji: emoji.help.rank ? emoji.help.rank : globalEmoji.help.rank || '🏆',
                description: 'Ranking and leaderboards',
            },
            {
                name: 'relationship',
                emoji: emoji.help.relationship ? emoji.help.relationship : globalEmoji.help.relationship || '💕',
                description: 'Relationship and dating',
            },
            {
                name: 'social',
                emoji: emoji.help.social ? emoji.help.social : globalEmoji.help.social || '👥',
                description: 'Social interaction features',
            },
            {
                name: 'utility',
                emoji: emoji.help.utility ? emoji.help.utility : globalEmoji.help.utility || '🛠️',
                description: 'Helpful utility commands',
            },
        ];

        const commands = client.commands.filter((cmd) => !adminCategory.includes(cmd.category));

        // If specific command requested
        if (args[0]) {
            const command = client.commands.get(args[0].toLowerCase());
            if (!command) {
                const similar = Array.from(client.commands.values())
                    .filter((cmd) => cmd.name.includes(args[0].toLowerCase()) || cmd.aliases.some((a) => a.includes(args[0].toLowerCase())))
                    .slice(0, 3);

                const embed = client
                    .embed()
                    .setColor(color.danger)
                    .setTitle('❌ Command Not Found')
                    .setDescription(
                        `Could not find command: **${args[0]}**\n\n` +
                            (similar.length > 0
                                ? `**Did you mean:**\n${similar.map((c) => `• \`${prefix}${c.name}\``).join('\n')}\n\n`
                                : '') +
                            `Use \`${prefix}help\` to see all commands!`
                    );
                return ctx.sendMessage({ embeds: [embed] });
            }

            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(`${client.utils.formatCapitalize(command.name)}`)
                .setDescription(command.description.content)
                .addFields([
                    {
                        name: 'Usage',
                        value: `\`${prefix}${command.description.usage}\``,
                        inline: true,
                    },
                    {
                        name: 'Category',
                        value: client.utils.formatCapitalize(command.category),
                        inline: true,
                    },
                    {
                        name: 'Cooldown',
                        value: `${client.utils.formatTime(command.cooldown)}`,
                        inline: true,
                    },
                    {
                        name: 'Aliases',
                        value: command.aliases.length > 0 ? command.aliases.map((a) => `\`${a}\``).join(', ') : 'None',
                        inline: true,
                    },
                    {
                        name: 'Examples',
                        value: command.description.examples.map((ex) => `\`${prefix}${ex}\``).join('\n'),
                        inline: false,
                    },
                    {
                        name: 'Permissions',
                        value: command.permissions.user.length > 0 ? command.permissions.user.join(', ') : 'None required',
                        inline: false,
                    },
                ])
                .setFooter({ text: `Requested by ${ctx.author.username}` });

            return ctx.sendMessage({ embeds: [embed] });
        }

        // Show all categories overview with dropdown
        const categoryOptions = categories.map((cat) => {
            const count = commands.filter((cmd) => cmd.category.toLowerCase() === cat.name.toLowerCase()).size;
            return {
                emoji: cat.emoji,
                label: client.utils.formatCapitalize(cat.name),
                description: `${count} commands`,
                value: cat.name,
            };
        });

        const categorySelectMenu = new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder(`📚 Select a category`)
            .addOptions(categoryOptions);

        const selectRow = new ActionRowBuilder().addComponents(categorySelectMenu);

        const totalCommands = Array.from(commands.values()).length;
        const categoryList = categories
            .map((cat) => {
                const count = commands.filter((cmd) => cmd.category.toLowerCase() === cat.name.toLowerCase()).size;
                return `${cat.emoji} **${client.utils.formatCapitalize(cat.name)}** - \`${count}\``;
            })
            .join('\n');

        const embed = client
            .embed()
            .setColor(color.main)
            .setTitle('📚 Command Help')
            .setDescription(
                `**Welcome!** Select a category below or use:\n\`${prefix}help [command]\` - for command details\n\n${categoryList}`
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Total Commands: ${totalCommands}` })
            .setTimestamp();

        const message = await ctx.sendMessage({ embeds: [embed], components: [selectRow] });

        // Create collector for interactions
        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === ctx.author.id,
            time: 300000, // 5 minutes
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'category_select') {
                const selectedCategory = interaction.values[0];
                const categoryCommands = commands.filter((cmd) => cmd.category.toLowerCase() === selectedCategory.toLowerCase());

                const categoryInfo = categories.find((cat) => cat.name === selectedCategory);
                const commandsList = Array.from(categoryCommands.values())
                    .map((cmd, i) => {
                        return `${String(i + 1).padStart(2, '0')}. **${formatCapitalize(cmd.name)}**\n${cmd.description.content.slice(0, 50)}`;
                    })
                    .join('\n\n');

                const categoryEmbed = client
                    .embed()
                    .setColor(color.main)
                    .setTitle(`${categoryInfo?.emoji || '📁'} ${client.utils.formatCapitalize(selectedCategory)} Commands`)
                    .setDescription(
                        `Showing ${categoryCommands.size} commands in this category.\n\nUse \`${prefix}help [command]\` for more details!`
                    )
                    .addFields({
                        name: 'Commands',
                        value: commandsList || 'No commands found',
                        inline: false,
                    })
                    .setFooter({ text: `${categoryCommands.size} commands • Select another category or click back` })
                    .setTimestamp();

                const backButton = new ButtonBuilder().setCustomId('back_to_main').setLabel('← Back').setStyle(ButtonStyle.Secondary);

                const buttonRow = new ActionRowBuilder().addComponents(backButton);

                await interaction.update({
                    embeds: [categoryEmbed],
                    components: [selectRow, buttonRow],
                });
            } else if (interaction.customId === 'back_to_main') {
                await interaction.update({
                    embeds: [embed],
                    components: [selectRow],
                });
            }
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    }
};
