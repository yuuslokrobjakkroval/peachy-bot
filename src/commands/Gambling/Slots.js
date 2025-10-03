const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const maxAmount = 200000;

module.exports = class Slots extends Command {
  constructor(client) {
    super(client, {
      name: "slots",
      description: {
        content: "Bet your money in the slot machine!",
        examples: ["slots 100"],
        usage: "slots <baseCoins>",
      },
      category: "gambling",
      aliases: ["slot", "s"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "amount",
          description: "The baseCoins you want to bet.",
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
    const slotMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.slotMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);
      const SLOTS = [
        emoji.slots.x1,
        emoji.slots.x2,
        emoji.slots.x3,
        emoji.slots.x4,
        emoji.slots.x5,
        emoji.slots.x10,
      ];
      const { coin, bank, slots } = user.balance;

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

      let amount = ctx.isInteraction
        ? ctx.interaction.options.data[0]?.value
        : args[0];

      // If no amount provided, show interactive betting interface
      if (!amount) {
        return this.showBettingInterface(
          client,
          ctx,
          color,
          emoji,
          language,
          coin
        );
      }

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

      const baseCoins = Number.parseInt(Math.min(amount, coin, maxAmount));

      return this.playSlots(client, ctx, baseCoins, color, emoji, language);
    } catch (error) {
      console.error("Error in slots command:", error);
      client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred. Please try again later.",
        color
      );
    }
  }

  async showBettingInterface(client, ctx, color, emoji, language, coin) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const slotMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.slotMessages;

    const bettingEmbed = client
      .embed()
      .setColor(color.main)
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n\n` +
          `**${emoji.coin} Balance:** ${client.utils.formatNumber(coin)}\n` +
          `**💰 Max Bet:** ${client.utils.formatNumber(Math.min(coin, maxAmount))}\n\n` +
          `Choose your betting amount:`
      )
      .setFooter({
        text: `Select an amount to start spinning!`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    // Create preset amount buttons
    const presetAmounts = [25, 50, 100];
    const buttons = [];

    presetAmounts.forEach((amount) => {
      if (amount <= coin) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`slots_bet_${amount}`)
            .setLabel(`${amount}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emoji.coin)
        );
      }
    });

    // Add "All" button if user has coins
    if (coin > 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`slots_bet_all`)
          .setLabel("All")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("💸")
      );
    }

    // Add "Custom" button
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`slots_bet_custom`)
        .setLabel("Custom")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⚙️")
    );

    const buttonRow = new ActionRowBuilder().addComponents(buttons);

    // Add statistics select menu
    const statsMenu = new StringSelectMenuBuilder()
      .setCustomId("slots_stats_menu")
      .setPlaceholder("📊 View Statistics")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Game Statistics")
          .setDescription("View your wins, losses, and win rate")
          .setValue("game_stats")
          .setEmoji("🎰"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Financial Summary")
          .setDescription("Total wagered, won, and net profit/loss")
          .setValue("financial_stats")
          .setEmoji("💰"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Records & Achievements")
          .setDescription("Biggest wins, streaks, and milestones")
          .setValue("records_stats")
          .setEmoji("🏆")
      );

    const menuRow = new ActionRowBuilder().addComponents(statsMenu);

    return ctx.sendMessage({
      embeds: [bettingEmbed],
      components: [buttonRow, menuRow],
    });
  }

  async playSlots(client, ctx, baseCoins, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const slotMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.slotMessages;

    try {
      let user = await client.utils.getUser(ctx.author.id);

      // Initialize gambling stats if they don't exist
      if (!user.gambling) {
        await Users.updateOne(
          { userId: ctx.author.id },
          { $set: { gambling: { slots: {} } } }
        );
        user = await client.utils.getUser(ctx.author.id);
      }
      const SLOTS = [
        emoji.slots.x1,
        emoji.slots.x2,
        emoji.slots.x3,
        emoji.slots.x4,
        emoji.slots.x5,
        emoji.slots.x10,
      ];
      const { coin, bank, slots } = user.balance;

      // Update the user's balance for the bet
      await Users.updateOne(
        { userId: ctx.author.id },
        {
          $set: {
            "balance.coin": coin - baseCoins,
            "balance.slots": slots + baseCoins,
            "balance.bank": bank,
          },
        }
      );

      let rslots = [];
      const rand = client.utils.getRandomNumber(1, 100);
      let win = 0;

      // Add this before the win/lose logic
      const luckyChannel = [
        "1407290922181591061",
        "1370318529706065961",
        "1370318538161782826",
        "1376910445453250660",
      ];
      const isLuckyChannel = luckyChannel.includes(ctx.channel?.id);

      if (user.verification.isBlacklist) {
        // Reduced win rates for blacklisted users (total: 12% win rate)
        if (rand <= 5) {
          win = baseCoins;
          rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
        } else if (rand <= 7) {
          win = baseCoins * 2;
          rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
        } else if (rand <= 8) {
          win = baseCoins * 3;
          rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
        } else if (rand <= 9) {
          win = baseCoins * 4;
          rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
        } else if (rand <= 10) {
          win = baseCoins * 5;
          rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
        } else if (rand <= 11) {
          win = baseCoins * 10;
          rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
        } else {
          const slot1 = Math.floor(Math.random() * SLOTS.length);
          let slot2 = Math.floor(Math.random() * SLOTS.length);
          let slot3 = Math.floor(Math.random() * SLOTS.length);
          if (slot2 === slot1)
            slot2 =
              (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
              SLOTS.length;
          if (slot3 === slot1 || slot3 === slot2)
            slot3 =
              (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
              SLOTS.length;
          rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
        }
      } else {
        // 58% winrate for luckyChannel, 55% for normal
        const winRate = isLuckyChannel ? 45 : 40;
        if (rand <= Math.floor(winRate * 0.4)) {
          // 40% of winRate for x1
          win = baseCoins;
          rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
        } else if (rand <= Math.floor(winRate * 0.67)) {
          // 27% of winRate for x2
          win = baseCoins * 2;
          rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
        } else if (rand <= Math.floor(winRate * 0.82)) {
          // 15% of winRate for x3
          win = baseCoins * 3;
          rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
        } else if (rand <= Math.floor(winRate * 0.92)) {
          // 10% of winRate for x4
          win = baseCoins * 4;
          rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
        } else if (rand <= Math.floor(winRate * 0.98)) {
          // 6% of winRate for x5
          win = baseCoins * 5;
          rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
        } else if (rand <= winRate) {
          // 2% of winRate for x10
          win = baseCoins * 10;
          rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
        } else {
          // Lose
          const slot1 = Math.floor(Math.random() * SLOTS.length);
          let slot2 = Math.floor(Math.random() * SLOTS.length);
          let slot3 = Math.floor(Math.random() * SLOTS.length);
          if (slot2 === slot1)
            slot2 =
              (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
              SLOTS.length;
          if (slot3 === slot1 || slot3 === slot2)
            slot3 =
              (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
              SLOTS.length;
          rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
          win = 0;
        }
      }

      const newBalance = coin + win - baseCoins;

      // Track statistics
      await this.updateSlotsStatistics(client, ctx.author.id, {
        betAmount: baseCoins,
        winAmount: win,
        isWin: win > 0,
        multiplier: this.getMultiplier(win, baseCoins),
        newBalance: newBalance,
      });

      const initialEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ══╗\n ## **   「${emoji.slots.spin} ${emoji.slots.spin} ${
            emoji.slots.spin
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n`
        )
        .setFooter({
          text: `${generalMessages.gameInProgress.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      const message = await ctx.sendMessage({ embeds: [initialEmbed] });

      // Update balance after sending message
      await Users.updateOne(
        { userId: ctx.author.id },
        { $set: { "balance.coin": newBalance, "balance.bank": bank } }
      );

      const spinEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ══╗\n ## **   「${rslots[0]} ${emoji.slots.spin} ${
            emoji.slots.spin
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n`
        )
        .setFooter({
          text: `${generalMessages.gameInProgress.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      const spinSecondEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ══╗\n ## **   「${rslots[0]} ${emoji.slots.spin} ${
            rslots[2]
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n`
        )
        .setFooter({
          text: `${generalMessages.gameInProgress.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      const resultEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          win === 0
            ? client.utils.emojiToImage(
                emoji?.result
                  ? client.utils.getRandomElement(emoji?.result?.lose)
                  : globalEmoji.option.lose
              )
            : client.utils.emojiToImage(
                emoji?.result
                  ? client.utils.getRandomElement(emoji?.result?.win)
                  : globalEmoji.option.win
              )
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ══╗\n ## **   「${rslots[0]} ${rslots[1]} ${
            rslots[2]
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n${
            win === 0
              ? `${slotMessages.lost
                  .replace("%{coin}", client.utils.formatNumber(baseCoins))
                  .replace("%{coinEmote}", emoji.coin)}`
              : `${slotMessages.won
                  .replace("%{coin}", client.utils.formatNumber(win))
                  .replace("%{coinEmote}", emoji.coin)}`
          }`
        )
        .setFooter({
          text: `${generalMessages.gameOver.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      setTimeout(async () => {
        await message.edit({ embeds: [spinEmbed] });
        setTimeout(async () => {
          await message.edit({ embeds: [spinSecondEmbed] });
          setTimeout(async () => {
            await message.edit({ embeds: [resultEmbed] });
          }, 1000);
        }, 700);
      }, 1000);

      // Add play again buttons after the game
      setTimeout(async () => {
        const playAgainButtons = this.createPlayAgainButtons(
          client.utils.formatNumber(baseCoins),
          coin
        );
        await message.edit({
          embeds: [resultEmbed],
          components: playAgainButtons,
        });
      }, 3500);
    } catch (error) {
      console.error("Error in slots command:", error);
      client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred. Please try again later.",
        color
      );
    }
  }

  createPlayAgainButtons(lastBet, currentCoins) {
    const buttons = [];

    // Play again with same bet
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`slots_again_${lastBet}`)
        .setLabel(`Spin Again (${lastBet})`)
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔄")
    );

    // Auto-spin options
    if (lastBet * 5 <= currentCoins) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`slots_auto_5_${lastBet}`)
          .setLabel("Auto x5")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄")
      );
    }

    if (lastBet * 10 <= currentCoins) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`slots_auto_10_${lastBet}`)
          .setLabel("Auto x10")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🚀")
      );
    }

    // New bet
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`slots_new_bet`)
        .setLabel("New Bet")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💰")
    );

    if (buttons.length === 0) return [];

    return [new ActionRowBuilder().addComponents(buttons)];
  }

  async autoSpin(
    client,
    ctx,
    betAmount,
    spinsRemaining,
    color,
    emoji,
    language
  ) {
    let user = await client.utils.getUser(ctx.author.id);
    let totalWon = 0;
    let totalBet = 0;
    let spinsCompleted = 0;
    let wins = 0;

    const autoSpinEmbed = client
      .embed()
      .setColor(color.main)
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        `# **${emoji.mainLeft} AUTO SLOTS ${emoji.mainRight}**\n\n` +
          `**🎰 Spins Remaining:** ${spinsRemaining}\n` +
          `**💰 Bet per Spin:** ${client.utils.formatNumber(betAmount)} ${emoji.coin}\n` +
          `**📊 Progress:** 0/${spinsRemaining - spinsRemaining + 1}\n\n` +
          `*Starting auto-spin...*`
      )
      .setFooter({
        text: `Auto-spinning in progress...`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    // Create stop button
    const stopButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`slots_stop_auto`)
        .setLabel("Stop Auto-Spin")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⏹️")
    );

    const message = await ctx.sendMessage({
      embeds: [autoSpinEmbed],
      components: [stopButton],
    });

    // Store auto-spin session
    if (!client.autoSpinSessions) client.autoSpinSessions = new Map();
    client.autoSpinSessions.set(ctx.author.id, {
      active: true,
      messageId: message.id,
      spinsRemaining,
      betAmount,
      totalWon: 0,
      totalBet: 0,
      wins: 0,
      spinsCompleted: 0,
    });

    for (let i = 0; i < spinsRemaining; i++) {
      // Check if auto-spin was stopped
      const session = client.autoSpinSessions.get(ctx.author.id);
      if (!session || !session.active) {
        break;
      }

      // Check if user still has enough coins
      user = await client.utils.getUser(ctx.author.id);
      if (user.balance.coin < betAmount) {
        client.autoSpinSessions.delete(ctx.author.id);
        const insufficientFundsEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            `**Auto-spin stopped**: Insufficient funds for spin ${i + 1}`
          );
        await message.edit({
          embeds: [insufficientFundsEmbed],
          components: [],
        });
        return;
      }

      // Simulate a single spin (using existing logic)
      const result = await this.simulateSingleSpin(
        client,
        ctx,
        betAmount,
        color,
        emoji,
        language
      );

      totalBet += betAmount;
      totalWon += result.winAmount;
      spinsCompleted++;
      if (result.winAmount > 0) wins++;

      // Update progress every spin
      const progressEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} AUTO SLOTS ${emoji.mainRight}**\n\n` +
            `**🎰 Spins Remaining:** ${spinsRemaining - i - 1}\n` +
            `**💰 Bet per Spin:** ${client.utils.formatNumber(betAmount)} ${emoji.coin}\n` +
            `**📊 Progress:** ${i + 1}/${spinsRemaining}\n` +
            `**🏆 Wins:** ${wins}/${spinsCompleted}\n` +
            `**💵 Total Won:** ${client.utils.formatNumber(totalWon)} ${emoji.coin}\n` +
            `**💸 Total Bet:** ${client.utils.formatNumber(totalBet)} ${emoji.coin}\n` +
            `**📈 Net:** ${totalWon >= totalBet ? "+" : ""}${client.utils.formatNumber(totalWon - totalBet)} ${emoji.coin}\n\n` +
            `*Last spin: ${result.slots.join(" ")} ${result.winAmount > 0 ? `(+${client.utils.formatNumber(result.winAmount)} ${emoji.coin})` : "(Loss)"}*`
        )
        .setFooter({
          text: `Auto-spinning... ${Math.round(((i + 1) / spinsRemaining) * 100)}% complete`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      await message.edit({ embeds: [progressEmbed], components: [stopButton] });
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay between spins
    }

    // Clean up session
    client.autoSpinSessions.delete(ctx.author.id);

    // Final results
    const finalEmbed = client
      .embed()
      .setColor(totalWon >= totalBet ? color.success : color.danger)
      .setThumbnail(
        totalWon >= totalBet
          ? client.utils.emojiToImage(
              emoji?.result
                ? client.utils.getRandomElement(emoji?.result?.win)
                : globalEmoji.option.win
            )
          : client.utils.emojiToImage(
              emoji?.result
                ? client.utils.getRandomElement(emoji?.result?.lose)
                : globalEmoji.option.lose
            )
      )
      .setDescription(
        `# **${emoji.mainLeft} AUTO SLOTS COMPLETE ${emoji.mainRight}**\n\n` +
          `**🎰 Spins Completed:** ${spinsCompleted}/${spinsRemaining}\n` +
          `**🏆 Wins:** ${wins} (${Math.round((wins / spinsCompleted) * 100)}%)\n` +
          `**💵 Total Won:** ${client.utils.formatNumber(totalWon)} ${emoji.coin}\n` +
          `**💸 Total Bet:** ${client.utils.formatNumber(totalBet)} ${emoji.coin}\n` +
          `**📈 Net Result:** ${totalWon >= totalBet ? "+" : ""}${client.utils.formatNumber(totalWon - totalBet)} ${emoji.coin}\n\n` +
          `${totalWon >= totalBet ? "🎉 **Profitable session!**" : "� **Better luck next time!**"}`
      )
      .setFooter({
        text: `Auto-spin session completed`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    // Add play again buttons
    const finalButtons = this.createPlayAgainButtons(
      betAmount,
      user.balance.coin + totalWon - totalBet
    );
    await message.edit({ embeds: [finalEmbed], components: finalButtons });
  }

  async simulateSingleSpin(client, ctx, baseCoins, color, emoji, language) {
    const user = await client.utils.getUser(ctx.author.id);
    const { coin, bank, slots } = user.balance;

    const SLOTS = [
      emoji.slots.x1,
      emoji.slots.x2,
      emoji.slots.x3,
      emoji.slots.x4,
      emoji.slots.x5,
      emoji.slots.x10,
    ];

    // Update balance for bet
    await Users.updateOne(
      { userId: ctx.author.id },
      {
        $set: {
          "balance.coin": coin - baseCoins,
          "balance.slots": slots + baseCoins,
          "balance.bank": bank,
        },
      }
    );

    let rslots = [];
    const rand = client.utils.getRandomNumber(1, 100);
    let win = 0;

    // Use same win logic as main game
    const luckyChannel = [
      "1407290922181591061",
      "1370318529706065961",
      "1370318538161782826",
      "1376910445453250660",
    ];
    const isLuckyChannel = luckyChannel.includes(ctx.channel?.id);

    if (user.verification.isBlacklist) {
      // Reduced win rates for blacklisted users
      if (rand <= 5) {
        win = baseCoins;
        rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
      } else if (rand <= 7) {
        win = baseCoins * 2;
        rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
      } else if (rand <= 8) {
        win = baseCoins * 3;
        rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
      } else if (rand <= 9) {
        win = baseCoins * 4;
        rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
      } else if (rand <= 10) {
        win = baseCoins * 5;
        rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
      } else if (rand <= 11) {
        win = baseCoins * 10;
        rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
      } else {
        const slot1 = Math.floor(Math.random() * SLOTS.length);
        let slot2 = Math.floor(Math.random() * SLOTS.length);
        let slot3 = Math.floor(Math.random() * SLOTS.length);
        if (slot2 === slot1)
          slot2 =
            (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
            SLOTS.length;
        if (slot3 === slot1 || slot3 === slot2)
          slot3 =
            (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
            SLOTS.length;
        rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
      }
    } else {
      // Normal win rates
      const winRate = isLuckyChannel ? 45 : 40;
      if (rand <= Math.floor(winRate * 0.4)) {
        win = baseCoins;
        rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
      } else if (rand <= Math.floor(winRate * 0.67)) {
        win = baseCoins * 2;
        rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
      } else if (rand <= Math.floor(winRate * 0.82)) {
        win = baseCoins * 3;
        rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
      } else if (rand <= Math.floor(winRate * 0.92)) {
        win = baseCoins * 4;
        rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
      } else if (rand <= Math.floor(winRate * 0.98)) {
        win = baseCoins * 5;
        rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
      } else if (rand <= winRate) {
        win = baseCoins * 10;
        rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
      } else {
        const slot1 = Math.floor(Math.random() * SLOTS.length);
        let slot2 = Math.floor(Math.random() * SLOTS.length);
        let slot3 = Math.floor(Math.random() * SLOTS.length);
        if (slot2 === slot1)
          slot2 =
            (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
            SLOTS.length;
        if (slot3 === slot1 || slot3 === slot2)
          slot3 =
            (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
            SLOTS.length;
        rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
        win = 0;
      }
    }

    const newBalance = coin + win - baseCoins;

    // Update final balance
    await Users.updateOne(
      { userId: ctx.author.id },
      { $set: { "balance.coin": newBalance, "balance.bank": bank } }
    );

    // Track statistics for auto-spin
    await this.updateSlotsStatistics(client, ctx.author.id, {
      betAmount: baseCoins,
      winAmount: win,
      isWin: win > 0,
      multiplier: this.getMultiplier(win, baseCoins),
      newBalance: newBalance,
    });

    return {
      slots: rslots,
      winAmount: win,
      newBalance: newBalance,
    };
  }

  createCustomBetModal() {
    const modal = new ModalBuilder()
      .setCustomId("slots_custom_amount")
      .setTitle("Enter Custom Bet Amount");

    const amountInput = new TextInputBuilder()
      .setCustomId("bet_amount")
      .setLabel("Bet Amount")
      .setPlaceholder("Enter amount (e.g., 150, all, half)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    const actionRow = new ActionRowBuilder().addComponents(amountInput);
    modal.addComponents(actionRow);

    return modal;
  }

  async showGameStats(client, ctx, color, emoji, language) {
    const user = await client.utils.getUser(ctx.author.id);
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    // Get stats from user data
    const stats = user.gambling?.slots || {};
    const totalGames = stats.totalGames || 0;
    const totalWins = stats.totalWins || 0;
    const totalLosses = stats.totalLosses || 0;
    const winRate = stats.winRate || 0;
    const currentStreak = stats.currentStreak || 0;
    const bestWinStreak = stats.bestWinStreak || 0;
    const worstLossStreak = stats.worstLossStreak || 0;
    const sessionGames = stats.sessionGames || 0;
    const longestSession = stats.longestSession || 0;

    // Multiplier breakdown
    const x1Wins = stats.x1Wins || 0;
    const x2Wins = stats.x2Wins || 0;
    const x3Wins = stats.x3Wins || 0;
    const x4Wins = stats.x4Wins || 0;
    const x5Wins = stats.x5Wins || 0;
    const x10Wins = stats.x10Wins || 0;

    const statsEmbed = client
      .embed()
      .setColor(color.main)
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        `# **${emoji.mainLeft} SLOTS STATISTICS ${emoji.mainRight}**\n\n` +
          `## 🎰 **Game Statistics**\n` +
          `**Total Games:** ${client.utils.formatNumber(totalGames)}\n` +
          `**Wins:** ${client.utils.formatNumber(totalWins)} 🟢\n` +
          `**Losses:** ${client.utils.formatNumber(totalLosses)} 🔴\n` +
          `**Win Rate:** ${winRate.toFixed(1)}%\n\n` +
          `## 🔥 **Streaks**\n` +
          `**Current:** ${currentStreak >= 0 ? `${currentStreak} wins 🔥` : `${Math.abs(currentStreak)} losses 💔`}\n` +
          `**Best Win Streak:** ${bestWinStreak} games\n` +
          `**Worst Loss Streak:** ${worstLossStreak} games\n\n` +
          `## 🎲 **Multiplier Breakdown**\n` +
          `**1x Wins:** ${x1Wins} ${emoji.slots.x1}\n` +
          `**2x Wins:** ${x2Wins} ${emoji.slots.x2}\n` +
          `**3x Wins:** ${x3Wins} ${emoji.slots.x3}\n` +
          `**4x Wins:** ${x4Wins} ${emoji.slots.x4}\n` +
          `**5x Wins:** ${x5Wins} ${emoji.slots.x5}\n` +
          `**10x Wins:** ${x10Wins} ${emoji.slots.x10} 🎰\n\n` +
          `## 📊 **Session Info**\n` +
          `**Current Session:** ${sessionGames} games\n` +
          `**Longest Session:** ${longestSession} games\n\n` +
          `*${totalGames === 0 ? "Play some games to see your statistics!" : "Keep spinning to improve your stats!"}*`
      )
      .setFooter({
        text: `${generalMessages.requestedBy.replace("%{user}", ctx.author.displayName)}`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    const backButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("slots_back_to_betting")
        .setLabel("← Back to Betting")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🎰")
    );

    return ctx.sendMessage({
      embeds: [statsEmbed],
      components: [backButton],
    });
  }

  async showFinancialStats(client, ctx, color, emoji, language) {
    const user = await client.utils.getUser(ctx.author.id);
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    const stats = user.gambling?.slots || {};
    const totalWagered = stats.totalWagered || 0;
    const totalWon = stats.totalWon || 0;
    const netProfit = stats.netProfit || 0;
    const averageBet = stats.averageBet || 0;
    const averageWin = stats.averageWin || 0;
    const biggestWin = stats.biggestWin || 0;
    const biggestLoss = stats.biggestLoss || 0;
    const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;
    const totalGames = stats.totalGames || 0;

    const financialEmbed = client
      .embed()
      .setColor(netProfit >= 0 ? color.success : color.danger)
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        `# **${emoji.mainLeft} FINANCIAL SUMMARY ${emoji.mainRight}**\n\n` +
          `## 💸 **Spending Analysis**\n` +
          `**Total Wagered:** ${client.utils.formatNumber(totalWagered)} ${emoji.coin}\n` +
          `**Games Played:** ${client.utils.formatNumber(totalGames)}\n` +
          `**Average Bet:** ${client.utils.formatNumber(averageBet)} ${emoji.coin}\n` +
          `**Biggest Loss:** ${client.utils.formatNumber(biggestLoss)} ${emoji.coin}\n\n` +
          `## 💰 **Earnings Breakdown**\n` +
          `**Total Won:** ${client.utils.formatNumber(totalWon)} ${emoji.coin}\n` +
          `**Average Win:** ${client.utils.formatNumber(averageWin)} ${emoji.coin}\n` +
          `**Biggest Win:** ${client.utils.formatNumber(biggestWin)} ${emoji.coin}\n\n` +
          `## 📈 **Performance Metrics**\n` +
          `**Net Result:** ${netProfit >= 0 ? "+" : ""}${client.utils.formatNumber(netProfit)} ${emoji.coin}\n` +
          `**ROI:** ${roi.toFixed(1)}%\n` +
          `**Profit Ratio:** ${totalWagered > 0 ? (totalWon / totalWagered).toFixed(2) : 0}x\n\n` +
          `${netProfit >= 0 ? "🎉 **Profitable Gambler!**" : netProfit > -totalWagered * 0.5 ? "⚠️ **Minor Losses - You can recover!**" : "💔 **Heavy Losses - Consider taking a break!**"}`
      )
      .setFooter({
        text: `${generalMessages.requestedBy.replace("%{user}", ctx.author.displayName)}`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    const backButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("slots_back_to_betting")
        .setLabel("← Back to Betting")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🎰")
    );

    return ctx.sendMessage({
      embeds: [financialEmbed],
      components: [backButton],
    });
  }

  async showRecordsStats(client, ctx, color, emoji, language) {
    const user = await client.utils.getUser(ctx.author.id);
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    const stats = user.gambling?.slots || {};
    const biggestWin = stats.biggestWin || 0;
    const biggestLoss = stats.biggestLoss || 0;
    const bestWinStreak = stats.bestWinStreak || 0;
    const worstLossStreak = stats.worstLossStreak || 0;
    const firstGameDate = stats.firstGame
      ? new Date(stats.firstGame).toLocaleDateString()
      : "N/A";
    const lastGameDate = stats.lastGame
      ? new Date(stats.lastGame).toLocaleDateString()
      : "N/A";
    const totalGames = stats.totalGames || 0;
    const longestSession = stats.longestSession || 0;
    const highestBalance = stats.highestBalance || 0;
    const jackpotsHit = stats.jackpotsHit || 0;
    const totalWins = stats.totalWins || 0;
    const netProfit = stats.netProfit || 0;

    const recordsEmbed = client
      .embed()
      .setColor(color.main)
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        `# **${emoji.mainLeft} RECORDS & ACHIEVEMENTS ${emoji.mainRight}**\n\n` +
          `## 🏆 **Personal Records**\n` +
          `**Biggest Win:** ${client.utils.formatNumber(biggestWin)} ${emoji.coin}\n` +
          `**Best Win Streak:** ${bestWinStreak} games 🔥\n` +
          `**Longest Session:** ${longestSession} games\n` +
          `**Highest Balance:** ${client.utils.formatNumber(highestBalance)} ${emoji.coin}\n` +
          `**Jackpots Hit:** ${jackpotsHit} ${emoji.slots.x10}\n\n` +
          `## 💔 **Challenging Records**\n` +
          `**Biggest Loss:** ${client.utils.formatNumber(biggestLoss)} ${emoji.coin}\n` +
          `**Worst Loss Streak:** ${worstLossStreak} games\n\n` +
          `## 📅 **Timeline**\n` +
          `**First Game:** ${firstGameDate}\n` +
          `**Last Game:** ${lastGameDate}\n` +
          `**Total Games:** ${client.utils.formatNumber(totalGames)}\n\n` +
          `## 🎖️ **Achievements**\n` +
          `${totalGames >= 10 ? "✅" : "❌"} **Beginner** - Play 10 games\n` +
          `${totalGames >= 100 ? "✅" : "❌"} **Century Player** - Play 100 games\n` +
          `${totalGames >= 1000 ? "✅" : "❌"} **Slots Master** - Play 1000 games\n` +
          `${bestWinStreak >= 5 ? "✅" : "❌"} **Lucky Streak** - Win 5 in a row\n` +
          `${bestWinStreak >= 10 ? "✅" : "❌"} **Hot Streak** - Win 10 in a row\n` +
          `${jackpotsHit >= 1 ? "✅" : "❌"} **Jackpot Winner** - Hit a 10x multiplier\n` +
          `${jackpotsHit >= 10 ? "✅" : "❌"} **Jackpot Master** - Hit 10 jackpots\n` +
          `${biggestWin >= 50000 ? "✅" : "❌"} **Big Winner** - Win 50k+ in one spin\n` +
          `${biggestWin >= 100000 ? "✅" : "❌"} **Mega Winner** - Win 100k+ in one spin\n` +
          `${netProfit > 0 ? "✅" : "❌"} **Profitable Gambler** - Overall profit`
      )
      .setFooter({
        text: `${generalMessages.requestedBy.replace("%{user}", ctx.author.displayName)}`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    const backButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("slots_back_to_betting")
        .setLabel("← Back to Betting")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🎰")
    );

    return ctx.sendMessage({
      embeds: [recordsEmbed],
      components: [backButton],
    });
  }

  // Helper method to determine multiplier from win amount
  getMultiplier(winAmount, betAmount) {
    if (winAmount === 0) return 0;
    const multiplier = winAmount / betAmount;

    if (multiplier === 1) return 1;
    if (multiplier === 2) return 2;
    if (multiplier === 3) return 3;
    if (multiplier === 4) return 4;
    if (multiplier === 5) return 5;
    if (multiplier === 10) return 10;

    return Math.round(multiplier);
  }

  // Update slots statistics
  async updateSlotsStatistics(client, userId, gameData) {
    const { betAmount, winAmount, isWin, multiplier, newBalance } = gameData;

    try {
      const user = await Users.findOne({ userId });
      if (!user || !user.gambling) return;

      const stats = user.gambling.slots || {};
      const now = new Date();

      // Initialize session if needed
      if (
        !stats.sessionStartTime ||
        now - new Date(stats.sessionStartTime) > 3600000
      ) {
        // 1 hour session timeout
        stats.sessionStartTime = now;
        stats.sessionGames = 0;
      }

      // Game Statistics
      const newTotalGames = (stats.totalGames || 0) + 1;
      const newTotalWins = (stats.totalWins || 0) + (isWin ? 1 : 0);
      const newTotalLosses = newTotalGames - newTotalWins;
      const newWinRate =
        newTotalGames > 0 ? (newTotalWins / newTotalGames) * 100 : 0;

      // Streak calculation
      let newCurrentStreak;
      if (isWin) {
        newCurrentStreak =
          (stats.currentStreak || 0) >= 0 ? (stats.currentStreak || 0) + 1 : 1;
      } else {
        newCurrentStreak =
          (stats.currentStreak || 0) <= 0 ? (stats.currentStreak || 0) - 1 : -1;
      }

      const newBestWinStreak = Math.max(
        stats.bestWinStreak || 0,
        newCurrentStreak > 0 ? newCurrentStreak : 0
      );
      const newWorstLossStreak = Math.max(
        stats.worstLossStreak || 0,
        newCurrentStreak < 0 ? Math.abs(newCurrentStreak) : 0
      );

      // Financial Summary
      const newTotalWagered = (stats.totalWagered || 0) + betAmount;
      const newTotalWon = (stats.totalWon || 0) + winAmount;
      const newNetProfit = newTotalWon - newTotalWagered;
      const newBiggestWin = Math.max(stats.biggestWin || 0, winAmount);
      const newBiggestLoss = Math.max(
        stats.biggestLoss || 0,
        isWin ? 0 : betAmount
      );
      const newAverageBet =
        newTotalGames > 0 ? newTotalWagered / newTotalGames : 0;
      const newAverageWin = newTotalWins > 0 ? newTotalWon / newTotalWins : 0;

      // Records & Achievements
      const newSessionGames = (stats.sessionGames || 0) + 1;
      const newLongestSession = Math.max(
        stats.longestSession || 0,
        newSessionGames
      );
      const newHighestBalance = Math.max(stats.highestBalance || 0, newBalance);
      const newJackpotsHit =
        (stats.jackpotsHit || 0) + (multiplier === 10 ? 1 : 0);

      // Multiplier statistics
      const multiplierStats = {};
      ["x1Wins", "x2Wins", "x3Wins", "x4Wins", "x5Wins", "x10Wins"].forEach(
        (key) => {
          const mult = parseInt(key.replace("x", "").replace("Wins", ""));
          multiplierStats[key] =
            (stats[key] || 0) + (multiplier === mult ? 1 : 0);
        }
      );

      // Update database
      await Users.updateOne(
        { userId },
        {
          $set: {
            "gambling.slots": {
              // Game Statistics
              totalGames: newTotalGames,
              totalWins: newTotalWins,
              totalLosses: newTotalLosses,
              winRate: Math.round(newWinRate * 100) / 100,
              currentStreak: newCurrentStreak,
              bestWinStreak: newBestWinStreak,
              worstLossStreak: newWorstLossStreak,

              // Financial Summary
              totalWagered: newTotalWagered,
              totalWon: newTotalWon,
              netProfit: newNetProfit,
              biggestWin: newBiggestWin,
              biggestLoss: newBiggestLoss,
              averageBet: Math.round(newAverageBet),
              averageWin: Math.round(newAverageWin),

              // Records & Achievements
              firstGame: stats.firstGame || now,
              lastGame: now,
              longestSession: newLongestSession,
              highestBalance: newHighestBalance,
              jackpotsHit: newJackpotsHit,

              // Session tracking
              sessionGames: newSessionGames,
              sessionStartTime: stats.sessionStartTime,

              // Multiplier statistics
              ...multiplierStats,
            },
          },
        }
      );
    } catch (error) {
      console.error("Error updating slots statistics:", error);
    }
  }
};
