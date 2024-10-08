const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const config = require("../../config");
const gif = require("../../utils/Gif");

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
        const users = await Users.aggregate([
            { $sort: { 'balance.coin': -1 }},
        ]).exec();

        await Promise.all(users.map(async user => {
            try {
                const userInfo = await client.users.fetch(user.userId);
                const username = userInfo ? userInfo.displayName : 'Unknown';
                await Users.updateOne({ userId: user.userId }, { $set: { username: username } });
            } catch (error) {
                console.error(`Failed to fetch user ${user.userId}:`, error);
            }
        }));
        setTimeout(async () => {
            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription('Add Username Successfully');
            const messageEmbed= await ctx.sendMessage({ embeds: [embed] });
            await messageEmbed.delete();
        }, 5000);
    }
};
