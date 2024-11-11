const { Command } = require('../../structures/index.js');

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
                    'theme help - Shows command usage examples.'
                ],
                usage: 'theme show\n theme normal\n theme peach\n theme goma\n theme help',
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

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const themeMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.themeMessages;

        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed();

        const convertSubCommand = subCommand?.toLowerCase();

        client.utils.getUser(ctx.author.id).then(async (user) => {
            if (!user) {
                return ctx.sendMessage('User not found.');
            }

            user.save().then(() => {
                switch (convertSubCommand) {
                    case 'normal':
                    case 'peach':
                    case 'goma': {
                        const equippedItem = user.equip.find(item => item.name?.startsWith('t') || item.name?.startsWith('st'));
                        if (equippedItem) {
                            const inventoryItem = user.inventory.find(item => item.id === equippedItem.id);

                            if (inventoryItem) {
                                // Increment quantity in inventory
                                inventoryItem.quantity += equippedItem.quantity;
                            } else {
                                // Push equipped item back to inventory
                                user.inventory.push({
                                    id: equippedItem.id,
                                    name: equippedItem.name,
                                    quantity: equippedItem.quantity,
                                });
                            }

                            // Remove item from equip
                            user.equip = user.equip.filter(item => item.id !== equippedItem.id);
                        }
                        user.preferences.theme = convertSubCommand;
                        embed
                            .setColor(color.main)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', "𝐓𝐇𝐄𝐌𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆")
                                    .replace('%{mainRight}', emoji.mainRight) +
                                themeMessages?.setThemeMessage.replace('%{theme}', client.utils.formatCapitalize(convertSubCommand))
                            )
                            .setFooter({
                                text: generalMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        ctx.sendMessage({embeds: [embed]});
                        break;
                    }

                    case 'help': {
                        const {examples, usage} = this.description;
                        embed
                            .setColor(color.main)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', "𝐓𝐇𝐄𝐌𝐄 𝐇𝐄𝐋𝐏")
                                    .replace('%{mainRight}', emoji.mainRight) +
                                themeMessages?.helpDescription
                            )
                            .addFields([
                                {name: themeMessages?.examplesLabel || 'Examples', value: examples.join('\n')},
                                {name: themeMessages?.usageLabel || 'Usage', value: usage}
                            ])
                            .setFooter({
                                text: themeMessages?.footer.replace('%{user}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });
                        ctx.sendMessage({embeds: [embed]});
                        break;
                    }

                    default: {
                        const currentTheme = user.preferences.theme || 'Not set';
                        embed
                            .setColor(color.main)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', "𝐓𝐇𝐄𝐌𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆")
                                    .replace('%{mainRight}', emoji.mainRight) +
                                themeMessages?.currentThemeMessage.replace('%{theme}', client.utils.formatCapitalize(currentTheme))
                            )
                            .setFooter({
                                text: generalMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        ctx.sendMessage({embeds: [embed]});
                        break;
                    }
                }
            });
        })
            .catch((err) => {
                console.error(`Error fetching or updating user data: ${err}`);
                ctx.sendMessage({
                    content: generalMessages?.userFetchError || 'An error occurred. Please try again later.',
                });
            });
    }
};
