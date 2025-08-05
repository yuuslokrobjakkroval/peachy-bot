const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const maxAmount = 250000;

const horses = [
  { id: 1, name: "Thunder Bolt", emoji: "🐎", odds: 3.2, speed: "fast" },
  { id: 2, name: "Lightning Star", emoji: "🦄", odds: 3.8, speed: "fast" },
  { id: 3, name: "Storm Runner", emoji: "🐕", odds: 4.1, speed: "medium" },
  { id: 4, name: "Fire Spirit", emoji: "🦊", odds: 4.5, speed: "medium" },
  { id: 5, name: "Wind Walker", emoji: "🐒", odds: 5.2, speed: "medium" },
  { id: 6, name: "Dark Knight", emoji: "🦖", odds: 6.8, speed: "slow" },
  { id: 7, name: "Golden Dream", emoji: "🦁", odds: 7.5, speed: "slow" },
  {
    id: 8,
    name: "Lucky Charm",
    emoji: "🐰",
    odds: 9.2,
    speed: "unpredictable",
  },
];

module.exports = class HorseRacing extends Command {
  constructor(client) {
    super(client, {
      name: "racing",
      description: {
        content:
          "Bet on virtual animal races and watch them compete for victory!",
        examples: ["horse 1000 1", "horse 5000 Thunder", "horse all lucky"],
        usage: "horse <amount> <animal_id/name/lucky>",
      },
      category: "gambling",
      aliases: ["racing", "ar"],
      cooldown: 5,
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
          name: "horse",
          description: "Animal number (1-8), name, or 'lucky' for random",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const horseRacingMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.horseRacingMessages;

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

      // Parse horse selection
      let horseChoice = ctx.isInteraction
        ? ctx.interaction.options.getString("horse")
        : args[1];

      if (!horseChoice) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          horseRacingMessages.noHorseSelected ||
            "Please select an animal to bet on (1-8, name, or 'lucky').",
          color
        );
      }

      const selectedHorse = this.parseHorseSelection(horseChoice);
      if (!selectedHorse) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          horseRacingMessages.invalidHorse ||
            "Invalid animal selection. Choose 1-8, animal name, or 'lucky'.",
          color
        );
      }

      // Show betting confirmation and start race
      return this.startRace(
        client,
        ctx,
        user,
        betAmount,
        selectedHorse,
        color,
        emoji,
        generalMessages,
        horseRacingMessages
      );
    } catch (error) {
      console.error("Horse Racing Error:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while starting the race. Please try again.",
        color
      );
    }
  }

  parseHorseSelection(choice) {
    const choiceStr = choice.toString().toLowerCase();

    // Lucky pick - random animal
    if (choiceStr === "lucky" || choiceStr === "random") {
      return horses[Math.floor(Math.random() * horses.length)];
    }

    // Animal by number
    const horseNum = parseInt(choiceStr);
    if (horseNum >= 1 && horseNum <= 8) {
      return horses[horseNum - 1];
    }

    // Animal by name (partial match)
    const foundHorse = horses.find(
      (horse) =>
        horse.name.toLowerCase().includes(choiceStr) ||
        horse.name
          .toLowerCase()
          .replace(/\s+/g, "")
          .includes(choiceStr.replace(/\s+/g, ""))
    );

    return foundHorse || null;
  }

  async startRace(
    client,
    ctx,
    user,
    betAmount,
    selectedHorse,
    color,
    emoji,
    generalMessages,
    horseRacingMessages
  ) {
    // Create betting embed
    const bettingEmbed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", horseRacingMessages.title || "HORSE RACING")
          .replace("%{mainRight}", emoji.mainRight) +
          this.createHorseListDisplay() +
          `\n🎯 **Your Bet:**\n${selectedHorse.emoji} **${selectedHorse.name}** (#${selectedHorse.id})\n💰 **Amount:** ${client.utils.formatNumber(betAmount)} ${emoji.coin}\n📊 **Odds:** ${selectedHorse.odds}:1\n💵 **Potential Win:** ${client.utils.formatNumber(Math.floor(betAmount * selectedHorse.odds))} ${emoji.coin}`
      )
      .setFooter({
        text: horseRacingMessages.raceStarting || "Race starting soon...",
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    const startButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_race")
        .setLabel("🏁 Start Race!")
        .setStyle(ButtonStyle.Success)
    );

    const message = await ctx.sendMessage({
      embeds: [bettingEmbed],
      components: [startButton],
    });

    const collector = message.createMessageComponentCollector({
      time: 30000, // 30 seconds to start race
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== ctx.author.id) {
        return interaction.reply({
          content: generalMessages.notForYou || "This race is not for you!",
          flags: 64,
        });
      }

      collector.stop();
      await this.runRace(
        client,
        ctx,
        interaction,
        user,
        betAmount,
        selectedHorse,
        color,
        emoji,
        generalMessages,
        horseRacingMessages
      );
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", horseRacingMessages.title || "HORSE RACING")
              .replace("%{mainRight}", emoji.mainRight) +
              (horseRacingMessages.timeout ||
                "Race cancelled! No coins were lost.")
          );

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

  async runRace(
    client,
    ctx,
    interaction,
    user,
    betAmount,
    selectedHorse,
    color,
    emoji,
    generalMessages,
    horseRacingMessages
  ) {
    // Simulate race with multiple updates
    const racePositions = this.initializeRace();
    const raceLength = 10; // Race track length

    // Start race animation
    await interaction.update({
      embeds: [
        this.createRaceEmbed(
          client,
          racePositions,
          0,
          raceLength,
          color,
          emoji,
          generalMessages,
          horseRacingMessages,
          "🏁 Race in progress..."
        ),
      ],
      components: [],
    });

    // Run race simulation with updates
    for (let step = 1; step <= raceLength; step++) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay between updates

      this.updateRacePositions(racePositions);

      const raceStatus =
        step === raceLength
          ? "🏆 Race finished!"
          : `🏁 Step ${step}/${raceLength}`;

      await interaction.editReply({
        embeds: [
          this.createRaceEmbed(
            client,
            racePositions,
            step,
            raceLength,
            color,
            emoji,
            generalMessages,
            horseRacingMessages,
            raceStatus
          ),
        ],
      });
    }

    // Determine winner and update balance
    const winner = this.determineWinner(racePositions);
    const isWin = winner.id === selectedHorse.id;

    let newBalance = user.balance.coin;
    let winAmount = 0;

    if (isWin) {
      winAmount = Math.floor(betAmount * selectedHorse.odds);
      newBalance = user.balance.coin + winAmount;
    } else {
      newBalance = user.balance.coin - betAmount;
    }

    user.balance.coin = newBalance;
    await user.save();

    // Show final results
    setTimeout(async () => {
      const resultEmbed = client
        .embed()
        .setColor(isWin ? color.success : color.danger)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", horseRacingMessages.title || "HORSE RACING")
            .replace("%{mainRight}", emoji.mainRight) +
            this.createFinalResultDisplay(
              winner,
              selectedHorse,
              isWin,
              betAmount,
              winAmount,
              emoji,
              horseRacingMessages
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

      await interaction.editReply({
        embeds: [resultEmbed],
      });
    }, 2000);
  }

  initializeRace() {
    return horses.map((horse) => ({
      ...horse,
      position: 0,
      speed: this.getInitialSpeed(horse.speed),
      // Add momentum system for more dynamic racing
      momentum: Math.random() * 0.2 + 0.9, // 0.9-1.1 starting momentum
    }));
  }

  getInitialSpeed(speedType) {
    // More balanced speed ranges to make races more competitive
    switch (speedType) {
      case "fast":
        return Math.random() * 0.4 + 0.6; // 0.6-1.0
      case "medium":
        return Math.random() * 0.5 + 0.4; // 0.4-0.9
      case "slow":
        return Math.random() * 0.5 + 0.2; // 0.2-0.7
      case "unpredictable":
        return Math.random() * 0.8 + 0.1; // 0.1-0.9 (more consistent than pure random)
      default:
        return Math.random() * 0.6 + 0.3; // 0.3-0.9
    }
  }

  updateRacePositions(racePositions) {
    racePositions.forEach((horse) => {
      // Increased randomness to make races more unpredictable
      const speedVariation = (Math.random() - 0.5) * 0.6; // -0.3 to +0.3
      const randomBoost = Math.random() < 0.15 ? 0.3 : 0; // 15% chance for random boost
      const randomSlow = Math.random() < 0.1 ? -0.2 : 0; // 10% chance for random slowdown

      // Update momentum for next step (adds consistency but still allows for changes)
      horse.momentum = Math.max(
        0.5,
        Math.min(1.5, horse.momentum + (Math.random() - 0.5) * 0.2)
      );

      const currentSpeed = Math.max(
        0.05,
        (horse.speed + speedVariation + randomBoost + randomSlow) *
          horse.momentum
      );
      horse.position += currentSpeed;
    });
  }

  determineWinner(racePositions) {
    return racePositions.reduce((winner, current) =>
      current.position > winner.position ? current : winner
    );
  }

  createHorseListDisplay() {
    let display = "\n **Animals in this race:**\n";
    horses.forEach((horse) => {
      display += `${horse.emoji} **${horse.id}.** ${horse.name} (${horse.odds}:1)\n`;
    });
    return display;
  }

  createRaceEmbed(
    client,
    racePositions,
    currentStep,
    totalSteps,
    color,
    emoji,
    generalMessages,
    horseRacingMessages,
    status
  ) {
    const sortedHorses = [...racePositions].sort(
      (a, b) => b.position - a.position
    );

    let raceTrack = "";

    // Create a more detailed race track with better road visualization
    sortedHorses.forEach((horse) => {
      const progress = Math.min(horse.position / totalSteps, 1);
      const trackLength = 10; // Match the 10 steps
      const horsePos = Math.floor(progress * trackLength);

      // Create the race track with road emojis
      let track = "";
      for (let i = 0; i <= trackLength; i++) {
        if (i === horsePos) {
          track += horse.emoji;
        } else if (i === 0) {
          track += "🏁"; // Start line
        } else if (i === trackLength) {
          track += "🏆"; // Finish line
        } else {
          track += "🛤️"; // Road/track
        }
      }
      raceTrack += `${track} **${horse.name}**\n`;
    });

    // Add a visual progress bar for the current step
    let stepIndicator = "\n📊 **Race Progress:** ";
    for (let i = 1; i <= totalSteps; i++) {
      if (i <= currentStep) {
        stepIndicator += "✅";
      } else {
        stepIndicator += "⬜";
      }
    }
    stepIndicator += ` ${currentStep}/${totalSteps}\n`;

    return client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", horseRacingMessages.title || "ANIMAL RACING")
          .replace("%{mainRight}", emoji.mainRight) +
          `\n${status}${stepIndicator}\n${raceTrack}`
      )
      .setFooter({
        text: horseRacingMessages.raceInProgress || "Race in progress...",
        iconURL: "https://cdn.discordapp.com/emojis/1234567890123456789.gif", // You can add a racing GIF here
      })
      .setTimestamp();
  }

  createFinalResultDisplay(
    winner,
    selectedHorse,
    isWin,
    betAmount,
    winAmount,
    emoji,
    horseRacingMessages
  ) {
    let result = `\n🏆 **Winner:** ${winner.emoji} **${winner.name}** (#${winner.id})\n\n`;

    if (isWin) {
      result += `🎉 **Congratulations!** Your animal won!\n`;
      result += `💰 **You won:** +${winAmount.toLocaleString()} ${emoji.coin}\n`;
      result += `📊 **Odds:** ${selectedHorse.odds}:1`;
    } else {
      result += `😢 **Your animal didn't win this time.**\n`;
      result += `💰 **You lost:** -${betAmount.toLocaleString()} ${emoji.coin}\n`;
      result += `🎯 **Your pick:** ${selectedHorse.emoji} ${selectedHorse.name} (#${selectedHorse.id})`;
    }

    return result;
  }
};
