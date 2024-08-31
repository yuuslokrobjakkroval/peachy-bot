const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/User.js');

module.exports = class TikTok extends Command {
    constructor(client) {
        super(client, {
            name: 'tiktok',
            description: {
                content: 'Manage your TikTok details on your profile card or view someone else\'s profile.',
                examples: [
                    'tiktok - Shows your current TikTok details.',
                    'tiktok @mention - Shows the TikTok details of the mentioned user.',
                    'tiktok name YourTikTokName - Sets your TikTok name.',
                    'tiktok link https://tiktok.com/@YourTikTokLink - Sets your TikTok link.',
                    'tiktok help - Shows command usage examples.'
                ],
                usage: 'tiktok\n tiktok @mention\n tiktok name <YourTikTokName>\n tiktok link <YourTikTokLink>\n tiktok help',
            },
            category: 'profile',
            aliases: ['tt'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'name',
                    description: 'Sets your TikTok name in the profile card.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'name',
                            description: 'The TikTok name to set.',
                            type: 3, // String type
                            required: true,
                        },
                    ],
                },
                {
                    name: 'link',
                    description: 'Sets your TikTok link in the profile card.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'link',
                            description: 'The TikTok link to set.',
                            type: 3, // String type
                            required: true,
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
                    description: 'View someone\'s TikTok details.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'user',
                            description: 'Mention a user to view their TikTok details.',
                            type: 6, // User type for mentions
                            required: false,
                        },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const mentionedUser = ctx.isInteraction ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
        const targetUserId = mentionedUser ? mentionedUser.id : ctx.author.id;
        const user = await Users.findOne({ userId: targetUserId });
        const targetUsername = mentionedUser ? mentionedUser.username : ctx.author.username;

        const embed = client.embed().setTitle(`${client.emoji.mainLeft} TikTok Settings for ${targetUsername} ${client.emoji.mainRight}`);

        switch (subCommand) {
            case 'name': {
                if (mentionedUser) return client.utils.oops(client, ctx, 'You cannot change another user\'s TikTok name.');

                const name = ctx.isInteraction ? ctx.interaction.options.getString('name') : args.slice(1).join(' ');
                if (!name || name.length > 21) {
                    return await client.utils.oops(client, ctx, 'Please provide a valid TikTok name (up to 21 characters).');
                }

                embed.setDescription('Your TikTok name has been set.').addFields([{ name: 'New TikTok Name', value: `\`\`\`${name}\n\`\`\``, inline: false }]);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.tiktok.name': name } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'link': {
                if (mentionedUser) return client.utils.oops(client, ctx, 'You cannot change another user\'s TikTok link.');

                const link = ctx.isInteraction ? ctx.interaction.options.getString('link') : args.slice(1).join(' ');
                const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/;

                if (!link || !urlPattern.test(link)) {
                    return await client.utils.oops(client, ctx, 'Please provide a valid TikTok link.');
                }

                embed.setDescription('Your TikTok link has been set.').addFields([{ name: 'New TikTok Link', value: `\`\`\`${link}\n\`\`\``, inline: false }]).setURL(link);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'profile.tiktok.link': link } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed.setTitle('TikTok Command Help')
                    .setDescription('Manage your TikTok details with the following subcommands:')
                    .addFields([
                        { name: 'Show TikTok Details', value: '`tiktok` or `tiktok @mention`', inline: false },
                        { name: 'Set TikTok Name', value: '`tiktok name YourTikTokName`', inline: false },
                        { name: 'Set TikTok Link', value: '`tiktok link https://tiktok.com/@YourTikTokLink`', inline: false },
                        { name: 'Command Help', value: '`tiktok help`', inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'show': {
                const ttName = user.profile.tiktok.name || 'Not set';
                const ttLink = user.profile.tiktok.link || 'Not set';

                embed.setDescription(`${targetUsername}'s TikTok details:`)
                    .addFields([
                        { name: 'TikTok Name', value: `\`\`\`${ttName}\`\`\``, inline: false },
                        { name: 'TikTok Link', value: ttLink === 'Not set' ? ttLink : `[Link](${ttLink})`, inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                await client.utils.oops(client, ctx, 'Invalid sub-command. Use `tiktok help` for guidance.');
            }
        }
    }
};
