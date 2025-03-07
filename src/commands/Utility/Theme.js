const { Command } = require('../../structures/index.js');
const globalGif = require('../../utils/Gif');

module.exports = class Theme extends Command {
    constructor(client) {
        super(client, {
            name: 'theme',
            description: {
                content: '𝑻𝒐𝒈𝒈𝒍𝒆 𝒃𝒆𝒕𝒘𝒆𝒆𝒏 𝒑𝒆𝒂𝒄𝒉, 𝒈𝒐𝒎𝒂, 𝒂𝒏𝒅 𝒏𝒐𝒓𝒎𝒂𝒍 𝒕𝒉𝒆𝒎𝒆𝒔 𝒐𝒓 𝒗𝒊𝒆𝒘 𝒚𝒐𝒖𝒓 𝒄𝒖𝒓𝒓𝒆𝒏𝒕 𝒕𝒉𝒆𝒎𝒆 𝒔𝒆𝒕𝒕𝒊𝒏𝒈.',
                examples: [
                    'theme show - Shows your current theme.',
                    'theme normal - Sets your theme to normal.',
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

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const themeMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.themeMessages;

        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const embed = client.embed();

        const convertSubCommand = subCommand?.toLowerCase();

        try {
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return ctx.sendMessage('User not found.');
            }

            switch (convertSubCommand) {
                case 'normal':
                case 'peach':
                case 'goma': {
                    const equippedItem = user.equip.find(item => item.id.startsWith('t') || item.id.startsWith('st'));
                    if (equippedItem) {
                        const inventoryItem = user.inventory.find(item => item.id === equippedItem.id);
                        if (inventoryItem) {
                            inventoryItem.quantity += 1;
                        } else {
                            user.inventory.push({
                                id: equippedItem.id,
                                name: equippedItem.name,
                                quantity: 1,
                            });
                        }

                        // Remove item from equip
                        user.equip = user.equip.filter(item => item.id !== equippedItem.id);
                    }

                    // Update the theme preference
                    user.preferences.theme = convertSubCommand;
                    await user.save();

                    const themeColor = convertSubCommand === 'peach' ? '#8BD3DD' : convertSubCommand === 'goma' ? '#94716B' : '#F582AE';
                    const themeImage = convertSubCommand === 'peach' ? globalGif.welcomeToPeach : convertSubCommand === 'goma' ? globalGif.welcomeToGoma : globalGif.welcomeToPeachAndGoma;
                    embed
                        .setColor(themeColor)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', "𝐓𝐇𝐄𝐌𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆")
                                .replace('%{mainRight}', emoji.mainRight) +
                            themeMessages?.setThemeMessage.replace('%{theme}', client.utils.formatCapitalize(convertSubCommand))
                        )
                        .setImage(themeImage)
                        .setFooter({
                            text: generalMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    ctx.sendMessage({ embeds: [embed] });
                    break;
                }

                case 'help': {
                    const { examples, usage } = this.description;
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
                            { name: themeMessages?.examplesLabel || 'Examples', value: examples.join('\n') },
                            { name: themeMessages?.usageLabel || 'Usage', value: usage }
                        ])
                        .setFooter({
                            text: themeMessages?.footer.replace('%{user}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });
                    ctx.sendMessage({ embeds: [embed] });
                    break;
                }

                default: {
                    const currentTheme = user.preferences.theme || 'Not set';
                    const themeColor = currentTheme === 'peach' ? '#8BD3DD' : currentTheme === 'goma' ? '#94716B' : '#F582AE';
                    const themeImage = currentTheme === 'peach' ? globalGif.welcomeToPeach : currentTheme === 'goma' ? globalGif.welcomeToGoma : globalGif.welcomeToPeachAndGoma;
                    embed
                        .setColor(themeColor)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', "𝐓𝐇𝐄𝐌𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆")
                                .replace('%{mainRight}', emoji.mainRight) +
                            themeMessages?.currentThemeMessage.replace('%{theme}', client.utils.formatCapitalize(currentTheme))
                        )
                        .setImage(themeImage)
                        .setFooter({
                            text: generalMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    ctx.sendMessage({ embeds: [embed] });
                    break;
                }
            }
        } catch (err) {
            console.error(`Error fetching or updating user data: ${err}`);
            ctx.sendMessage({
                content: generalMessages?.userFetchError || 'An error occurred. Please try again later.',
            });
        }
    }
};
