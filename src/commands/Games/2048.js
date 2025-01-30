const { Command } = require("../../structures");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class Game2048 extends Command {
  constructor(client) {
    super(client, {
      name: "2048",
      description: {
        content: "Play a game of 2048 using Discord buttons!",
        examples: ["2048"],
        usage: "2048",
      },
      category: "games",
      aliases: ["twentyfortyeight"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks", "AddReactions"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx) {
    let board = this.initializeBoard();

    // Create directional buttons for the game
    const buttons = [
      new ButtonBuilder().setCustomId("up").setLabel("⬆️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("left").setLabel("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("down").setLabel("⬇️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("right").setLabel("➡️").setStyle(ButtonStyle.Primary)
    ];

    // Arrange buttons in a row
    const row = new ActionRowBuilder().addComponents(buttons);
    const message = await ctx.sendMessage({ content: this.renderBoard(board), components: [row] });

    // Create a collector to listen for button interactions
    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.author.id) {
        return interaction.reply({ content: "You are not playing this game!", ephemeral: true });
      }

      // Update the board based on the move
      board = this.move(board, interaction.customId);
      if (this.isGameOver(board)) {
        collector.stop("game_over");
      }

      // Update the message with the new board state
      await interaction.update({ content: this.renderBoard(board), components: [row] });
    });

    collector.on("end", (_, reason) => {
      if (reason === "game_over") {
        ctx.sendMessage({ content: "Game Over!", components: [] });
      }
    });
  }

  // Initialize a 4x4 board with two starting tiles
  initializeBoard() {
    let board = Array.from({ length: 4 }, () => Array(4).fill(0));
    this.spawnTile(board);
    this.spawnTile(board);
    return board;
  }

  // Spawn a new tile (2 or 4) at a random empty position
  spawnTile(board) {
    let emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length > 0) {
      let [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  // Handle tile movement and merging based on direction
  move(board, direction) {
    let moved = false;
    let newBoard = board.map(row => [...row]);

    // Helper function to shift and merge a row/column
    const shift = (row) => {
      let filtered = row.filter(val => val !== 0); // Remove empty spaces
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2; // Merge equal tiles
          filtered[i + 1] = 0;
          moved = true;
        }
      }
      return filtered.filter(val => val !== 0).concat(Array(4).fill(0)).slice(0, 4);
    };

    if (direction === "left") {
      newBoard = newBoard.map(row => shift(row));
    } else if (direction === "right") {
      newBoard = newBoard.map(row => shift(row.reverse()).reverse());
    } else if (direction === "up") {
      for (let c = 0; c < 4; c++) {
        let col = newBoard.map(row => row[c]);
        let newCol = shift(col);
        for (let r = 0; r < 4; r++) newBoard[r][c] = newCol[r];
      }
    } else if (direction === "down") {
      for (let c = 0; c < 4; c++) {
        let col = newBoard.map(row => row[c]).reverse();
        let newCol = shift(col).reverse();
        for (let r = 0; r < 4; r++) newBoard[r][c] = newCol[r];
      }
    }

    if (moved) this.spawnTile(newBoard);
    return newBoard;
  }

  // Check if the game is over (no moves left)
  isGameOver(board) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) return false; // Empty tile exists
        if (c < 3 && board[r][c] === board[r][c + 1]) return false; // Mergeable horizontally
        if (r < 3 && board[r][c] === board[r + 1][c]) return false; // Mergeable vertically
      }
    }
    return true; // No moves left
  }

  // Convert board state into a visually readable format for Discord
  renderBoard(board) {
    return board.map(row => row.map(val => (val === 0 ? "⬛" : `**${val}**`)).join(" ")).join("\n");
  }
};