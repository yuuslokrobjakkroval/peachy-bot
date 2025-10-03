const { Command } = require("../../structures/index.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const maxAmount = 250000;

module.exports = class Coinflip extends Command {
  constructor(client) {
    super(client, {
      name: "coinflip",
      description: {
        content: "Flip a coin and let's see who's the lucky one!",
        examples: ["coinflip 100 peach", "coinflip 100 goma"],
        usage: "coinflip <amount> <choice>",
      },
      category: "gambling",
      aliases: ["flip", "cf"],
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
          description: "The amount you want to bet.",
          type: 3,
          required: false,
        },
        {
          name: "choice",
          description: "The side you want to bet",
          type: 3,
          required: false,
          choices: [
            { name: "peach", value: "p" },
            { name: "goma", value: "g" },
          ],
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);
      const { coin, bank, coinflip } = user.balance;

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

      // If traditional command is used with both arguments, process immediately
      if (!ctx.isInteraction && args.length >= 2 && args[0] && args[1]) {
        return this.processTraditionalCommand(
          client,
          ctx,
          args,
          color,
          emoji,
          language,
          user
        );
      }

      // If slash command has both options, process immediately
      if (ctx.isInteraction && ctx.interaction.options.data.length >= 2) {
        const amount = ctx.interaction.options.data.find(
          (opt) => opt.name === "amount"
        )?.value;
        const choice = ctx.interaction.options.data.find(
          (opt) => opt.name === "choice"
        )?.value;
        if (amount && choice) {
          return this.processSlashCommand(
            client,
            ctx,
            color,
            emoji,
            language,
            user
          );
        }
      }

      // Show interactive UI for amount and choice selection
      return this.showInteractiveUI(client, ctx, color, emoji, language, user);
    } catch (error) {
      console.error("Error processing command:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.userFetchError,
        color
      );
    }
  }

  async showInteractiveUI(client, ctx, color, emoji, language, user) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;
    const { coin } = user.balance;

    // Create betting amount buttons
    const amountRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("amount_1000")
        .setLabel("1K")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji.coin || "🪙")
        .setDisabled(coin < 1000),
      new ButtonBuilder()
        .setCustomId("amount_5000")
        .setLabel("5K")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji.coin || "🪙")
        .setDisabled(coin < 5000),
      new ButtonBuilder()
        .setCustomId("amount_10000")
        .setLabel("10K")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji.coin || "🪙")
        .setDisabled(coin < 10000),
      new ButtonBuilder()
        .setCustomId("amount_50000")
        .setLabel("50K")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji.coin || "🪙")
        .setDisabled(coin < 50000),
      new ButtonBuilder()
        .setCustomId("amount_100000")
        .setLabel("100K")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji.coin || "🪙")
        .setDisabled(coin < 100000)
    );

    // const amountRow2 = new ActionRowBuilder().addComponents(
    // new ButtonBuilder()
    //   .setCustomId("amount_half")
    //   .setLabel(`Half (${client.utils.formatNumber(Math.ceil(coin / 2))})`)
    //   .setStyle(ButtonStyle.Primary)
    //   .setEmoji("📊")
    //   .setDisabled(coin < 2),
    // new ButtonBuilder()
    //   .setCustomId("amount_all")
    //   .setLabel(`All In (${client.utils.formatNumber(coin)})`)
    //   .setStyle(ButtonStyle.Danger)
    //   .setEmoji("🎯")
    //   .setDisabled(coin < 1),
    // new ButtonBuilder()
    //   .setCustomId("amount_custom")
    //   .setLabel("Custom Amount")
    //   .setStyle(ButtonStyle.Success)
    //   .setEmoji("✏️")
    // );

    const setupEmbed = client
      .embed()
      .setColor(color.main)
      .setAuthor({
        name: `${ctx.author.displayName}'s Coinflip Setup`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setThumbnail(
        client.utils.emojiToImage(emoji.coinFlip?.flip || emoji.coin)
      )
      .setDescription(
        `${emoji.mainLeft || "🌟"} **Welcome to Coinflip!** ${emoji.mainRight || "🌟"}\n\n` +
          `${emoji.coin || "🪙"} **Your Balance:** ${client.utils.formatNumber(coin)} coins\n` +
          `${emoji.bank || "🏦"} **Max Bet:** ${client.utils.formatNumber(Math.min(coin, maxAmount))} coins\n\n` +
          `**Choose your betting amount:**`
      )
      .addFields([
        {
          name: "🎲 How to Play",
          value:
            "1️⃣ Select your bet amount\n\n2️⃣ Choose Peach 🍑 or Goma 🐻\n\n3️⃣ Watch the coin flip!\n\n4️⃣ Double your bet if you win!",
          inline: false,
        },
      ])
      .setFooter({
        text: "💡 Tip: Start with smaller amounts if you're new to gambling!",
        iconURL: client.utils.emojiToImage(emoji.lightbulb || "💡"),
      });

    const message = await ctx.sendMessage({
      embeds: [setupEmbed],
      components: [amountRow1],
    });

    // Create collector for amount selection
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 120000, // 2 minutes
    });

    collector.on("collect", async (interaction) => {
      try {
        let selectedAmount;
        const customId = interaction.customId;

        if (customId === "amount_custom") {
          // Handle custom amount input (could implement modal here)
          return interaction.reply({
            content:
              "💡 For custom amounts, please use the command: `/coinflip <amount> <choice>`",
            ephemeral: true,
          });
        }

        // Parse amount from button ID
        if (customId === "amount_half") {
          selectedAmount = Math.ceil(coin / 2);
        } else if (customId === "amount_all") {
          selectedAmount = coin;
        } else {
          const amountStr = customId.split("_")[1];
          selectedAmount = parseInt(amountStr);
        }

        selectedAmount = Math.min(selectedAmount, coin, maxAmount);

        // Show choice selection
        await this.showChoiceSelection(
          client,
          interaction,
          selectedAmount,
          color,
          emoji,
          language,
          user
        );
        collector.stop();
      } catch (error) {
        console.error("Error in amount selection:", error);
        await interaction.reply({
          content: "❌ An error occurred. Please try again!",
          ephemeral: true,
        });
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && message.editable) {
        try {
          const disabledComponents = message.components.map((row) => {
            const newRow = new ActionRowBuilder();
            row.components.forEach((component) => {
              newRow.addComponents(
                ButtonBuilder.from(component).setDisabled(true)
              );
            });
            return newRow;
          });

          await message.edit({
            components: disabledComponents,
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  "⏰ Coinflip setup timed out! Please run the command again."
                ),
            ],
          });
        } catch (error) {
          console.error("Error disabling components:", error);
        }
      }
    });
  }

  async showChoiceSelection(
    client,
    interaction,
    amount,
    color,
    emoji,
    language,
    user
  ) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;

    const choiceRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`flip_${amount}_peach`)
        .setLabel("Peach")
        .setStyle(ButtonStyle.Success)
        .setEmoji(emoji.coinFlip?.peach || "🍑"),
      new ButtonBuilder()
        .setCustomId(`flip_${amount}_goma`)
        .setLabel("Goma")
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emoji.coinFlip?.goma || "🐻"),
      new ButtonBuilder()
        .setCustomId("back_to_amount")
        .setLabel("← Back")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔙")
    );

    const choiceEmbed = client
      .embed()
      .setColor(color.main)
      .setAuthor({
        name: `${interaction.user.displayName}'s Coinflip`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setThumbnail(
        client.utils.emojiToImage(emoji.coinFlip?.flip || emoji.coin)
      )
      .setDescription(
        `${emoji.mainLeft || "🌟"} **Ready to Flip!** ${emoji.mainRight || "🌟"}\n\n` +
          `${emoji.coin || "🪙"} **Bet Amount:** ${client.utils.formatNumber(amount)} coins\n` +
          `${emoji.trophy || "🏆"} **Potential Win:** ${client.utils.formatNumber(amount * 2)} coins\n\n` +
          `**Choose your side:**`
      )
      .addFields([
        {
          name: "🍑 Peach Side",
          value: "Sweet and lucky!\nChoose if you feel peachy! 🌸",
          inline: true,
        },
        {
          name: "🐻 Goma Side",
          value: "Strong and determined!\nChoose the bear power! 💪",
          inline: true,
        },
      ])
      .setFooter({
        text: "🎲 Click your choice to flip the coin!",
        iconURL: client.utils.emojiToImage(emoji.dice || "🎲"),
      });

    await interaction.update({
      embeds: [choiceEmbed],
      components: [choiceRow],
    });

    // Create collector for choice selection
    const choiceCollector = interaction.message.createMessageComponentCollector(
      {
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000, // 1 minute
      }
    );

    choiceCollector.on("collect", async (choiceInteraction) => {
      try {
        if (choiceInteraction.customId === "back_to_amount") {
          // Go back to amount selection
          choiceCollector.stop();
          return this.showInteractiveUI(
            client,
            {
              sendMessage: async (data) => choiceInteraction.update(data),
              author: interaction.user,
              isInteraction: false,
            },
            color,
            emoji,
            language,
            user
          );
        }

        const [, betAmount, choice] = choiceInteraction.customId.split("_");
        await this.processCoinflip(
          client,
          choiceInteraction,
          parseInt(betAmount),
          choice,
          color,
          emoji,
          language,
          user
        );
        choiceCollector.stop();
      } catch (error) {
        console.error("Error in choice selection:", error);
        await choiceInteraction.reply({
          content: "❌ An error occurred. Please try again!",
          ephemeral: true,
        });
      }
    });

    choiceCollector.on("end", async (collected, reason) => {
      if (reason === "time" && interaction.message.editable) {
        try {
          await interaction.editReply({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(
                  "⏰ Choice selection timed out! Please run the command again."
                ),
            ],
            components: [],
          });
        } catch (error) {
          console.error("Error handling timeout:", error);
        }
      }
    });
  }

  async processCoinflip(
    client,
    interaction,
    amount,
    choice,
    color,
    emoji,
    language,
    user
  ) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;

    // Convert choice to internal format
    const choiceInternal = choice === "peach" ? "p" : "g";
    const choiceDisplay = choice === "peach" ? "Peach" : "Goma";

    // Show flipping animation
    const flipEmbed = client
      .embed()
      .setColor(color.main)
      .setAuthor({
        name: `${interaction.user.displayName}'s Coinflip`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setThumbnail(
        client.utils.emojiToImage(emoji.coinFlip?.flip || emoji.coin)
      )
      .setDescription(
        `${emoji.mainLeft || "🌟"} **Coin is Flipping!** ${emoji.mainRight || "🌟"}\n\n` +
          `${emoji.coin || "🪙"} **Bet:** ${client.utils.formatNumber(amount)} coins\n` +
          `${choice === "peach" ? emoji.coinFlip?.peach || "🍑" : emoji.coinFlip?.goma || "🐻"} **Your Choice:** ${choiceDisplay}\n\n` +
          `${emoji.loading || "⏳"} **Flipping the coin...**`
      )
      .setFooter({
        text: "🎲 Good luck! The coin is spinning...",
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.update({ embeds: [flipEmbed], components: [] });

    // Determine result
    const rand = client.utils.getRandomNumber(0, 1);
    let win = false;
    if (rand === 0 && choiceInternal === "g") win = true;
    else if (rand === 1 && choiceInternal === "p") win = true;

    const resultSide = rand === 0 ? "goma" : "peach";
    const resultDisplay = rand === 0 ? "Goma" : "Peach";

    // Update user balance
    const { coin, bank, coinflip } = user.balance;
    user.balance.coin = win ? coin + amount : coin - amount;
    user.balance.coinflip = coinflip + amount;
    user.balance.bank = bank;
    await user.save();

    // Show result after delay
    setTimeout(async () => {
      try {
        const resultCoin = win ? amount * 2 : amount;
        const resultEmbed = client
          .embed()
          .setColor(win ? color.success : color.danger)
          .setAuthor({
            name: `${interaction.user.displayName}'s Coinflip Result`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setThumbnail(
            client.utils.emojiToImage(
              resultSide === "peach"
                ? emoji.coinFlip?.peach || "🍑"
                : emoji.coinFlip?.goma || "🐻"
            )
          )
          .setDescription(
            `${win ? "🎉" : "💔"} **${win ? "CONGRATULATIONS!" : "BETTER LUCK NEXT TIME!"}**\n\n` +
              `${emoji.coin || "🪙"} **Your Bet:** ${client.utils.formatNumber(amount)} coins on ${choiceDisplay}\n` +
              `🎯 **Coin Landed On:** ${resultDisplay}\n` +
              `${win ? "💰" : "📉"} **Result:** You ${win ? "won" : "lost"} ${client.utils.formatNumber(resultCoin)} coins!\n\n` +
              `${emoji.bank || "💳"} **New Balance:** ${client.utils.formatNumber(user.balance.coin)} coins`
          )
          .addFields([
            {
              name: win ? "🏆 Victory Stats" : "📊 Game Stats",
              value: `${emoji.dice || "🎲"} **Total Gambled:** ${client.utils.formatNumber(user.balance.coinflip)} coins\n${win ? "🌟 Keep the winning streak going!" : "🎯 Try again for better luck!"}`,
            },
          ])
          .setFooter({
            text: win
              ? "🎊 Amazing win! Play again for more excitement!"
              : "💪 Don't give up! Fortune favors the brave!",
            iconURL: interaction.user.displayAvatarURL(),
          });

        // Add play again button
        const playAgainRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("play_again")
            .setLabel("Play Again")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🔄")
            .setDisabled(user.balance.coin < 1),
          new ButtonBuilder()
            .setCustomId("view_balance")
            .setLabel("View Balance")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(emoji.bank || "💳"),
          new ButtonBuilder()
            .setLabel("Gambling Tips")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/peachyganggg")
            .setEmoji("💡")
        );

        await interaction.editReply({
          embeds: [resultEmbed],
          components: [playAgainRow],
        });

        // Handle play again button
        const playAgainCollector =
          interaction.message.createMessageComponentCollector({
            filter: (i) =>
              i.user.id === interaction.user.id &&
              (i.customId === "play_again" || i.customId === "view_balance"),
            time: 300000, // 5 minutes
          });

        playAgainCollector.on("collect", async (buttonInteraction) => {
          if (buttonInteraction.customId === "play_again") {
            playAgainCollector.stop();
            const updatedUser = await client.utils.getUser(
              buttonInteraction.user.id
            );
            return this.showInteractiveUI(
              client,
              {
                sendMessage: async (data) => buttonInteraction.update(data),
                author: buttonInteraction.user,
                isInteraction: false,
              },
              color,
              emoji,
              language,
              updatedUser
            );
          } else if (buttonInteraction.customId === "view_balance") {
            const updatedUser = await client.utils.getUser(
              buttonInteraction.user.id
            );
            const balanceEmbed = client
              .embed()
              .setColor(color.main)
              .setAuthor({
                name: `${buttonInteraction.user.displayName}'s Balance`,
                iconURL: buttonInteraction.user.displayAvatarURL(),
              })
              .setDescription(
                `${emoji.coin || "🪙"} **Coins:** ${client.utils.formatNumber(updatedUser.balance.coin)}\n` +
                  `${emoji.bank || "🏦"} **Bank:** ${client.utils.formatNumber(updatedUser.balance.bank)}\n` +
                  `${emoji.dice || "🎲"} **Total Gambled:** ${client.utils.formatNumber(updatedUser.balance.coinflip)}`
              );

            await buttonInteraction.reply({
              embeds: [balanceEmbed],
              ephemeral: true,
            });
          }
        });
      } catch (error) {
        console.error("Error showing result:", error);
      }
    }, 2500);
  }

  async processTraditionalCommand(
    client,
    ctx,
    args,
    color,
    emoji,
    language,
    user
  ) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;
    const { coin, bank, coinflip } = user.balance;

    let amount = args[0];
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

    let choice = args[1];
    if (!choice) {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        coinflipMessages.invalidChoice,
        color
      );
    }

    if (choice.toLowerCase() === "peach" || choice.toLowerCase() === "p")
      choice = "p";
    else if (choice.toLowerCase() === "goma" || choice.toLowerCase() === "g")
      choice = "g";
    else {
      return client.utils.sendErrorMessage(
        client,
        ctx,
        coinflipMessages.invalidChoice,
        color
      );
    }

    return this.processCoinflipDirect(
      client,
      ctx,
      baseCoins,
      choice,
      color,
      emoji,
      language,
      user
    );
  }

  async processSlashCommand(client, ctx, color, emoji, language, user) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;
    const { coin } = user.balance;

    let amount =
      ctx.interaction.options.data.find((opt) => opt.name === "amount")
        ?.value || 1;
    let choice = ctx.interaction.options.getString("choice");

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

    if (choice === "p") choice = "peach";
    else if (choice === "g") choice = "goma";

    return this.processCoinflip(
      client,
      ctx.interaction,
      baseCoins,
      choice,
      color,
      emoji,
      language,
      user
    );
  }

  async processCoinflipDirect(
    client,
    ctx,
    amount,
    choice,
    color,
    emoji,
    language,
    user
  ) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const coinflipMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.coinflipMessages;
    const { coin, bank, coinflip } = user.balance;

    const choiceDisplay = choice === "p" ? "Peach" : "Goma";
    const rand = client.utils.getRandomNumber(0, 1);
    let win = false;
    if (rand === 0 && choice === "g") win = true;
    else if (rand === 1 && choice === "p") win = true;

    const flipEmbed = client
      .embed()
      .setColor(color.main)
      .setThumbnail(client.utils.emojiToImage(emoji.coinFlip.flip))
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", coinflipMessages.title)
          .replace("%{mainRight}", emoji.mainRight) +
          coinflipMessages.description
            .replace("%{coinEmote}", emoji.coin)
            .replace("%{coin}", client.utils.formatNumber(amount))
            .replace("%{choice}", choiceDisplay)
      )
      .setFooter({
        text: generalMessages.gameInProgress.replace(
          "%{user}",
          ctx.author.displayName
        ),
        iconURL: ctx.author.displayAvatarURL(),
      });

    await ctx.sendDeferMessage({ embeds: [flipEmbed] });

    user.balance.coin = win ? coin + amount : coin - amount;
    user.balance.coinflip = coinflip + amount;
    user.balance.bank = bank;
    await user.save();

    setTimeout(() => {
      const resultCoin = win ? amount * 2 : amount;
      const resultEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          client.utils.emojiToImage(
            win
              ? choice === "p"
                ? emoji.coinFlip.peach
                : emoji.coinFlip.goma
              : choice === "p"
                ? emoji.coinFlip.goma
                : emoji.coinFlip.peach
          )
        )
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", coinflipMessages.title)
            .replace("%{mainRight}", emoji.mainRight) +
            coinflipMessages.result
              .replace("%{coin}", client.utils.formatNumber(amount))
              .replace("%{coinEmote}", emoji.coin)
              .replace("%{choice}", choiceDisplay)
              .replace("%{result}", win ? "won" : "lost")
              .replace("%{resultCoin}", client.utils.formatNumber(resultCoin))
              .replace("%{coinEmote}", emoji.coin)
        )
        .setFooter({
          text: generalMessages.gameOver.replace(
            "%{user}",
            ctx.author.displayName
          ),
          iconURL: ctx.author.displayAvatarURL(),
        });

      ctx.editMessage({ embeds: [resultEmbed] });
    }, 2000);
  }
};
