const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class Facebook extends Command {
    constructor(client) {
        super(client, {
            name: 'facebook',
            description: {
                content: 'Manage your Facebook details on your profile card or view someone else\'s profile.',
                examples: [
                    'facebook - Shows your current Facebook details.',
                    'facebook @mention - Shows the Facebook details of the mentioned user.',
                    'facebook name YourFacebookName - Sets your Facebook name.',
                    'facebook link https://facebook.com/YourFacebookLink - Sets your Facebook link.',
                    'facebook help - Shows command usage examples.'
                ],
                usage: 'facebook\nfacebook @mention\n facebook name <YourFacebookName>\n facebook link <YourFacebookLink>\n facebook help',
            },
            category: 'profile',
            aliases: ['fb'],
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
                    description: 'Sets your Facebook name in the profile card.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'name',
                            description: 'The Facebook name to set.',
                            type: 3, // String type
                            required: true,
                        },
                    ],
                },
                {
                    name: 'link',
                    description: 'Sets your Facebook link in the profile card.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'link',
                            description: 'The Facebook link to set.',
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
                    description: 'View someone\'s Facebook details.',
                    type: 1, // Sub-command type
                    options: [
                        {
                            name: 'user',
                            description: 'Mention a user to view their Facebook details.',
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

        const embed = client.embed().setTitle(`${client.emoji.mainLeft} Facebook Settings for ${targetUsername} ${client.emoji.mainRight}`);

        switch (subCommand) {
            case 'name': {
                if (mentionedUser) return client.utils.oops(client, ctx, 'You cannot change another user\'s Facebook name.');

                const name = ctx.isInteraction ? ctx.interaction.options.getString('name') : args.slice(1).join(' ');
                if (!name || name.length > 21) {
                    return await client.utils.oops(client, ctx, 'Please provide a valid Facebook name (up to 21 characters).');
                }

                embed.setDescription('Your Facebook name has been set.').addFields([{ name: 'New Facebook Name', value: `\`\`\`${name}\n\`\`\``, inline: false }]);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'social.facebook.name': name } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'link': {
                if (mentionedUser) return client.utils.oops(client, ctx, 'You cannot change another user\'s Facebook link.');

                const link = ctx.isInteraction ? ctx.interaction.options.getString('link') : args.slice(1).join(' ');
                const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/;

                if (!link || !urlPattern.test(link)) {
                    return await client.utils.oops(client, ctx, 'Please provide a valid Facebook link.');
                }

                embed.setDescription('Your Facebook link has been set.').addFields([{ name: 'New Facebook Link', value: `\`\`\`${link}\n\`\`\``, inline: false }]).setURL(link);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'social.facebook.link': link } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed.setTitle('Facebook Command Help')
                    .setDescription('Manage your Facebook details with the following subcommands:')
                    .addFields([
                        { name: 'Show Facebook Details', value: '`facebook show` or `facebook show @mention`', inline: false },
                        { name: 'Set Facebook Name', value: '`facebook name YourFacebookName`', inline: false },
                        { name: 'Set Facebook Link', value: '`facebook link https://facebook.com/YourFacebookLink`', inline: false },
                        { name: 'Command Help', value: '`facebook help`', inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'show': {
                const fbName = user.social.facebook.name || 'Not set';
                const fbLink = user.social.facebook.link || 'Not set';

                embed.setDescription(`${targetUsername}'s Facebook details:`)
                    .addFields([
                        { name: `${client.emoji.facebook} Name`, value: `\`\`\`${fbName}\`\`\``, inline: false },
                        { name: `${client.emoji.facebook} Link`, value: fbLink === 'Not set' ? fbLink : `[Link](${fbLink})`, inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                await client.utils.oops(client, ctx, 'Invalid sub-command. Use `facebook help` for guidance.');
            }
        }
    }
};
