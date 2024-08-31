const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/User.js');

module.exports = class Socials extends Command {
    constructor(client) {
        super(client, {
            name: 'socials',
            description: {
                content: 'Manage and show social media profiles.',
                examples: [
                    'socials show - Shows your current social media profiles.',
                    'socials set - Allows you to set your social media profiles.',
                ],
                usage: 'socials show\nsocials set <platform> <name> <link>',
            },
            category: 'profile',
            aliases: ['socialmedia', 'sm'],
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
                    name: 'show',
                    description: 'Show social media profiles',
                    type: 1, // 1 represents SUB_COMMAND
                    options: [
                        {
                            name: 'user',
                            description: 'Mention a user to view their social media profiles.',
                            type: 6, // USER type for mentions
                            required: false,
                        },
                    ],
                },
                {
                    name: 'set',
                    description: 'Set your social media profiles',
                    type: 1, // 1 represents SUB_COMMAND
                    options: [
                        {
                            name: 'platform',
                            description: 'Select the platform to set (Facebook, Instagram, TikTok)',
                            type: 3, // STRING type
                            required: true,
                            choices: [
                                { name: 'Facebook', value: 'facebook' },
                                { name: 'Instagram', value: 'instagram' },
                                { name: 'TikTok', value: 'tiktok' },
                            ],
                        },
                        {
                            name: 'name',
                            description: 'Enter your profile name for the selected platform.',
                            type: 3, // STRING type
                            required: true,
                        },
                        {
                            name: 'link',
                            description: 'Enter your profile link for the selected platform.',
                            type: 3, // STRING type
                            required: true,
                        },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];

        if (subCommand === 'show') {
            // Handle 'show' sub-command
            const mentionedUser = ctx.isInteraction ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
            const targetUserId = mentionedUser ? mentionedUser.id : ctx.author.id;
            const user = await Users.findOne({ userId: targetUserId });
            const targetUsername = mentionedUser ? mentionedUser.username : ctx.author.username;

            const embed = client.embed().setTitle(`📱 Social Media Profiles for ${targetUsername} 📱`);

            const fbName = user.profile.facebook.name || 'Not set';
            const fbLink = user.profile.facebook.link || 'Not set';
            const igName = user.profile.instagram.name || 'Not set';
            const igLink = user.profile.instagram.link || 'Not set';
            const ttName = user.profile.tiktok.name || 'Not set';
            const ttLink = user.profile.tiktok.link || 'Not set';

            embed.addFields([
                { name: 'Facebook', value: `**Name**: ${fbName}\n**Link**: ${fbLink === 'Not set' ? fbLink : `[Link](${fbLink})`}`, inline: false },
                { name: 'Instagram', value: `**Name**: ${igName}\n**Link**: ${igLink === 'Not set' ? igLink : `[Link](${igLink})`}`, inline: false },
                { name: 'TikTok', value: `**Name**: ${ttName}\n**Link**: ${ttLink === 'Not set' ? ttLink : `[Link](${ttLink})`}`, inline: false },
            ]);

            await ctx.sendMessage({ embeds: [embed] });
        } else if (subCommand === 'set') {
            // Handle 'set' sub-command
            const platform = ctx.isInteraction ? ctx.interaction.options.getString('platform') : args[1];
            const name = ctx.isInteraction ? ctx.interaction.options.getString('name') : args[2];
            const link = ctx.isInteraction ? ctx.interaction.options.getString('link') : args[3];

            if (!['facebook', 'instagram', 'tiktok'].includes(platform)) {
                return ctx.sendMessage('Invalid platform selected.');
            }

            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return ctx.sendMessage('User not found.');
            }

            switch (platform) {
                case 'facebook':
                    user.profile.facebook.name = name;
                    user.profile.facebook.link = link;
                    break;
                case 'instagram':
                    user.profile.instagram.name = name;
                    user.profile.instagram.link = link;
                    break;
                case 'tiktok':
                    user.profile.tiktok.name = name;
                    user.profile.tiktok.link = link;
                    break;
            }

            await user.save();
            await ctx.sendMessage(`Successfully updated your ${platform} profile.`);
        } else {
            await ctx.sendMessage('Invalid sub-command. Use `socials show` or `socials set`.');
        }
    }
};
