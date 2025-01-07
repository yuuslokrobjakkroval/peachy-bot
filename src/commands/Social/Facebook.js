const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class Facebook extends Command {
    constructor(client) {
        super(client, {
            name: 'facebook',
            description: {
                content: `𝑴𝒂𝒏𝒂𝒈𝒆 𝒚𝒐𝒖𝒓 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 𝒅𝒆𝒕𝒂𝒊𝒍𝒔 𝒐𝒏 𝒚𝒐𝒖𝒓 𝒑𝒓𝒐𝒇𝒊𝒍𝒆 𝒄𝒂𝒓𝒅 𝒐𝒓 𝒗𝒊𝒆𝒘 𝒔𝒐𝒎𝒆𝒐𝒏𝒆 𝒆𝒍𝒔𝒆'𝒔 𝒑𝒓𝒐𝒇𝒊𝒍𝒆.`,
                examples: [
                    'facebook - Shows your current Facebook details.',
                    'facebook @mention - Shows the Facebook details of the mentioned user.',
                    'facebook name YourFacebookName - Sets your Facebook name.',
                    'facebook link https://facebook.com/YourFacebookLink - Sets your Facebook link.',
                    'facebook help - Shows command usage examples.'
                ],
                usage: 'facebook\nfacebook @mention\nfacebook name <YourFacebookName>\nfacebook link <YourFacebookLink>\nfacebook help',
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
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const fbMessages = language.locales.get(language.defaultLocale)?.socialMessages?.fbMessages;

        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];
        const mentionedUser = ctx.isInteraction ? ctx.interaction.options.getUser('user') : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
        const targetUserId = mentionedUser ? mentionedUser.id : ctx.author.id;
        const user = await Users.findOne({ userId: targetUserId });
        const targetUsername = mentionedUser ? mentionedUser.displayName : ctx.author.displayName;

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, fbMessages?.userNotFound || 'User not found.', color);
        }

        const embed = client.embed().setTitle(`${emoji.mainLeft} ${fbMessages?.settingsTitle || 'Facebook Settings'} ${emoji.mainRight}`);

        switch (subCommand) {
            case 'name': {
                const name = ctx.isInteraction ? ctx.interaction.options.getString('name') : args.slice(1).join(' ');
                if (!name || name.length > 21) {
                    return await client.utils.oops(client, ctx, fbMessages?.invalidName || 'Please provide a valid Facebook name (up to 21 characters).', color);
                }

                embed.setDescription(fbMessages?.nameUpdated || 'Your Facebook name has been set.').addFields([{ name: fbMessages?.newName || 'New Facebook Name', value: `\`\`\`${name}\n\`\`\``, inline: false }]);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'social.facebook.name': name } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'link': {
                const link = ctx.isInteraction ? ctx.interaction.options.getString('link') : args.slice(1).join(' ');
                const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/;

                if (!link || !urlPattern.test(link)) {
                    return await client.utils.oops(client, ctx, fbMessages?.invalidLink || 'Please provide a valid Facebook link.', color);
                }

                embed.setDescription(fbMessages?.linkUpdated || 'Your Facebook link has been set.').addFields([{ name: fbMessages?.newLink || 'New Facebook Link', value: `\`\`\`${link}\n\`\`\``, inline: false }]).setURL(link);

                await Users.updateOne({ userId: ctx.author.id }, { $set: { 'social.facebook.link': link } }).exec();
                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            case 'help': {
                embed.setTitle(fbMessages?.helpTitle || 'Facebook Command Help')
                    .setDescription(fbMessages?.helpDescription || 'Manage your Facebook details with the following subcommands:')
                    .addFields([
                        { name: fbMessages?.showDetails || 'Show Facebook Details', value: '`\`\`\`facebook` or `facebook @mention\`\`\`', inline: false },
                        { name: fbMessages?.setName || 'Set Facebook Name', value: '`\`\`\`facebook name YourFacebookName\`\`\`', inline: false },
                        { name: fbMessages?.setLink || 'Set Facebook Link', value: '`\`\`\`facebook link https://facebook.com/YourFacebookLink`\`\`\`', inline: false },
                        { name: fbMessages?.commandHelp || 'Command Help', value: '`\`\`\`facebook help\`\`\`', inline: false }
                    ]);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }

            default: {
                const fbName = user.social.facebook.name || fbMessages?.notSet || 'Not set';
                const fbLink = user.social.facebook.link || '';

                embed.setColor(color.main).setDescription(
                    `**${emoji.social.facebook} : ${fbName && fbLink ? `[${fbName}](${fbLink})` : fbName ? fbName : fbMessages?.notSet || 'Not set'}**`);

                await ctx.sendMessage({ embeds: [embed] });
                break;
            }
        }
    }
};
