const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class Ranking extends Command {
    constructor(client) {
        super(client, {
            name: 'ranking',
            description: {
                embed: 'Check top coin, bank, and streak of peachy in your Discord guild and globally.',
                examples: ['leaderboard', 'lb', 'top'],
                usage: 'ranking <bal|streak>',
            },
            category: 'economy',
            aliases: ['leaderboard', 'lb', 'top'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'type',
                    type: 3,
                    description: 'Choose which leaderboard to display',
                    required: true,
                    choices: [
                        { name: 'Balance', value: 'bal' },
                        { name: 'Magic', value: 'magic' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        const type = ctx.isInteraction ? ctx.interaction.options.data[0]?.value : args[0] || 'bal';
        if (type === 'bal') {
            const users = await Users.aggregate([
                {
                    $project: {
                        userId: 1,
                        totalCoins: { $add: ['$balance.coin', 0] },
                        username: '$username',
                    }
                },
                {
                    $match: { totalCoins: { $ne: 0 } }
                },
                { $sort: { totalCoins: -1 } }
            ]).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, 'No one has gained coins yet.');
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user && user?.username ? user?.username : 'Unknown'} Rank : #${userPosition}**\n**${client.utils.formatNumber(user?.totalCoins || 0)}** ${client.emoji.coin}\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const totalCoins = `**${client.utils.formatNumber(user.totalCoins)}** ${client.emoji.coin} `;
                return `**#${position}. ${user.username ? user.username : 'Unknown'}**\n${totalCoins}`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${client.emoji.rank.owner} **𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃** ${client.emoji.rank.owner}`)
                    .setColor(client.color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else if (type === 'magic' || type === 'mm') {
            const users = await Users.find({ 'magic.streak': { $gt: 0 } }).sort({ 'magic.streak': -1 }).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, 'No one has a streak yet.');
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user && user?.username ? user.username : 'Unknown'} Rank :  ${userPosition}**\n**${client.utils.formatNumber(user.magic.streak || 0)} streaks**\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                return `**#${position}. ${user.username ? user.username : 'Unknown'}**\n**${client.utils.formatNumber(user.peachy.streak)} streaks**`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${client.emoji.rank.babyOwner} **𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃** ${client.emoji.rank.babyOwner}`)
                    .setColor(client.color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else {
            return await client.utils.oops(client, ctx, 'Invalid leaderboard type.');
        }
    }
};
