const { Command } = require('../../structures');

module.exports = class Ranking extends Command {
    constructor(client) {
        super(client, {
            name: 'leaderboard',
            description: {
                embed: 'Check top coin, spent coin, and streak of peachy in your Discord guild and globally.',
                examples: ['leaderboard', 'top', 'lb'],
                usage: 'leaderboard <bal|peach|goma|slots|blackjack|coinflip>',
            },
            category: 'rank',
            aliases: ['rank', 'top', 'lb'],
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
                        { name: 'Balance', value: 'balance' },
                        { name: 'Peach', value: 'peach' },
                        { name: 'Goma', value: 'goma' },
                        { name: 'Slots', value: 'slots' },
                        { name: 'Blackjack', value: 'blackjack' },
                        { name: 'Coinflip', value: 'coinflip' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const rankingMessages = language.locales.get(language.defaultLocale)?.economyMessages?.rankingMessages;
        const type = ctx.isInteraction ? ctx.interaction.options.data[0]?.value : args[0] || 'bal';
        const users = await client.utils.userRanking(client, ctx, color, type);

        if (!users.length) {
            return await client.utils.oops(client, ctx, rankingMessages.notFound, color);
        }

        const leaderboardList = users.slice(0, 100).map((user, index) => {
            const position = index + 1;
            const emojiRank = client.utils.emojiRank(emoji, position);
            return `**${emojiRank} ${position}. ${user.username || 'Unknown'}**\n***${client.utils.formatNumber(user.total)}*** ${client.utils.typeRanking(type, emoji)}`;
        });

        const chunks = client.utils.chunk(leaderboardList, 10);
        const pages = chunks.map((chunk, i) => {
            return client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.rank.owner)
                        .replace('%{title}', client.utils.titleRanking(type, rankingMessages))
                        .replace('%{mainRight}', emoji.rank.owner) +
                    `${chunk.join('\n\n')}`)
                .setFooter({
                        text: `${generalMessages.requestedBy.replace('%{username}', ctx.author.displayName)} | Page ${i + 1} of ${chunks.length}`,
                        iconURL: ctx.author.displayAvatarURL()
                    },
                );
        });
        return await client.utils.reactionPaginate(ctx, pages);
    }
};
