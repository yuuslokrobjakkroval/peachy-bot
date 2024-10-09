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
                        { name: 'Goma', value: 'goma' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const type = ctx.isInteraction ? ctx.interaction.options.data[0]?.value : args[0] || 'bal';
        const handleEmoji = (no) => {
            switch (no) {
                case 1:
                    return emoji.rank.one;
                case 2:
                    return emoji.rank.two;
                case 3:
                    return emoji.rank.three;
                case 4:
                    return emoji.rank.four;
                case 5:
                    return emoji.rank.five;
                case 6:
                    return emoji.rank.six;
                case 7:
                    return emoji.rank.seven;
                default:
                    return emoji.rank.eight;
            }
        }
        if (type === 'bal') {
            const users = await Users.aggregate([
                {
                    $project: {
                        userId: 1,
                        totalCoins: { $add: ['$balance.coin', 0] },
                        username: '$username',
                    }
                },
                { $sort: { totalCoins: -1 } }
            ]).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx,'No one has gained coins yet.', color);
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user && user?.username ? user?.username : 'Unknown'} Rank : ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user?.totalCoins || 0)}** ${emoji.coin}\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                const totalCoins = `**${client.utils.formatNumber(user.totalCoins)}** ${emoji.coin} `;
                return `**${emoji} ${position}. ${user.username ? user.username : 'Unknown'}**\n${totalCoins}`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${emoji.rank.owner} **𝐓𝐎𝐏 𝐏𝐄𝐀𝐂𝐇𝐘 𝐂𝐎𝐈𝐍𝐒** ${emoji.rank.owner}`)
                    .setColor(color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else if (type === 'peachy' || type === 'pp') {
            const users = await Users.find({ 'peachy.streak': { $gt: 0 } }).sort({ 'peachy.streak': -1 }).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, 'No one has a streak yet.', color);
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user && user?.username ? user.username : 'Unknown'} Rank :  ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user.peachy.streak || 0)} streaks**\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                return `**${emoji} ${position}. ${user.username ? user.username : 'Unknown'}**\n**${client.utils.formatNumber(user.peachy.streak)} streaks**`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${emoji.rank.babyOwner} **𝐓𝐎𝐏 𝐏𝐄𝐀𝐂𝐇𝐘 𝐂𝐋𝐀𝐈𝐌** ${emoji.rank.babyOwner}`)
                    .setColor(color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else if (type === 'goma' || type === 'g') {
            const users = await Users.find({ 'goma.streak': { $gt: 0 } }).sort({ 'goma.streak': -1 }).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, 'No one has a streak yet.', color);
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user && user?.username ? user.username : 'Unknown'} Rank :  ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user.goma.streak || 0)} streaks**\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                return `**${emoji} ${position}. ${user.username ? user.username : 'Unknown'}**\n**${client.utils.formatNumber(user.goma.streak)} streaks**`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${emoji.rank.babyOwner} **𝐓𝐎𝐏 𝐆𝐎𝐌𝐀 𝐂𝐋𝐀𝐈𝐌** ${emoji.rank.babyOwner}`)
                    .setColor(color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else {
            return await client.utils.oops(client, ctx, 'Invalid leaderboard type.', color);
        }
    }
};
