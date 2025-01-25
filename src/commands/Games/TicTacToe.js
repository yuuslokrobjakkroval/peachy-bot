const { Command } = require("../../structures");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class TicTacToe extends Command {
  constructor(client) {
    super(client, {
      name: "tictactoe",
      description: {
        content: "Play a game of Tic-Tac-Toe with another user.",
        examples: ["tictactoe @User"],
        usage: "tictactoe <@opponent>",
      },
      category: "games",
      aliases: ["ttt"],
      cooldown: 10,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks", "AddReactions"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user you wish to play against.",
          type: 6,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const ticTacToeMessages = language.locales.get(language.defaultLocale)
      ?.gameMessages?.ticTacToeMessages;

    const opponent = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === ctx.author.id) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.warning)
            .setDescription(ticTacToeMessages.invalidOpponent)
            .setFooter({
              text: generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName
              ),
              iconURL: ctx.author.displayAvatarURL(),
            }),
        ],
      });
    }

    const board = ["⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜"];
    const players = [ctx.author, opponent];
    let currentPlayerIndex = 0;

    const generateActionRow = () => {
      const rows = [];
      for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
          const index = i * 3 + j;
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`${index}`)
              .setLabel(board[index])
              .setStyle(
                board[index] === "⬜"
                  ? ButtonStyle.Secondary
                  : board[index] === "❌"
                  ? ButtonStyle.Danger
                  : ButtonStyle.Primary
              )
              .setDisabled(board[index] !== "⬜") // Disable buttons already clicked
          );
        }
        rows.push(row);
      }
      return rows;
    };

    const checkWinner = () => {
      const winningCombos = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];
      for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (
          board[a] !== "⬜" &&
          board[a] === board[b] &&
          board[a] === board[c]
        ) {
          return board[a];
        }
      }
      return null;
    };

    const isDraw = () => board.every((cell) => cell !== "⬜");

    const gameMessage = await ctx.sendMessage({
      embeds: [
        client
          .embed()
          .setColor(color.main)
          .setDescription(
            `${ticTacToeMessages.startGame.replace(
              "%{player}",
              players[currentPlayerIndex]
            )}`
          )
          .setFooter({
            text: generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName
            ),
            iconURL: ctx.author.displayAvatarURL(),
          }),
      ],
      components: generateActionRow(),
    });

    const collector = gameMessage.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== players[currentPlayerIndex].id) {
        return interaction.reply({
          content: ticTacToeMessages.notYourTurn,
          ephemeral: true,
        });
      }

      const move = parseInt(interaction.customId);
      if (board[move] !== "⬜") {
        return interaction.reply({
          content: ticTacToeMessages.invalidMove,
          ephemeral: true,
        });
      }

      board[move] = currentPlayerIndex === 0 ? "❌" : "⭕";
      currentPlayerIndex = 1 - currentPlayerIndex;

      const winner = checkWinner();
      if (winner) {
        collector.stop("win");
        return gameMessage.edit({
          embeds: [
            client
              .embed()
              .setColor(color.success)
              .setDescription(
                `${ticTacToeMessages.win.replace(
                  "%{winner}",
                  interaction.user.username
                )}`
              ),
          ],
          components: [],
        });
      }

      if (isDraw()) {
        collector.stop("draw");
        return gameMessage.edit({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription(ticTacToeMessages.draw),
          ],
          components: [],
        });
      }

      await interaction.update({
        embeds: [
          client
            .embed()
            .setColor(color.main)
            .setDescription(
              `${ticTacToeMessages.nextTurn.replace(
                "%{player}",
                players[currentPlayerIndex]
              )}`
            ),
        ],
        components: generateActionRow(),
      });
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        gameMessage.edit({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription(ticTacToeMessages.timeout),
          ],
          components: [],
        });
      }
    });
  }
};
