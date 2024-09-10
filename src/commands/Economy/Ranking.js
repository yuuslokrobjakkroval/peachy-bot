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
                        { name: 'Peach', value: 'peachy' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        const type = ctx.isInteraction ? ctx.interaction.options.data[0]?.value : args[0] || 'bal';
        const handleEmoji = (no) => {
            switch (no) {
                case 1:
                    return client.emoji.rank.one;
                case 2:
                    return client.emoji.rank.two;
                case 3:
                    return client.emoji.rank.three;
                case 4:
                    return client.emoji.rank.four;
                case 5:
                    return client.emoji.rank.five;
                case 6:
                    return client.emoji.rank.six;
                case 7:
                    return client.emoji.rank.seven;
                default:
                    return client.emoji.rank.eight;
            }
        }
        if (type === 'bal') {
            const users = await Users.aggregate([
                {
                    $project: {
                        userId: 1,
                        totalCoins: { $add: ['$balance.coin', '$balance.bank'] },
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
            const userRank = `**${user.username} Rank : ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user?.totalCoins || 0)}** ${client.emoji.coin}\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                const totalCoins = `**${client.utils.formatNumber(user.totalCoins)}** ${client.emoji.coin} `;
                return `**${emoji} ${position}. ${user.username ? user.username : 'Unknown'}**\n${totalCoins}`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${client.emoji.rank.owner} **𝐓𝐎𝐏 𝐏𝐇𝐔𝐌 𝐂𝐎𝐈𝐍𝐒** ${client.emoji.rank.owner}`)
                    .setColor(client.color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else if (type === 'peachy') {
            const users = await Users.find({ 'peachy.streak': { $gt: 0 } }).sort({ 'peachy.streak': -1 }).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, 'No one has a streak yet.');
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user.username} Rank :  ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user.peachy.streak || 0)} streaks**\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                return `**${emoji} ${position}. ${user.username ? user.username : 'Unknown'}**\n**${client.utils.formatNumber(user.peachy.streak)} streaks**`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${client.emoji.rank.babyOwner} **𝐓𝐎𝐏 𝐏𝐇𝐔𝐌 𝐏𝐄𝐀𝐂𝐇𝐘** ${client.emoji.rank.babyOwner}`)
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
