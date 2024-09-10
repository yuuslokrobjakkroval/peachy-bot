const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

const handleEmoji = (no) => {
    switch (no) {
        case 1:
            return this.client.emoji.rank.one;
        case 2:
            return this.client.emoji.rank.two;
        case 3:
            return this.client.emoji.rank.three;
        case 4:
            return this.client.emoji.rank.four;
        case 5:
            return this.client.emoji.rank.five;
        case 6:
            return this.client.emoji.rank.six;
        case 7:
            return this.client.emoji.rank.seven;
        case 8:
            return this.client.emoji.rank.eight;
        default:
            return this.client.emoji.rank.nine;
    }
}

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
            const userTotalCoins = users.find(({ userId }) => userId === ctx.author.id)?.totalCoins || 0;
            const userRank = `Your position: **#${userPosition}**\nTotal coins: **\`${client.utils.formatNumber(userTotalCoins)}\`** ${client.emoji.coin}`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = `#${index + 1} `;
                const totalCoins = `**\`${client.utils.formatNumber(user.totalCoins)}\`** ${client.emoji.coin} `;
                return `**${position
                    .replace('#1 ', '<:crystaltrophy12_11zon:1264224156850061455> ')
                    .replace('#2 ', '<:goldtrophy:1264221300621054106> ')
                    .replace('#3 ', '<:silvertrophy:1264221291540648067> ')}${user.username ? user.username : 'Unknown'}**\n${totalCoins}`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle('<a:Dom:1264200823542517812>🏆 **Global Coin Leaderboard** 🏆<a:Dom:1264200823542517812>')
                    .setColor(client.color.main)
                    .setDescription(`${userRank}\n\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else if (type === 'peachy') {
            const users = await Users.find({ 'peachy.streak': { $gt: 0 } }).sort({ 'peachy.streak': -1 }).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, 'No one has a streak yet.');
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const userStreak = users.find(({ userId }) => userId === ctx.author.id)?.peachy?.streak || 0;
            const userRank = `Your position: **#${userPosition}**\nDD: **${client.utils.formatNumber(userStreak)}** streaks`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = `#${index + 1} `;
                return `**${position
                    .replace('#1 ', '<:crystaltrophy12_11zon:1264224156850061455> ')
                    .replace('#2 ', '<:goldtrophy:1264221300621054106> ')
                    .replace('#3 ', '<:silvertrophy:1264221291540648067> ')}${user.username ? user.username : 'Unknown'}**\nDD: **${client.utils.formatNumber(user.peachy.streak)}** streaks`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle('<a:Dom:1264200823542517812>🏆 **Global Daddy Leaderboard** 🏆<a:Dom:1264200823542517812>')
                    .setColor(client.color.main)
                    .setDescription(`${userRank}\n\n${chunk.join('\n\n')}`)
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else {
            return await client.utils.oops(client, ctx, 'Invalid leaderboard type.');
        }
    }
};
