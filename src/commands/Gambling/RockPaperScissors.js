const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const maxAmount = 250000;

module.exports = class RockPaperScissors extends Command {
  constructor(client) {
    super(client, {
      name: "rockpaperscissors",
      description: {
        content:
          "Play rock paper scissors against a bot or challenge another player!",
        examples: ["rps 1000", "rps 1000 bot", "rps 5000 @user"],
        usage: "rps <amount> [bot/@user]",
      },
      category: "gambling",
      aliases: ["rps", "rockpaper"],
      cooldown: 3,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "amount",
          description: "The amount you want to bet.",
          type: 3,
          required: true,
        },
        {
          name: "opponent",
          description:
            "Choose 'bot' or mention a user to challenge (defaults to bot)",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const rpsMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.rpsMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);
      const { coin } = user.balance;

      // Check if user is already in a game
      if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
        const activeCommand = user.validation.isKlaKlouk
          ? "Kla Klouk"
          : "Multiple Transfer";
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You have already started the ${activeCommand} event. Please finish it before using this command.`,
          color
        );
      }

      if (coin < 1) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.zeroBalance,
          color
        );
      }

      // Parse amount
      let amount = ctx.isInteraction
        ? ctx.interaction.options.getString("amount") || 1
        : args[0] || 1;

      if (amount.toString().startsWith("-")) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(generalMessages.invalidAmount),
          ],
        });
      }

      if (
        isNaN(amount) ||
        amount <= 0 ||
        amount.toString().includes(".") ||
        amount.toString().includes(",")
      ) {
        const amountMap = { all: coin, half: Math.ceil(coin / 2) };
        if (amount in amountMap) {
          amount = amountMap[amount];
        } else {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            generalMessages.invalidAmount,
            color
          );
        }
      }

      const betAmount = Number.parseInt(Math.min(amount, coin, maxAmount));

      if (betAmount > coin) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You don't have enough coins! You have **${client.utils.formatNumber(coin)}** ${emoji.coin} but need **${client.utils.formatNumber(betAmount)}** ${emoji.coin}`,
          color
        );
      }

      // Parse opponent - default to "bot" if not specified
      let opponent = ctx.isInteraction
        ? ctx.interaction.options.getString("opponent") || "bot"
        : args[1] || "bot";

      // For slash commands, opponent is required, so no need to check
      // For regular commands, we default to "bot" if not provided

      // Check if opponent is bot or user
      const isBot = opponent.toLowerCase() === "bot";
      let targetUser = null;
      let targetMember = null;

      if (!isBot) {
        // Try to find the mentioned user
        if (ctx.isInteraction) {
          // For slash commands, we need to parse the mention manually
          const userMatch = opponent.match(/<@!?(\d+)>/);
          if (userMatch) {
            targetMember = ctx.guild.members.cache.get(userMatch[1]);
          }
        } else {
          // For regular commands
          targetMember =
            ctx.message.mentions.members.first() ||
            ctx.guild.members.cache.get(opponent);
        }

        if (!targetMember) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            rpsMessages.userNotFound ||
              "User not found. Please mention a valid user or use 'bot'.",
            color
          );
        }

        if (targetMember.user.bot) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            generalMessages.botMention,
            color
          );
        }

        if (targetMember.id === ctx.author.id) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            rpsMessages.selfChallenge || "You cannot challenge yourself!",
            color
          );
        }

        // Get target user data
        targetUser = await client.utils.getUser(targetMember.id);
        if (targetUser.balance.coin < betAmount) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            rpsMessages.opponentInsufficientFunds ||
              `${targetMember.displayName} doesn't have enough coins for this bet!`,
            color
          );
        }
      }

      if (isBot) {
        return this.playAgainstBot(
          client,
          ctx,
          user,
          betAmount,
          color,
          emoji,
          generalMessages,
          rpsMessages
        );
      } else {
        return this.playAgainstPlayer(
          client,
          ctx,
          user,
          targetUser,
          targetMember,
          betAmount,
          color,
          emoji,
          generalMessages,
          rpsMessages
        );
      }
    } catch (error) {
      console.error("Rock Paper Scissors Error:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while starting the game. Please try again.",
        color
      );
    }
  }

  async playAgainstBot(
    client,
    ctx,
    user,
    betAmount,
    color,
    emoji,
    generalMessages,
    rpsMessages
  ) {
    // Create game buttons
    const gameRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rps_rock")
        .setLabel("👊 Rock")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("rps_paper")
        .setLabel("🖐 Paper")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("rps_scissors")
        .setLabel("✌ Scissors")
        .setStyle(ButtonStyle.Primary)
    );

    const gameEmbed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
          .replace("%{mainRight}", emoji.mainRight) +
          (rpsMessages.botGameDescription
            .replace("%{coin}", `**${client.utils.formatNumber(betAmount)}**`)
            .replace("%{coinEmote}", emoji.coin) ||
            `You're playing against the bot!\nBet: **${client.utils.formatNumber(betAmount)}** ${emoji.coin}\n\nChoose your move:`)
      )
      .setFooter({
        text: generalMessages.gameInProgress.replace(
          "%{user}",
          ctx.author.displayName
        ),
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    const message = await ctx.sendMessage({
      embeds: [gameEmbed],
      components: [gameRow],
    });

    const collector = message.createMessageComponentCollector({
      time: 30000, // 30 seconds timeout
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.author.id) {
        return interaction.reply({
          content: generalMessages.notForYou || "This game is not for you!",
          flags: 64,
        });
      }

      const playerChoice = interaction.customId.split("_")[1];
      const botChoices = ["rock", "paper", "scissors"];
      const botChoice =
        botChoices[Math.floor(Math.random() * botChoices.length)];

      const result = this.determineWinner(playerChoice, botChoice);

      // Update user balance
      const { coin } = user.balance;
      let newBalance = coin;
      let winAmount = 0;

      if (result === "win") {
        winAmount = betAmount;
        newBalance = coin + winAmount;
      } else if (result === "lose") {
        newBalance = coin - betAmount;
      }
      // Tie = no change in balance

      user.balance.coin = newBalance;
      await user.save();

      // Create result embed
      const resultEmbed = client
        .embed()
        .setColor(
          result === "win"
            ? color.success
            : result === "lose"
              ? color.danger
              : color.warning
        )
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
            .replace("%{mainRight}", emoji.mainRight) +
            this.formatResult(
              playerChoice,
              botChoice,
              result,
              betAmount,
              winAmount,
              emoji,
              rpsMessages
            )
        )
        .setFooter({
          text: generalMessages.gameOver.replace(
            "%{user}",
            ctx.author.displayName
          ),
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.update({
        embeds: [resultEmbed],
        components: [],
      });

      collector.stop();
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // Timeout - disable buttons
        const timeoutEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
              .replace("%{mainRight}", emoji.mainRight) +
              (rpsMessages.timeout || "Game timed out! No coins were lost.")
          )
          .setFooter({
            text: generalMessages.gameOver.replace(
              "%{user}",
              ctx.author.displayName
            ),
            iconURL: ctx.author.displayAvatarURL(),
          });

        try {
          await message.edit({
            embeds: [timeoutEmbed],
            components: [],
          });
        } catch (error) {
          console.error("Error updating timeout message:", error);
        }
      }
    });
  }

  async playAgainstPlayer(
    client,
    ctx,
    user,
    targetUser,
    targetMember,
    betAmount,
    color,
    emoji,
    generalMessages,
    rpsMessages
  ) {
    // Create challenge embed for the target
    const challengeEmbed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
          .replace("%{mainRight}", emoji.mainRight) +
          (rpsMessages.challengeDescription
            .replace("%{challenger}", ctx.author.displayName)
            .replace("%{target}", targetMember.displayName)
            .replace("%{coin}", `**${client.utils.formatNumber(betAmount)}**`)
            .replace("%{coinEmote}", emoji.coin)
            .replace("%{target}", targetMember.displayName) ||
            `${ctx.author.displayName} has challenged ${targetMember.displayName} to Rock Paper Scissors!\n\nBet: **${client.utils.formatNumber(betAmount)}** ${emoji.coin}\n\n${targetMember.displayName}, do you accept?`)
      )
      .setFooter({
        text: `Challenge from ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    const challengeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("challenge_accept")
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("challenge_decline")
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
    );

    const challengeMessage = await ctx.sendMessage({
      content: `${targetMember}`,
      embeds: [challengeEmbed],
      components: [challengeRow],
    });

    const challengeCollector = challengeMessage.createMessageComponentCollector(
      {
        time: 60000, // 60 seconds to accept
      }
    );

    challengeCollector.on("collect", async (interaction) => {
      if (interaction.user.id !== targetMember.id) {
        return interaction.reply({
          content:
            generalMessages.notForYou || "This challenge is not for you!",
          flags: 64,
        });
      }

      if (interaction.customId === "challenge_decline") {
        const declineEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
              .replace("%{mainRight}", emoji.mainRight) +
              (rpsMessages.challengeDeclined.replace(
                "%{target}",
                targetMember.displayName
              ) || `${targetMember.displayName} declined the challenge.`)
          );

        await interaction.update({
          content: "",
          embeds: [declineEmbed],
          components: [],
        });
        challengeCollector.stop();
        return;
      }

      if (interaction.customId === "challenge_accept") {
        challengeCollector.stop();
        await this.startPvPGame(
          client,
          ctx,
          interaction,
          user,
          targetUser,
          targetMember,
          betAmount,
          color,
          emoji,
          generalMessages,
          rpsMessages
        );
      }
    });

    challengeCollector.on("end", async (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
              .replace("%{mainRight}", emoji.mainRight) +
              (rpsMessages.challengeTimeout.replace(
                "%{target}",
                targetMember.displayName
              ) ||
                `Challenge timed out. ${targetMember.displayName} didn't respond in time.`)
          );

        try {
          await challengeMessage.edit({
            content: "",
            embeds: [timeoutEmbed],
            components: [],
          });
        } catch (error) {
          console.error("Error updating challenge timeout:", error);
        }
      }
    });
  }

  async startPvPGame(
    client,
    ctx,
    interaction,
    user,
    targetUser,
    targetMember,
    betAmount,
    color,
    emoji,
    generalMessages,
    rpsMessages
  ) {
    const gameChoices = new Map();

    const gameEmbed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
          .replace("%{mainRight}", emoji.mainRight) +
          (rpsMessages.pvpGameDescription
            .replace("%{player1}", `**${ctx.author.displayName}**`)
            .replace("%{player2}", `**${targetMember.displayName}**`)
            .replace("%{coin}", `**${client.utils.formatNumber(betAmount)}**`)
            .replace("%{coinEmote}", emoji.coin) ||
            `**${ctx.author.displayName}** vs **${targetMember.displayName}**\n\nBet: **${client.utils.formatNumber(betAmount)}** ${emoji.coin} each\n\nBoth players choose your moves! Choices are hidden until both have selected.`)
      )
      .setFooter({
        text: "Waiting for both players to choose...",
        iconURL: ctx.guild.iconURL(),
      })
      .setTimestamp();

    const gameRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pvp_rock")
        .setLabel("👊 Rock")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pvp_paper")
        .setLabel("🖐 Paper")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pvp_scissors")
        .setLabel("✌ Scissors")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({
      content: "",
      embeds: [gameEmbed],
      components: [gameRow],
    });

    const gameCollector = interaction.message.createMessageComponentCollector({
      time: 60000, // 60 seconds for both to choose
    });

    gameCollector.on("collect", async (gameInteraction) => {
      const playerId = gameInteraction.user.id;

      if (playerId !== ctx.author.id && playerId !== targetMember.id) {
        return gameInteraction.reply({
          content: generalMessages.notForYou || "This game is not for you!",
          flags: 64,
        });
      }

      if (gameChoices.has(playerId)) {
        return gameInteraction.reply({
          content:
            rpsMessages.alreadyChosen || "You have already made your choice!",
          flags: 64,
        });
      }

      const choice = gameInteraction.customId.split("_")[1];
      gameChoices.set(playerId, choice);

      await gameInteraction.reply({
        content:
          rpsMessages.choiceMade.replace("%{choice}", choice) ||
          `You chose **${choice}**! Waiting for the other player...`,
        flags: 64,
      });

      // Check if both players have chosen
      if (gameChoices.size === 2) {
        gameCollector.stop();
        await this.resolvePvPGame(
          client,
          ctx,
          gameInteraction.message,
          user,
          targetUser,
          targetMember,
          betAmount,
          gameChoices,
          color,
          emoji,
          generalMessages,
          rpsMessages
        );
      }
    });

    gameCollector.on("end", async (collected) => {
      if (gameChoices.size < 2) {
        const timeoutEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
              .replace("%{mainRight}", emoji.mainRight) +
              (rpsMessages.pvpTimeout ||
                "Game timed out! Not all players made their choices. No coins were lost.")
          );

        try {
          await interaction.message.edit({
            embeds: [timeoutEmbed],
            components: [],
          });
        } catch (error) {
          console.error("Error updating PvP timeout:", error);
        }
      }
    });
  }

  async resolvePvPGame(
    client,
    ctx,
    message,
    user,
    targetUser,
    targetMember,
    betAmount,
    gameChoices,
    color,
    emoji,
    generalMessages,
    rpsMessages
  ) {
    const player1Choice = gameChoices.get(ctx.author.id);
    const player2Choice = gameChoices.get(targetMember.id);

    const result = this.determineWinner(player1Choice, player2Choice);

    // Update balances
    let winnerText = "";
    let player1NewBalance = user.balance.coin;
    let player2NewBalance = targetUser.balance.coin;

    if (result === "win") {
      // Player 1 wins
      player1NewBalance += betAmount;
      player2NewBalance -= betAmount;
      winnerText = `${ctx.author.displayName} wins!`;
    } else if (result === "lose") {
      // Player 2 wins
      player1NewBalance -= betAmount;
      player2NewBalance += betAmount;
      winnerText = `${targetMember.displayName} wins!`;
    } else {
      // Tie
      winnerText = "It's a tie!";
    }

    user.balance.coin = player1NewBalance;
    targetUser.balance.coin = player2NewBalance;

    await Promise.all([user.save(), targetUser.save()]);

    // Create result embed
    const resultEmbed = client
      .embed()
      .setColor(result === "tie" ? color.warning : color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", rpsMessages.title || "ROCK PAPER SCISSORS")
          .replace("%{mainRight}", emoji.mainRight) +
          this.formatPvPResult(
            ctx.author.displayName,
            targetMember.displayName,
            player1Choice,
            player2Choice,
            result,
            betAmount,
            winnerText,
            emoji,
            rpsMessages
          )
      )
      .setFooter({
        text: generalMessages.gameOver.replace("%{user}", "Game"),
        iconURL: ctx.guild.iconURL(),
      })
      .setTimestamp();

    await message.edit({
      embeds: [resultEmbed],
      components: [],
    });
  }

  determineWinner(choice1, choice2) {
    if (choice1 === choice2) return "tie";

    const winConditions = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    };

    return winConditions[choice1] === choice2 ? "win" : "lose";
  }

  formatResult(
    playerChoice,
    botChoice,
    result,
    betAmount,
    winAmount,
    emoji,
    rpsMessages
  ) {
    const choiceEmojis = {
      rock: "👊",
      paper: "🖐",
      scissors: "✌",
    };

    let resultText = "";
    let balanceChange = "";

    if (result === "win") {
      resultText = rpsMessages.playerWin || "You won!";
      balanceChange = `**${winAmount.toLocaleString()}** ${emoji.coin}`;
    } else if (result === "lose") {
      resultText = rpsMessages.playerLose || "You lost!";
      balanceChange = `**${betAmount.toLocaleString()}** ${emoji.coin}`;
    } else {
      resultText = rpsMessages.tie || "It's a tie!";
      balanceChange = "**0** " + emoji.coin;
    }

    return `Your choice: ${choiceEmojis[playerChoice]} **${playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1)}**\nBot's choice: ${choiceEmojis[botChoice]} **${botChoice.charAt(0).toUpperCase() + botChoice.slice(1)}**\n\n${resultText}\nBalance change: ${balanceChange}`;
  }

  formatPvPResult(
    player1Name,
    player2Name,
    choice1,
    choice2,
    result,
    betAmount,
    winnerText,
    emoji,
    rpsMessages 
  ) {
    const choiceEmojis = {
      rock: "👊",
      paper: "🖐",
      scissors: "✌",
    };

    let balanceChange = "";
    if (result !== "tie") {
      balanceChange = `\n\nPot: **${(betAmount * 2).toLocaleString()}** ${emoji.coin}`;
    }

    return `**${player1Name}**: ${choiceEmojis[choice1]} ${choice1.charAt(0).toUpperCase() + choice1.slice(1)}\n**${player2Name}**: ${choiceEmojis[choice2]} ${choice2.charAt(0).toUpperCase() + choice2.slice(1)}\n\n**${winnerText}**${balanceChange}`;
  }
};
