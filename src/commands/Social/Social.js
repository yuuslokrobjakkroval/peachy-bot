const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class Socials extends Command {
    constructor(client) {
        super(client, {
            name: 'socials',
            description: {
                content: 'Show social media profiles.',
                examples: ['socials - Shows your current social media profiles.'],
                usage: 'socials',
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
                    name: 'user',
                    description: 'Mention a user to view their social media profiles.',
                    type: 6, // USER type for mentions
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const mentionedUser = ctx.isInteraction ? ctx.interaction.options.getUser('user') : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
        const targetUserId = mentionedUser ? mentionedUser.id : ctx.author.id;
        const user = await Users.findOne({ userId: targetUserId });
        const targetUsername = mentionedUser ? mentionedUser.displayName : ctx.author.displayName;

        if (!user) {
            const embed = client.embed().setColor(color.red).setDescription(`User not found.`);
            return ctx.sendMessage({ embeds: [embed] });
        }

        const fbName = user.social.facebook.name || 'Not set';
        const fbLink = user.social.facebook.link || '';
        const igName = user.social.instagram.name || 'Not set';
        const igLink = user.social.instagram.link || '';
        const ttName = user.social.tiktok.name || 'Not set';
        const ttLink = user.social.tiktok.link || '';

        const socialDescription = `
        **${emoji.social.facebook} : ${fbName && fbLink  ? `[${fbName}](${fbLink})` : fbName ? fbName : 'Not Set'}**\n
        **${emoji.social.instagram} : ${igName && igLink  ? `[${igName}](${igLink})` : igName ? igName : 'Not Set'}**\n
        **${emoji.social.tiktok} : ${ttName && ttLink  ? `[${ttName}](${ttLink})` : ttName ? ttName : 'Not Set'}**\n
        `;

        const embed = client.embed()
            .setTitle(`📱 Social Media for ${targetUsername} 📱`)
            .setDescription(socialDescription)
            .setColor(color.main);

        return ctx.sendMessage({ embeds: [embed] });
    }
};
