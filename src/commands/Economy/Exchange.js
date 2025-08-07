const Command = require("../../structures/Command.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const User = require("../../schemas/user");

module.exports = class Exchange extends Command {
  constructor(client) {
    super(client, {
      name: "exchange",
      description: {
        content: "Exchange between coins and credits with dynamic rates",
        examples: ["exchange", "exchange coin 1000", "exchange credit 500"],
        usage: "exchange [type] [amount]",
      },
      category: "economy",
      aliases: ["ex", "swap", "convert"],
      cooldown: 5,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "type",
          description: "What to exchange (coin or credit)",
          type: 3,
          required: false,
          choices: [
            { name: "Coin to Credit", value: "coin" },
            { name: "Credit to Coin", value: "credit" },
          ],
        },
        {
          name: "amount",
          description: "Amount to exchange",
          type: 4,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const user = await User.findOne({ userId: ctx.author.id });
    if (!user) {
      return ctx.sendMessage({
        embeds: [
          new EmbedBuilder()
            .setColor(color.danger)
            .setTitle("❌ Account Not Found")
            .setDescription(
              "Please create an account first by using any economy command!"
            ),
        ],
      });
    }

    // Dynamic exchange rates (simulates market fluctuation)
    const baseRates = {
      coinToCredit: 0.1, // 1 coin = 0.1 credit
      creditToCoin: 8.5, // 1 credit = 8.5 coins
    };

    // Add some randomness to rates (±10%)
    const fluctuation = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1
    const currentRates = {
      coinToCredit: Math.max(0.05, baseRates.coinToCredit * (1 + fluctuation)),
      creditToCoin: Math.max(5, baseRates.creditToCoin * (1 + fluctuation)),
    };

    if (!args[0]) {
      // Show exchange interface
      const exchangeEmbed = new EmbedBuilder()
        .setColor(color.main)
        .setTitle("💱 PEACHY Exchange Center")
        .setDescription(
          "**Current Exchange Rates** *(Updated every transaction)*\n\n" +
            `💰 **1 Coin** → **${currentRates.coinToCredit.toFixed(3)} Credit**\n` +
            `🏆 **1 Credit** → **${currentRates.creditToCoin.toFixed(1)} Coins**\n\n` +
            `**Your Balance:**\n` +
            `${emoji.economy?.coin || "💰"} **Coins:** \`${user.balance.coin.toLocaleString()}\`\n` +
            `${emoji.economy?.credit || "🏆"} **Credits:** \`${user.balance.credit.toLocaleString()}\`\n\n` +
            `**Exchange Fee:** 2% per transaction\n` +
            `**Market Status:** ${fluctuation > 0 ? "📈 Rising" : fluctuation < 0 ? "📉 Falling" : "📊 Stable"}`
        )
        .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Select exchange type below" })
        .setTimestamp();

      const exchangeMenu = new StringSelectMenuBuilder()
        .setCustomId("exchange_type")
        .setPlaceholder("Choose what to exchange...")
        .addOptions([
          {
            label: "Coin → Credit",
            description: `Convert coins to credits (Rate: ${currentRates.coinToCredit.toFixed(3)})`,
            value: "coin_to_credit",
            emoji: "💰",
          },
          {
            label: "Credit → Coin",
            description: `Convert credits to coins (Rate: ${currentRates.creditToCoin.toFixed(1)})`,
            value: "credit_to_coin",
            emoji: "🏆",
          },
          {
            label: "Quick Exchange",
            description: "Fast exchange with preset amounts",
            value: "quick_exchange",
            emoji: "⚡",
          },
        ]);

      const row = new ActionRowBuilder().addComponents(exchangeMenu);

      const message = await ctx.sendMessage({
        embeds: [exchangeEmbed],
        components: [row],
      });

      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        time: 300000, // 5 minutes
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "exchange_type") {
          const choice = interaction.values[0];

          if (choice === "quick_exchange") {
            await this.showQuickExchange(
              interaction,
              user,
              currentRates,
              color,
              emoji
            );
          } else {
            await this.showAmountInput(
              interaction,
              choice,
              user,
              currentRates,
              color,
              emoji
            );
          }
        } else if (interaction.customId.startsWith("quick_")) {
          await this.processQuickExchange(
            interaction,
            user,
            currentRates,
            color,
            emoji
          );
        } else if (interaction.customId.startsWith("exchange_")) {
          await this.processExchange(
            interaction,
            user,
            currentRates,
            color,
            emoji
          );
        }
      });

      collector.on("end", () => {
        message.edit({ components: [] }).catch(() => {});
      });
    } else {
      // Direct exchange command
      const type = args[0].toLowerCase();
      const amount = parseInt(args[1]);

      if (!["coin", "credit"].includes(type)) {
        return ctx.sendMessage({
          embeds: [
            new EmbedBuilder()
              .setColor(color.danger)
              .setTitle("❌ Invalid Type")
              .setDescription(
                "Please specify `coin` or `credit` as the exchange type!"
              ),
          ],
        });
      }

      if (!amount || amount <= 0) {
        return ctx.sendMessage({
          embeds: [
            new EmbedBuilder()
              .setColor(color.danger)
              .setTitle("❌ Invalid Amount")
              .setDescription("Please specify a valid positive amount!"),
          ],
        });
      }

      await this.executeExchange(
        ctx,
        user,
        type,
        amount,
        currentRates,
        color,
        emoji
      );
    }
  }

  async showQuickExchange(interaction, user, rates, color, emoji) {
    const quickEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("⚡ Quick Exchange")
      .setDescription(
        "Choose from preset amounts for fast exchanges:\n\n" +
          `**Your Balance:**\n` +
          `💰 **Coins:** \`${user.balance.coin.toLocaleString()}\`\n` +
          `🏆 **Credits:** \`${user.balance.credit.toLocaleString()}\``
      );

    const quickButtons = [
      new ButtonBuilder()
        .setCustomId("quick_coin_1000")
        .setLabel("1,000 → Credit")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💰"),
      new ButtonBuilder()
        .setCustomId("quick_coin_5000")
        .setLabel("5,000 → Credit")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💰"),
      new ButtonBuilder()
        .setCustomId("quick_credit_10")
        .setLabel("10 → Coins")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🏆"),
      new ButtonBuilder()
        .setCustomId("quick_credit_50")
        .setLabel("50 → Coins")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🏆"),
    ];

    const row = new ActionRowBuilder().addComponents(quickButtons);

    await interaction.update({
      embeds: [quickEmbed],
      components: [row],
    });
  }

  async showAmountInput(interaction, type, user, rates, color, emoji) {
    const isCoinsToCredit = type === "coin_to_credit";
    const maxAmount = isCoinsToCredit ? user.balance.coin : user.balance.credit;
    const rate = isCoinsToCredit ? rates.coinToCredit : rates.creditToCoin;

    const inputEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle(
        `💱 ${isCoinsToCredit ? "Coin → Credit" : "Credit → Coin"} Exchange`
      )
      .setDescription(
        `**Current Rate:** 1 ${isCoinsToCredit ? "Coin" : "Credit"} = ${rate.toFixed(3)} ${isCoinsToCredit ? "Credit" : "Coins"}\n` +
          `**Available:** \`${maxAmount.toLocaleString()}\` ${isCoinsToCredit ? "Coins" : "Credits"}\n` +
          `**Fee:** 2% of transaction\n\n` +
          "Choose an amount to exchange:"
      );

    const amountButtons = [];
    const percentages = [25, 50, 75, 100];

    percentages.forEach((percent) => {
      const amount = Math.floor(maxAmount * (percent / 100));
      if (amount > 0) {
        amountButtons.push(
          new ButtonBuilder()
            .setCustomId(`exchange_${type}_${amount}`)
            .setLabel(`${percent}% (${amount.toLocaleString()})`)
            .setStyle(
              percent === 100 ? ButtonStyle.Danger : ButtonStyle.Secondary
            )
        );
      }
    });

    const row = new ActionRowBuilder().addComponents(amountButtons.slice(0, 4));

    await interaction.update({
      embeds: [inputEmbed],
      components: [row],
    });
  }

  async processQuickExchange(interaction, user, rates, color, emoji) {
    const [, type, amount] = interaction.customId.split("_");
    const exchangeAmount = parseInt(amount);

    await this.executeExchange(
      interaction,
      user,
      type,
      exchangeAmount,
      rates,
      color,
      emoji,
      true
    );
  }

  async processExchange(interaction, user, rates, color, emoji) {
    const parts = interaction.customId.split("_");
    const type = parts[1] === "coin" ? "coin" : "credit";
    const amount = parseInt(parts[parts.length - 1]);

    await this.executeExchange(
      interaction,
      user,
      type,
      amount,
      rates,
      color,
      emoji,
      true
    );
  }

  async executeExchange(
    ctx,
    user,
    type,
    amount,
    rates,
    color,
    emoji,
    isInteraction = false
  ) {
    const isCoinsToCredit = type === "coin";
    const fee = Math.ceil(amount * 0.02); // 2% fee
    const netAmount = amount - fee;

    // Check if user has enough balance
    const currentBalance = isCoinsToCredit
      ? user.balance.coin
      : user.balance.credit;
    if (currentBalance < amount) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Insufficient Balance")
        .setDescription(
          `You don't have enough ${isCoinsToCredit ? "coins" : "credits"}!\n\nRequired: \`${amount.toLocaleString()}\`\nAvailable: \`${currentBalance.toLocaleString()}\``
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Calculate exchange
    const rate = isCoinsToCredit ? rates.coinToCredit : rates.creditToCoin;
    const received = Math.floor(netAmount * rate);

    // Update balances
    if (isCoinsToCredit) {
      user.balance.coin -= amount;
      user.balance.credit += received;
    } else {
      user.balance.credit -= amount;
      user.balance.coin += received;
    }

    await user.save();

    // Success embed
    const successEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("✅ Exchange Successful!")
      .setDescription(
        `**Transaction Details:**\n` +
          `${isCoinsToCredit ? "💰" : "🏆"} **Exchanged:** \`${amount.toLocaleString()}\` ${isCoinsToCredit ? "Coins" : "Credits"}\n` +
          `💸 **Fee:** \`${fee.toLocaleString()}\` (2%)\n` +
          `${isCoinsToCredit ? "🏆" : "💰"} **Received:** \`${received.toLocaleString()}\` ${isCoinsToCredit ? "Credits" : "Coins"}\n` +
          `📊 **Rate:** 1 ${isCoinsToCredit ? "Coin" : "Credit"} = ${rate.toFixed(3)} ${isCoinsToCredit ? "Credits" : "Coins"}\n\n` +
          `**New Balance:**\n` +
          `💰 **Coins:** \`${user.balance.coin.toLocaleString()}\`\n` +
          `🏆 **Credits:** \`${user.balance.credit.toLocaleString()}\``
      )
      .setThumbnail(
        ctx.author
          ? ctx.author.displayAvatarURL({ dynamic: true })
          : ctx.user.displayAvatarURL({ dynamic: true })
      )
      .setTimestamp();

    if (isInteraction) {
      await ctx.update({ embeds: [successEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [successEmbed] });
    }
  }
};
