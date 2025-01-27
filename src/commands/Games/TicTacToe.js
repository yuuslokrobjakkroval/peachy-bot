const { Command } = require("../../structures");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class TicTacToe extends Command {
  constructor(client) {
    super(client, {
      name: "tictactoe",
      description: {
        content: "𝑷𝒍𝒂𝒚 𝒂 𝒈𝒂𝒎𝒆 𝒐𝒇 𝑻𝒊𝒄-𝑻𝒂𝒄-𝑻𝒐𝒆 𝒘𝒊𝒕𝒉 𝒂𝒏𝒐𝒕𝒉𝒆𝒓 𝒖𝒔𝒆𝒓.",
        examples: ["𝒕𝒊𝒄𝒕𝒂𝒄𝒕𝒐𝒆 @𝑼𝒔𝒆𝒓 𝒂𝒎𝒐𝒖𝒏𝒕"],
        usage: "𝒕𝒊𝒄𝒕𝒂𝒄𝒕𝒐𝒆 <@𝒐𝒑𝒑𝒐𝒏𝒆𝒏𝒕> [𝒂𝒎𝒐𝒖𝒏𝒕]",
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
        {
          name: "amount",
          description: "The amount for bet to play game.",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const ticTacToeMessages = language.locales.get(language.defaultLocale)?.gameMessages?.ticTacToeMessages;

    const opponent = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.users.first();

    const playerOne = await Users.findOne({ userId: ctx.author.id });
    const playerTwo =await Users.findOne({ userId: opponent.id });

    const amount = client.utils.formatBalance(
        client,
        ctx,
        color,
        playerOne.balance.coin,
        ctx.isInteraction
            ? ctx.interaction.options.getString("amount")
            : args[1] || 1,
        generalMessages.invalidAmount
    );

    if (typeof amount === "object") return;

    if (!opponent || opponent.bot || opponent.id === ctx.author.id) {
      return ctx.sendMessage({
        embeds: [
          client.embed()
              .setColor(color.warning)
              .setDescription(ticTacToeMessages.invalidOpponent)
              .setFooter({
                text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName),
                iconURL: ctx.author.displayAvatarURL(),
              }),
        ],
      });
    }

    if (playerOne.balance.coin < amount || playerTwo.balance.coin < amount) {
      return await client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
    }

    // Step 1: Ask opponent for confirmation
    const confirmEmbed = client.embed()
        .setColor(color.main)
        .setDescription(ticTacToeMessages.confirmGame.replace("%{opponent}", opponent.displayName))
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName),
          iconURL: ctx.author.displayAvatarURL(),
        });

    const confirmButton = client.utils.fullOptionButton('confirm', '', ticTacToeMessages.confirmButton, 3)
    const denyButton = client.utils.fullOptionButton('deny', '', ticTacToeMessages.denyButton, 4)
    const row = client.utils.createButtonRow(confirmButton, denyButton)

    const confirmMessage = await ctx.channel.send({ embeds: [confirmEmbed], components: [row]});
    const filter = (button) => button.user.id === opponent.id;
    const collector = confirmMessage.createMessageComponentCollector({
      filter,
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "deny") {
        return interaction.reply({
          content: ticTacToeMessages.opponentDenied,
          flags: 64,
        });
      }

      if (interaction.customId === "confirm") {
        // Step 2: Start the game
        collector.stop("confirmed");
        playerOne.balance.coin -= parseInt(amount);
        playerTwo.balance.coin -= parseInt(amount);
        await Promise.all([
          Users.updateOne({ userId: playerOne.userId }, { "balance.coin": playerOne.balance.coin }).exec(),
          Users.updateOne({ userId: playerTwo.userId }, { "balance.coin": playerTwo.balance.coin }).exec(),
        ]);
        confirmMessage.delete();
        const board = Array(9).fill(globalEmoji.tictactoe.milk);
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
                  .setStyle(board[index] === globalEmoji.tictactoe.milk ? 2 : board[index] === globalEmoji.tictactoe.peach ? 4 : 1)
                  .setDisabled(board[index] !== globalEmoji.tictactoe.milk)
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
            if (board[a] !== globalEmoji.tictactoe.milk && board[a] === board[b] && board[a] === board[c]) {
              return board[a];
            }
          }
          return null;
        };

        const isDraw = () => board.every((cell) => cell !== globalEmoji.tictactoe.milk);


        const gameEmbed = client.embed()
            .setColor(color.main)
            .setDescription(
                ticTacToeMessages.startGame
                    .replace("%{player}", players[0].displayName)
                    .replace("%{playerEmoji}", globalEmoji.tictactoe.peach)
                    .replace("%{opponent}", players[1].displayName)
                    .replace("%{opponentEmote}", globalEmoji.tictactoe.goma)
            )
            .setFooter({
              text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName),
              iconURL: ctx.author.displayAvatarURL(),
            });
        const gameMessage = await ctx.channel.send({embeds: [gameEmbed], components: generateActionRow(),
        });

        const gameCollector = gameMessage.createMessageComponentCollector({ time: 120000 });

        gameCollector.on("collect", async (interaction) => {
          if (interaction.user.id !== players[currentPlayerIndex].id) {
            return interaction.reply({ content: ticTacToeMessages.notYourTurn, flags: 64 });
          }

          const move = parseInt(interaction.customId);
          board[move] = currentPlayerIndex === 0 ? globalEmoji.tictactoe.peach : globalEmoji.tictactoe.goma;
          currentPlayerIndex = 1 - currentPlayerIndex;

          const winner = checkWinner();
          if (winner) {
            gameCollector.stop("win");
            // Find the winner and loser
            const userWinner = await Users.findOne({ userId: interaction.user.id });
            userWinner.balance.coin += parseInt(amount * 2);
            await Users.updateOne(
                { userId: userWinner.userId },
                { "balance.coin": userWinner.balance.coin }
            ).exec();
            const winnerEmbed = client.embed().setColor(color.success).setDescription(ticTacToeMessages.win.replace("%{winner}", interaction.user.displayName))
            return gameMessage.edit({ embeds: [winnerEmbed], components: [] });
          } else if (isDraw()) {
            gameCollector.stop("draw");
            playerOne.balance.coin += parseInt(amount);
            playerTwo.balance.coin += parseInt(amount);

            await Promise.all([
              Users.updateOne({ userId: playerOne.userId }, { "balance.coin": playerOne.balance.coin }).exec(),
              Users.updateOne({ userId: playerTwo.userId }, { "balance.coin": playerTwo.balance.coin }).exec(),
            ]);
            const drawEmbed = client.embed().setColor(color.blue).setDescription(ticTacToeMessages.draw)
            return gameMessage.edit({ embeds: [drawEmbed], components: [] });
          } else {

            const playerEmbed = client.embed().setColor(color.main).setDescription(ticTacToeMessages.nextTurn.replace("%{player}", players[currentPlayerIndex]))
            await interaction.update({ embeds: [playerEmbed], components: generateActionRow() });
          }
        });

        gameCollector.on("end", (_, reason) => {
          if (reason === "time") {
            const endEmbed = client.embed().setColor(color.warning).setDescription(ticTacToeMessages.timeout);
            return gameMessage.edit({ embeds: [endEmbed], components: [] });
          }
        });
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        const endEmbed = client.embed().setColor(color.warning).setDescription(ticTacToeMessages.timeout);
        return confirmMessage.edit({ embeds: [endEmbed], components: [] });
      }
    });
  }
};
