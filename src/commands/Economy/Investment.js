const Command = require("../../structures/Command.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const User = require("../../schemas/user");

module.exports = class Investment extends Command {
  constructor(client) {
    super(client, {
      name: "investment",
      description: {
        content: "Invest your credits in various schemes with risk and reward",
        examples: [
          "investment",
          "investment stocks 100",
          "investment crypto 50",
        ],
        usage: "investment [type] [amount]",
      },
      category: "economy",
      aliases: ["invest", "trade", "stocks"],
      cooldown: 10,
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
          description: "Investment type",
          type: 3,
          required: false,
          choices: [
            { name: "Safe Bonds (Low Risk, Low Return)", value: "bonds" },
            {
              name: "Stock Market (Medium Risk, Medium Return)",
              value: "stocks",
            },
            {
              name: "Cryptocurrency (High Risk, High Return)",
              value: "crypto",
            },
            {
              name: "Real Estate (Very Low Risk, Steady Return)",
              value: "realestate",
            },
          ],
        },
        {
          name: "amount",
          description: "Amount of credits to invest",
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
            .setDescription("Please create an account first!"),
        ],
      });
    }

    // Investment types with their characteristics
    const investments = {
      bonds: {
        name: "Government Bonds",
        emoji: "🏛️",
        riskLevel: "Very Low",
        minReturn: 0.95,
        maxReturn: 1.15,
        successRate: 95,
        description: "Stable government-backed securities",
        minInvestment: 50,
      },
      realestate: {
        name: "Real Estate",
        emoji: "🏠",
        riskLevel: "Low",
        minReturn: 0.9,
        maxReturn: 1.25,
        successRate: 85,
        description: "Property investments with steady growth",
        minInvestment: 100,
      },
      stocks: {
        name: "Stock Market",
        emoji: "📈",
        riskLevel: "Medium",
        minReturn: 0.7,
        maxReturn: 1.6,
        successRate: 70,
        description: "Traditional stock market investments",
        minInvestment: 25,
      },
      crypto: {
        name: "Cryptocurrency",
        emoji: "₿",
        riskLevel: "High",
        minReturn: 0.3,
        maxReturn: 2.5,
        successRate: 55,
        description: "Volatile digital currency trading",
        minInvestment: 10,
      },
    };

    if (!args[0]) {
      // Show investment dashboard
      const dashboardEmbed = new EmbedBuilder()
        .setColor(color.main)
        .setTitle("💼 PEACHY Investment Portfolio")
        .setDescription(
          `**Your Credits:** \`${user.balance.credit.toLocaleString()}\` 🏆\n\n` +
            "**Available Investment Options:**\n\n" +
            Object.entries(investments)
              .map(
                ([key, inv]) =>
                  `${inv.emoji} **${inv.name}**\n` +
                  `├ Risk Level: **${inv.riskLevel}**\n` +
                  `├ Success Rate: **${inv.successRate}%**\n` +
                  `├ Min Investment: **${inv.minInvestment} credits**\n` +
                  `└ *${inv.description}*`
              )
              .join("\n\n") +
            "\n\n💡 **Tip:** Higher risk = Higher potential rewards!"
        )
        .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Select an investment type below" })
        .setTimestamp();

      const investmentMenu = new StringSelectMenuBuilder()
        .setCustomId("investment_type")
        .setPlaceholder("Choose your investment strategy...")
        .addOptions(
          Object.entries(investments).map(([key, inv]) => ({
            label: inv.name,
            description: `${inv.riskLevel} Risk • ${inv.successRate}% Success Rate`,
            value: key,
            emoji: inv.emoji,
          }))
        );

      const portfolioBtn = new ButtonBuilder()
        .setCustomId("view_portfolio")
        .setLabel("View Portfolio")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊");

      const row1 = new ActionRowBuilder().addComponents(investmentMenu);
      const row2 = new ActionRowBuilder().addComponents(portfolioBtn);

      const message = await ctx.sendMessage({
        embeds: [dashboardEmbed],
        components: [row1, row2],
      });

      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        time: 300000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "investment_type") {
          const investmentType = interaction.values[0];
          await this.showInvestmentAmounts(
            interaction,
            user,
            investments[investmentType],
            investmentType,
            color,
            emoji
          );
        } else if (interaction.customId === "view_portfolio") {
          await this.showPortfolio(interaction, user, color, emoji);
        } else if (interaction.customId.startsWith("invest_")) {
          await this.processInvestment(
            interaction,
            user,
            investments,
            color,
            emoji
          );
        }
      });

      collector.on("end", () => {
        message.edit({ components: [] }).catch(() => {});
      });
    } else {
      // Direct investment command
      const type = args[0].toLowerCase();
      const amount = parseInt(args[1]);

      if (!investments[type]) {
        return ctx.sendMessage({
          embeds: [
            new EmbedBuilder()
              .setColor(color.danger)
              .setTitle("❌ Invalid Investment Type")
              .setDescription(
                `Available types: ${Object.keys(investments).join(", ")}`
              ),
          ],
        });
      }

      if (!amount || amount < investments[type].minInvestment) {
        return ctx.sendMessage({
          embeds: [
            new EmbedBuilder()
              .setColor(color.danger)
              .setTitle("❌ Invalid Amount")
              .setDescription(
                `Minimum investment for ${investments[type].name}: ${investments[type].minInvestment} credits`
              ),
          ],
        });
      }

      await this.executeInvestment(
        ctx,
        user,
        type,
        amount,
        investments[type],
        color,
        emoji
      );
    }
  }

  async showInvestmentAmounts(
    interaction,
    user,
    investment,
    type,
    color,
    emoji
  ) {
    const maxInvest = Math.min(user.balance.credit, 10000); // Cap at 10k for UI

    const amountEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle(`${investment.emoji} ${investment.name} Investment`)
      .setDescription(
        `**Investment Details:**\n` +
          `├ Risk Level: **${investment.riskLevel}**\n` +
          `├ Success Rate: **${investment.successRate}%**\n` +
          `├ Potential Returns: **${(investment.minReturn * 100).toFixed(0)}% - ${(investment.maxReturn * 100).toFixed(0)}%**\n` +
          `├ Minimum: **${investment.minInvestment} credits**\n` +
          `└ *${investment.description}*\n\n` +
          `**Your Credits:** \`${user.balance.credit.toLocaleString()}\`\n\n` +
          "Choose investment amount:"
      );

    const amountButtons = [];
    const amounts = [
      investment.minInvestment,
      Math.floor(maxInvest * 0.1),
      Math.floor(maxInvest * 0.25),
      Math.floor(maxInvest * 0.5),
    ].filter(
      (amt, index, arr) =>
        amt >= investment.minInvestment && arr.indexOf(amt) === index
    );

    amounts.forEach((amount) => {
      if (amount <= user.balance.credit) {
        amountButtons.push(
          new ButtonBuilder()
            .setCustomId(`invest_${type}_${amount}`)
            .setLabel(`${amount.toLocaleString()} Credits`)
            .setStyle(ButtonStyle.Primary)
        );
      }
    });

    const row = new ActionRowBuilder().addComponents(amountButtons.slice(0, 4));

    await interaction.update({
      embeds: [amountEmbed],
      components: [row],
    });
  }

  async showPortfolio(interaction, user, color, emoji) {
    // This would show user's investment history
    // For now, showing a placeholder
    const portfolioEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("📊 Your Investment Portfolio")
      .setDescription(
        "**Portfolio Summary:**\n" +
          `💰 **Total Invested:** \`Coming Soon\`\n` +
          `📈 **Total Returns:** \`Coming Soon\`\n` +
          `📊 **Success Rate:** \`Coming Soon\`\n\n` +
          "*Portfolio tracking will be available in the next update!*"
      );

    await interaction.update({ embeds: [portfolioEmbed], components: [] });
  }

  async processInvestment(interaction, user, investments, color, emoji) {
    const [, type, amount] = interaction.customId.split("_");
    const investAmount = parseInt(amount);
    const investment = investments[type];

    await this.executeInvestment(
      interaction,
      user,
      type,
      investAmount,
      investment,
      color,
      emoji,
      true
    );
  }

  async executeInvestment(
    ctx,
    user,
    type,
    amount,
    investment,
    color,
    emoji,
    isInteraction = false
  ) {
    // Check if user has enough credits
    if (user.balance.credit < amount) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Insufficient Credits")
        .setDescription(
          `You need ${amount.toLocaleString()} credits but only have ${user.balance.credit.toLocaleString()}!`
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Deduct investment amount
    user.balance.credit -= amount;

    // Calculate success
    const success = Math.random() * 100 <= investment.successRate;
    let multiplier, outcome, outcomeColor;

    if (success) {
      // Successful investment
      multiplier =
        investment.minReturn +
        Math.random() * (investment.maxReturn - investment.minReturn);
      outcome = "SUCCESS";
      outcomeColor = color.success;
    } else {
      // Failed investment
      multiplier = investment.minReturn * (0.3 + Math.random() * 0.4); // 30-70% of min return
      outcome = "LOSS";
      outcomeColor = color.danger;
    }

    const returnAmount = Math.floor(amount * multiplier);
    const profit = returnAmount - amount;

    // Add returns to credits
    user.balance.credit += returnAmount;

    await user.save();

    // Result embed
    const resultEmbed = new EmbedBuilder()
      .setColor(outcomeColor)
      .setTitle(`${investment.emoji} Investment ${outcome}!`)
      .setDescription(
        `**${investment.name} Investment Results:**\n\n` +
          `💸 **Invested:** \`${amount.toLocaleString()}\` credits\n` +
          `📊 **Multiplier:** \`${multiplier.toFixed(2)}x\`\n` +
          `💰 **Returned:** \`${returnAmount.toLocaleString()}\` credits\n` +
          `${profit >= 0 ? "📈" : "📉"} **Profit/Loss:** \`${profit >= 0 ? "+" : ""}${profit.toLocaleString()}\` credits\n\n` +
          `**New Credit Balance:** \`${user.balance.credit.toLocaleString()}\` 🏆\n\n` +
          `${success ? "🎉 **Congratulations!** Your investment paid off!" : "😔 **Better luck next time!** The market can be unpredictable."}`
      )
      .setThumbnail(
        ctx.author
          ? ctx.author.displayAvatarURL({ dynamic: true })
          : ctx.user.displayAvatarURL({ dynamic: true })
      )
      .setTimestamp();

    if (isInteraction) {
      await ctx.update({ embeds: [resultEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [resultEmbed] });
    }
  }
};
