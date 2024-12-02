const { Command } = require('../../structures');
const Users = require('../../schemas/user');

module.exports = class AddUsername extends Command {
    constructor(client) {
        super(client, {
            name: 'AddUsername',
            description: {
                content: "Add username to users.",
                examples: ['addusername'],
                usage: 'addusername',
            },
            category: 'developer',
            aliases: ['au'],
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            let messageEmbed;
            const startEmbed = client.embed()
                .setColor(color.main)
                .setDescription('Adding Username');
            messageEmbed = await ctx.sendMessage({ embeds: [startEmbed] });

            const users = await Users.aggregate([
                { $sort: { 'balance.coin': -1 } }
            ]).exec();

            if (!users.length) {
                console.log('No users found to process.');
                return;
            }

            await Promise.all(users.map(async user => {
                if (!user.userId) {
                    console.warn('User document missing userId:', user);
                    return;
                }
                try {
                    const userInfo = await client.users.fetch(user.userId);
                    const username = userInfo ? userInfo.username : 'Unknown';
                    await Users.updateOne(
                        {userId: user.userId},
                        {$set: {username: username}}
                    );
                    const processEmbed = client.embed().setColor(color.main).setDescription(`Add Username for ${userInfo.displayName} Successfully`);
                    messageEmbed = await ctx.editMessage({ embeds: [processEmbed] });
                } catch (error) {
                    console.error(`Failed to fetch user ${user.userId}:`, error);
                }
            }));

            const successEmbed = client.embed()
                .setColor(color.main)
                .setDescription('Add Username Successfully');
            messageEmbed = await ctx.editMessage({ embeds: [successEmbed] });

            setTimeout(async () => {
                try {
                    await messageEmbed.delete();
                } catch (deleteError) {
                    console.error('Failed to delete the message:', deleteError);
                }
            }, 300000);
        } catch (mainError) {
            console.error('An error occurred while running the command:', mainError);
        }
    }
};
