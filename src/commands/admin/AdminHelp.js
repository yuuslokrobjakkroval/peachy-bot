const Command = require("../../structures/Command.js");
const { StringSelectMenuBuilder } = require("discord.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class AdminHelp extends Command {
    constructor(client) {
        super(client, {
            name: "adminhelp",
            description: {
                content: "Displays the admin commands of the bot",
                examples: ["adminhelp"],
                usage: "adminhelp",
            },
            category: "admin",
            aliases: ["ah"],
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
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "command",
                    description: "The admin command you want to get info on",
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const helpMessages = language.locales.get(language.defaultLocale)?.informationMessages?.helpMessages;
        const categoriesMessages = language.locales.get(language.defaultLocale)?.informationMessages?.helpMessages?.categoriesMessages;
        const prefix = client.config.prefix;
        const adminCategory = ["admin", "dev", "guild"];
        const commands = client.commands.filter((cmd) => adminCategory.includes(cmd.category.toLowerCase()));
        const selectedItemIndex = null;

        if (!args[0]) {
            const messageOptions = () => {
                const helpEmbed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                            .replace("%{mainLeft}", emoji.mainLeft)
                            .replace("%{title}", "𝐀𝐃𝐌𝐈𝐍")
                            .replace("%{mainRight}", emoji.mainRight) +
                        `${helpMessages.description} ***${prefix}adminhelp [command]***\n` +
                        `${helpMessages.examples} ***${prefix}adminhelp ban***\n\n` +
                        `${helpMessages.note}`
                    )
                    .addFields([
                        {
                            name: `${emoji.help.category ? emoji.help.category : "📚"} __𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒__`,
                            value: adminCategory
                                .map(
                                    (category) =>
                                        `- ${categoriesMessages[category.toLowerCase()] || category}`
                                )
                                .join("\n"),
                            inline: false,
                        },
                    ])
                    .setImage(client.config.links.banner)
                    .setFooter({
                        text: helpMessages.footer,
                        iconURL: client.user.displayAvatarURL(),
                    });

                const categoryOptions = adminCategory.map((category) => ({
                    label: `${categoriesMessages[category.toLowerCase()] || category}`,
                    value: category.toLowerCase(),
                    default: selectedItemIndex === category.toLowerCase(), // Only true if matched
                }));

                const categorySelectButton = new StringSelectMenuBuilder()
                    .setCustomId("category_select")
                    .setPlaceholder("Select a category")
                    .addOptions(categoryOptions);

                const row = client.utils.createButtonRow(categorySelectButton);

                return { embeds: [helpEmbed], components: [row] };
            };

            // Send Admin Help Message
            const replyMessage = await (ctx.isInteraction
                ? ctx.interaction.reply({ ...messageOptions(), fetchReply: true })
                : ctx.channel.send({ ...messageOptions(), fetchReply: true }));

            // Collector for Category Selection
            const collector = replyMessage.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === ctx.author.id,
                time: 3000000,
            });

            collector.on("collect", async (interaction) => {
                const selectedCategory = interaction.values[0];
                const categoryCommands = commands.filter(
                    (cmd) => cmd.category.toLowerCase() === selectedCategory.toLowerCase()
                );

                const commandNames =
                    categoryCommands.size > 0
                        ? Array.from(categoryCommands.values())
                            .map(
                                (cmd) =>
                                    `- ${cmd.name}\n${globalEmoji.border.right} ${cmd.description.examples}`
                            ) // Limit description to 100 chars
                            .join("\n")
                        : "𝑵𝒐 𝒄𝒐𝒎𝒎𝒂𝒏𝒅𝒔 𝒇𝒐𝒖𝒏𝒅 𝒊𝒏 𝒕𝒉𝒊𝒔 𝒄𝒂𝒕𝒆𝒈𝒐𝒓𝒚.";

                const selectedEmbed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                            .replace("%{mainLeft}", emoji.mainLeft)
                            .replace("%{title}", "𝐀𝐃𝐌𝐈𝐍")
                            .replace("%{mainRight}", emoji.mainRight) +
                        `${helpMessages.description} ***${prefix}adminhelp [command]***\n` +
                        `${helpMessages.examples} ***${prefix}adminhelp ban***\n\n` +
                        `${helpMessages.note}`
                    )
                    .addFields([
                        {
                            name: `${categoriesMessages[selectedCategory.toLowerCase()] || selectedCategory}`,
                            value:
                                commandNames.length > 1024
                                    ? commandNames.slice(0, 1021) + "..."
                                    : commandNames,
                            inline: false,
                        },
                    ])
                    .setImage(client.config.links.banner)
                    .setFooter({
                        text: helpMessages.footer,
                        iconURL: client.user.displayAvatarURL(),
                    });

                const categoryOptions = adminCategory.map((category) => ({
                    label: `${categoriesMessages[category.toLowerCase()] || category}`,
                    value: category.toLowerCase(),
                    default: category.toLowerCase() === selectedCategory.toLowerCase(),
                }));

                const categorySelectMenu = new StringSelectMenuBuilder()
                    .setCustomId("category_select")
                    .setPlaceholder("Select a category")
                    .addOptions(categoryOptions);

                const row = client.utils.createButtonRow(categorySelectMenu);

                await interaction.update({
                    embeds: [selectedEmbed],
                    components: [row],
                });
            });

            collector.on("end", () => {
                replyMessage.edit({ components: [] }).catch(() => {});
            });
        } else {
            const command = client.commands.get(args[0].toLowerCase());
            if (!command)
                return ctx.sendMessage({
                    embeds: [
                        client.embed()
                            .setColor(color.danger)
                            .setDescription(`${helpMessages.commandNotFound} \`${args[0]}\``),
                    ],
                });

            const helpEmbed = client
                .embed()
                .setColor(color.main)
                .setTitle(`${helpMessages.title} - ${command.name}`)
                .setDescription(command.description.content)
                .addFields([
                    {
                        name: `${helpMessages.category}`,
                        value: `${command.category}`,
                        inline: false,
                    },
                    {
                        name: `${helpMessages.aliases}`,
                        value: `${command.aliases
                            .map((alias) => `\`${alias}\``)
                            .join(", ")}`,
                        inline: false,
                    },
                    {
                        name: `${helpMessages.cooldown}`,
                        value: `[${client.utils.formatTime(command.cooldown)}]`,
                        inline: false,
                    },
                    {
                        name: `${helpMessages.permissions}`,
                        value: `${command.permissions.client
                            .map((perm) => `\`${perm}\``)
                            .join(", ")}`,
                        inline: false,
                    },
                    {
                        name: `${helpMessages.examples}`,
                        value: `\`\`\`arm\n${command.description.examples
                            .map((example) => `${prefix.prefix}${example}`)
                            .join("\n")}\n\`\`\``,
                        inline: false,
                    },
                ]);
            await ctx.sendMessage({ embeds: [helpEmbed] });
        }
    }
};
