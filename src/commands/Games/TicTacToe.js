const { Command } = require('../../structures');

module.exports = class TicTacToe extends Command {
    constructor(client) {
        super(client, {
            name: 'tictactoe',
            description: {
                content: 'Play a game of Tic-Tac-Toe with another user.',
                examples: ['tictactoe @User'],
                usage: 'tictactoe <@opponent>',
            },
            category: 'games',
            aliases: ['ttt'],
            cooldown: 10,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const ticTacToeMessages = language.locales.get(language.defaultLocale)?.gameMessages?.ticTacToeMessages;

        const opponent = ctx.mentions.users.first();
        if (!opponent || opponent.bot || opponent.id === ctx.author.id) {
            return ctx.sendMessage({
                embeds: [
                    client.embed()
                        .setColor(color.warning)
                        .setDescription(ticTacToeMessages.invalidOpponent)
                        .setFooter({
                            text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                            iconURL: ctx.author.displayAvatarURL(),
                        }),
                ],
            });
        }

        const board = ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'];
        const players = [ctx.author, opponent];
        let currentPlayerIndex = 0;

        const renderBoard = () => {
            return `\n${board.slice(0, 3).join('')}\n${board.slice(3, 6).join('')}\n${board.slice(6).join('')}`;
        };

        const checkWinner = () => {
            const winningCombos = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6],
            ];

            for (const combo of winningCombos) {
                const [a, b, c] = combo;
                if (board[a] !== '⬜' && board[a] === board[b] && board[a] === board[c]) {
                    return board[a];
                }
            }
            return null;
        };

        const isDraw = () => {
            return board.every(cell => cell !== '⬜');
        };

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(`${ticTacToeMessages.startGame} ${renderBoard()}`)
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                iconURL: ctx.author.displayAvatarURL(),
            });

        const gameMessage = await ctx.sendMessage({ embeds: [embed] });

        const filter = response => {
            return players.some(player => player.id === response.author.id) && /^[1-9]$/.test(response.content);
        };

        const collector = ctx.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async response => {
            const move = parseInt(response.content) - 1;

            if (board[move] !== '⬜') {
                return response.reply(ticTacToeMessages.invalidMove);
            }

            board[move] = currentPlayerIndex === 0 ? '❌' : '⭕';
            currentPlayerIndex = 1 - currentPlayerIndex;

            const winner = checkWinner();
            if (winner) {
                collector.stop('win');
                return gameMessage.edit({
                    embeds: [
                        client.embed()
                            .setColor(color.success)
                            .setDescription(`${ticTacToeMessages.win.replace('%{winner}', response.author)} ${renderBoard()}`),
                    ],
                });
            }

            if (isDraw()) {
                collector.stop('draw');
                return gameMessage.edit({
                    embeds: [
                        client.embed()
                            .setColor(color.warning)
                            .setDescription(`${ticTacToeMessages.draw} ${renderBoard()}`),
                    ],
                });
            }

            await gameMessage.edit({
                embeds: [
                    client.embed()
                        .setColor(color.main)
                        .setDescription(`${ticTacToeMessages.nextTurn.replace('%{player}', players[currentPlayerIndex])} ${renderBoard()}`),
                ],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                gameMessage.edit({
                    embeds: [
                        client.embed()
                            .setColor(color.warning)
                            .setDescription(ticTacToeMessages.timeout),
                    ],
                });
            }
        });
    }
};
