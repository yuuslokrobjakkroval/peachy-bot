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
        const rankingMessages = language.locales.get(language.defaultLocale)?.economyMessages?.rankingMessages;
        const type = ctx.isInteraction ? ctx.interaction.options.data[0]?.value : args[0] || 'bal';

        const handleEmoji = (position) => {
            switch (position) {
                case 1: return emoji.rank.one;
                case 2: return emoji.rank.two;
                case 3: return emoji.rank.three;
                case 4: return emoji.rank.four;
                case 5: return emoji.rank.five;
                case 6: return emoji.rank.six;
                case 7: return emoji.rank.seven;
                default: return emoji.rank.eight;
            }
        };

        const createLeaderboard = async (typeKey, streakKey, titleKey) => {
            const users = await Users.find({ [streakKey]: { $gt: 0 } }).sort({ [streakKey]: -1 }).exec();
            if (!users.length) {
                return await client.utils.oops(client, ctx, rankingMessages.typeKey.noUsers, color);
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user?.username || 'Unknown'} Rank: ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user?.[streakKey] || 0)} streaks**\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                return `**${emoji} ${position}. ${user.username || 'Unknown'}**\n**${client.utils.formatNumber(user?.[streakKey])} streaks**`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${emoji.rank.babyOwner} **${rankingMessages.typeKey[titleKey]}** ${emoji.rank.babyOwner}`)
                    .setColor(color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)  // Include user rank message here
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        };

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
                return await client.utils.oops(client, ctx, rankingMessages.bal.noUsers, color);
            }

            const userPosition = users.findIndex(({ userId }) => userId === ctx.author.id) + 1;
            const user = users.find(({ userId }) => userId === ctx.author.id);
            const userRank = `**${user?.username || 'Unknown'} Rank: ${userPosition} ${handleEmoji(userPosition)}**\n**${client.utils.formatNumber(user?.totalCoins || 0)} coins**\n`;

            const leaderboardList = users.slice(0, 100).map((user, index) => {
                const position = index + 1;
                const emoji = handleEmoji(position);
                return `**${emoji} ${position}. ${user.username || 'Unknown'}**\n**${client.utils.formatNumber(user.totalCoins)} coins**`;
            });

            const chunks = client.utils.chunk(leaderboardList, 10);
            const pages = chunks.map((chunk, i) => {
                return client
                    .embed()
                    .setTitle(`${emoji.rank.owner} ${rankingMessages.bal.top} ${emoji.rank.owner}`)
                    .setColor(color.main)
                    .setDescription(`${userRank}\n${chunk.join('\n\n')}`)  // Include user rank message here
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            });

            return await client.utils.reactionPaginate(ctx, pages);
        } else if (type === 'peachy') {
            return await createLeaderboard('peachy', 'peachy.streak', 'topPeach');
        } else if (type === 'goma') {
            return await createLeaderboard('goma', 'goma.streak', 'topGoma');
        } else {
            return await client.utils.oops(client, ctx, rankingMessages.invalidType, color);
        }
    }
};
