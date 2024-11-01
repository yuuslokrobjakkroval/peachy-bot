const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class RemoveTimeout extends Command {
    constructor(client) {
        super(client, {
            name: 'removetimeout',
            description: {
                content: "Remove timeout from a user.",
                examples: ['removetimeout @user'],
                usage: 'removetimeout <user>',
            },
            category: 'admin',
            aliases: ['untimeout'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageMessages'], // Modify permissions as needed
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]);

        if (!mention) {
            return await ctx.sendMessage({
                embeds: [client.embed().setColor(color.danger).setDescription('Please mention a user to remove the timeout from.')],
            });
        }

        // Get user from the database
        let user = await Users.findOne({ userId: mention.id });
        if (!user || !user.verification.timeout.expiresAt) {
            return await ctx.sendMessage({
                embeds: [client.embed().setColor(color.danger).setDescription(`${mention} is not currently in timeout.`)],
            });
        }

        // Clear the timeout information from the database
        user.verification.timeout.expiresAt = null;
        user.verification.timeout.reason = null;
        await user.save();

        // Send confirmation message
        await ctx.sendMessage({
            embeds: [client.embed().setColor(color.success).setDescription(`Successfully removed timeout from **${mention}**.`)],
        });
    }
};
