// src/commands/games/tienlen.js
const { Command } = require("../../structures/index.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const maxAmount = 250000;
const deck = Array.from({ length: 52 }, (_, i) => i + 1); // Your 52-card deck
const activeGames = new Map();

const suits = ['♠', '♣', '♦', '♥'];
const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const suitOrder = { '♥': 4, '♦': 3, '♣': 2, '♠': 1 }; // Tiến Lên suit ranking

// Card utility functions
const cardUtils = {
  // Convert deck index (1-52) to rank and suit
  cardToString: (cardIndex) => {
    const suitIndex = Math.floor((cardIndex - 1) / 13);
    const rankIndex = (cardIndex - 1) % 13;
    return { rank: ranks[rankIndex], suit: suits[suitIndex] };
  },
  // Shuffle deck
  shuffleDeck: (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },
  // Compare cards (2 > A > K > ... > 3, Hearts > Diamonds > Clubs > Spades)
  compareCards: (card1, card2) => {
    const rank1 = ranks.indexOf(card1.rank);
    const rank2 = ranks.indexOf(card2.rank);
    if (rank1 !== rank2) return rank1 - rank2; // Higher rank index = stronger
    return suitOrder[card1.suit] - suitOrder[card2.suit]; // Higher suit = stronger
  },
  // Validate play (simplified for singles, pairs, sequences)
  isValidPlay: (cards, currentPlay, playType, playerHand) => {
    if (!cards.length || !playerHand.some(h => cards.every(c => h.rank === c.rank && h.suit === c.suit))) return false;
    if (!currentPlay.length && cards[0].rank === '3' && cards[0].suit === '♠') return true; // 3♠ starts
    if (cards.length !== currentPlay.length && currentPlay.length > 0) return false;

    if (playType === 'single') {
      return cards.length === 1 && (!currentPlay.length || cardUtils.compareCards(cards[0], currentPlay[0]) > 0);
    } else if (playType === 'pair') {
      if (cards.length !== 2 || cards[0].rank !== cards[1].rank) return false;
      return !currentPlay.length || cardUtils.compareCards(cards[0], currentPlay[0]) > 0;
    } else if (playType === 'sequence') {
      if (cards.length < 3) return false;
      const indices = cards.map(c => ranks.indexOf(c.rank)).sort((a, b) => a - b);
      for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i - 1] + 1) return false; // Must be consecutive
      }
      return !currentPlay.length || cardUtils.compareCards(cards[cards.length - 1], currentPlay[currentPlay.length - 1]) > 0;
    }
    return false;
  },
  // Generate game embed
  generateEmbed: (client, color, emoji, gameState, generalMessages, tienlenMessages) => {
    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle(tienlenMessages.title.replace("%{mainLeft}", emoji.mainLeft).replace("%{mainRight}", emoji.mainRight))
      .setDescription(
        `Current player: <@${gameState.players[gameState.currentPlayer].userId}>\n` +
        `Current play: ${gameState.currentPlay.length ? gameState.currentPlay.map(c => `${c.rank}${c.suit}`).join(', ') : 'None'}\n` +
        `Passes: ${gameState.passes}`
      )
      .setFooter({
        text: generalMessages.pleaseStartAgain,
        iconURL: client.user.displayAvatarURL(),
      });
    return embed;
  },
};

module.exports = class TienLen extends Command {
  constructor(client) {
    super(client, {
      name: "tienlen",
      description: {
        content: "Play Tiến Lên with friends",
        examples: ["tienlen start", "tienlen play 5S 6S 7S", "tienlen pass"],
        usage: "tienlen <start|play <cards>|pass>",
      },
      category: "gambling",
      aliases: ["tl"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "start",
          description: "Start a new Tiến Lên game",
          type: 1, // Subcommand
        },
        {
          name: "play",
          description: "Play cards (e.g., 5S 6S 7S)",
          type: 1,
          options: [
            {
              name: "cards",
              description: "Cards to play (e.g., 5S 6S 7S)",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "pass",
          description: "Pass your turn",
          type: 1,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const tienlenMessages = language.locales.get(language.defaultLocale)?.gamblingMessages?.tienlenMessages || {
      title: "%{mainLeft} Tiến Lên %{mainRight}",
      hit: "Play Cards",
      stand: "Pass",
      invalidPlay: "Invalid play! Try again.",
      gameStarted: "Game started! Check your DMs for your hand.",
      gameEnded: "%{winner} wins!",
    };
    const interaction = ctx.isInteraction ? ctx.interaction : null;
    const userId = ctx.author.id;

    try {
      const user = await client.utils.getUser(userId);
      if (!user) return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);

      if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
        const activeCommand = user.validation.isKlaKlouk ? "Kla Klouk" : "Multiple Transfer";
        return client.utils.sendErrorMessage(client, ctx, `You have already started the ${activeCommand} event.`, color);
      }

      if (activeGames.has(ctx.author.id)) {
        return client.utils.sendErrorMessage(client, ctx, generalMessages.alreadyInGame, color);
      }

      const subcommand = ctx.isInteraction ? interaction.options.getSubcommand() : args[0];

      if (subcommand === "start") {
        return startGame(client, ctx, color, emoji, generalMessages, tienlenMessages);
      } else if (subcommand === "play") {
        return playCards(client, ctx, args, color, emoji, generalMessages, tienlenMessages);
      } else if (subcommand === "pass") {
        return passTurn(client, ctx, color, emoji, generalMessages, tienlenMessages);
      } else {
        return client.utils.sendErrorMessage(client, ctx, generalMessages.invalidCommand, color);
      }
    } catch (err) {
      console.error("Error in tienlen command:", err);
      client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
    }
  }
};

async function startGame(client, ctx, color, emoji, generalMessages, tienlenMessages) {
  const guildId = ctx.guild.id;
  const channelId = ctx.channel.id;
  const userId = ctx.author.id;

  // Check for existing game in channel
  if (activeGames.has(`${guildId}-${channelId}`)) {
    return client.utils.sendErrorMessage(client, ctx, "A Tiến Lên game is already active in this channel!", color);
  }

  // Initialize game (simplified: 2 players for now, extend later)
  const players = [{ userId, hand: [] }]; // Add logic to collect more players
  const tdeck = cardUtils.shuffleDeck(deck.slice(0));
  const hands = Array(2).fill().map(() => tdeck.splice(0, 13).map(cardUtils.cardToString));
  const gameState = {
    guildId,
    channelId,
    players: players.map((p, i) => ({ userId: p.userId, hand: hands[i] })),
    currentPlayer: 0,
    currentPlay: [],
    playType: null,
    passes: 0,
  };

  // Find player with 3♠ to start
  gameState.players.forEach((p, i) => {
    if (p.hand.some(c => c.rank === '3' && c.suit === '♠')) gameState.currentPlayer = i;
  });

  activeGames.set(`${guildId}-${channelId}`, gameState);

  // DM players their hands
  for (const player of gameState.players) {
    const user = await client.users.fetch(player.userId);
    const hand = player.hand.map(c => `${c.rank}${c.suit}`).join(', ');
    await user.send(`Your Tiến Lên hand: ${hand}`);
  }

  const embed = cardUtils.generateEmbed(client, color, emoji, gameState, generalMessages, tienlenMessages);
  const row = createButtonRow(client, tienlenMessages);
  await ctx.sendMessage({ embeds: [embed], components: [row] });
}

async function playCards(client, ctx, args, color, emoji, generalMessages, tienlenMessages) {
  const guildId = ctx.guild.id;
  const channelId = ctx.channel.id;
  const gameKey = `${guildId}-${channelId}`;
  const gameState = activeGames.get(gameKey);
  if (!gameState) return client.utils.sendErrorMessage(client, ctx, "No active Tiến Lên game in this channel!", color);
  if (gameState.players[gameState.currentPlayer].userId !== ctx.author.id) {
    return client.utils.sendErrorMessage(client, ctx, "It's not your turn!", color);
  }

  const cardsInput = ctx.isInteraction ? ctx.interaction.options.getString("cards").split(' ') : args.slice(1);
  const cards = cardsInput.map(c => ({
    rank: c.slice(0, -1),
    suit: c.slice(-1),
  }));
  const playType = cards.length === 1 ? 'single' : cards.length === 2 && cards[0].rank === cards[1].rank ? 'pair' : 'sequence';

  if (!cardUtils.isValidPlay(cards, gameState.currentPlay, playType, gameState.players[gameState.currentPlayer].hand)) {
    return client.utils.sendErrorMessage(client, ctx, tienlenMessages.invalidPlay, color);
  }

  // Update game state
  const player = gameState.players[gameState.currentPlayer];
  player.hand = player.hand.filter(h => !cards.some(c => c.rank === h.rank && c.suit === h.suit));
  gameState.currentPlay = cards;
  gameState.playType = playType;
  gameState.passes = 0;
  gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;

  // Check for win
  if (player.hand.length === 0) {
    activeGames.delete(gameKey);
    const embed = client
      .embed()
      .setColor(color.success)
      .setDescription(tienlenMessages.gameEnded.replace("%{winner}", `<@${player.userId}>`));
    return ctx.sendMessage({ embeds: [embed], components: [] });
  }

  // Update message
  const embed = cardUtils.generateEmbed(client, color, emoji, gameState, generalMessages, tienlenMessages);
  const row = createButtonRow(client, tienlenMessages);
  await ctx.sendMessage({ embeds: [embed], components: [row] });
}

async function passTurn(client, ctx, color, emoji, generalMessages, tienlenMessages) {
  const guildId = ctx.guild.id;
  const channelId = ctx.channel.id;
  const gameKey = `${guildId}-${channelId}`;
  const gameState = activeGames.get(gameKey);
  if (!gameState) return client.utils.sendErrorMessage(client, ctx, "No active Tiến Lên game in this channel!", color);
  if (gameState.players[gameState.currentPlayer].userId !== ctx.author.id) {
    return client.utils.sendErrorMessage(client, ctx, "It's not your turn!", color);
  }

  gameState.passes += 1;
  gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
  if (gameState.passes >= gameState.players.length - 1) {
    gameState.currentPlay = [];
    gameState.playType = null;
    gameState.passes = 0;
  }

  const embed = cardUtils.generateEmbed(client, color, emoji, gameState, generalMessages, tienlenMessages);
  const row = createButtonRow(client, tienlenMessages);
  await ctx.sendMessage({ embeds: [embed], components: [row] });
}

function createButtonRow(client, tienlenMessages) {
  const playButton = client.utils.fullOptionButton("play", "", tienlenMessages.hit, ButtonStyle.Primary);
  const passButton = client.utils.fullOptionButton("pass", "", tienlenMessages.stand, ButtonStyle.Secondary);
  return client.utils.createButtonRow(playButton, passButton);
}