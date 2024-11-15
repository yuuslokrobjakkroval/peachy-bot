const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");

module.exports = class Username extends Command {
    constructor(client) {
        super(client, {
            name: 'username',
            description: {
                content: 'Sets, resets, or shows your username.',
                examples: [
                    'username peachy',
                    'username reset',
                    'username show',
                    'username help'
                ],
                usage: 'username <text || reset || show || help>',
            },
            category: 'profile',
            aliases: [],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'set',
                    description: 'Sets the username in profile card',
                    type: 1,
                    options: [
                        {
                            name: 'text',
                            description: 'The text to set as your username.',
                            type: 3,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'reset',
                    description: 'Resets the username to the default one',
                    type: 1,
                },
                {
                    name: 'show',
                    description: 'Show the current username for you.',
                    type: 1,
                },
                {
                    name: 'help',
                    description: 'Displays example and usage information for the command.',
                    type: 1,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const user = await Users.findOne({ userId: ctx.author.id });
        const embed = client.embed().setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() });

        // Get messages from localization
        const userNameMessages = language.locales.get(language.defaultLocale)?.profileMessages?.userNameMessages;

        const subCommand = ctx.isInteraction ? ctx.interaction.options.data[0].name : args[0];

        switch (subCommand) {
            case 'help': {
                embed
                    .setColor(color.main)
                    .setDescription(userNameMessages.help.usage + '\n\n**Examples:**\n' + userNameMessages.help.examples.map(example => `\`${example}\``).join('\n'));

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'reset': {
                embed
                    .setColor(color.main)
                    .setDescription(userNameMessages.reset);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.username': 'No username set.' } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'show': {
                embed
                    .setColor(color.main)
                    .setDescription(user.profile.username ? userNameMessages.show.usernameSet.replace('{{username}}', user.profile.username) : userNameMessages.show.noUsername);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                const text = ctx.isInteraction ? ctx.interaction.options.data[0]?.options[0]?.value?.toString() : args.join(' ');

                if (!text) {
                    await client.utils.oops(client, ctx, userNameMessages.set.error.empty, color);
                    return;
                }

                if (text.length > 40) {
                    await client.utils.oops(client, ctx, userNameMessages.set.error.long, color);
                    return;
                }

                embed
                    .setDescription(userNameMessages.set.success.replace('{{username}}', text));

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.username': text } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }
        }
    }
};
