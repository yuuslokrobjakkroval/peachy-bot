const Command = require("../../structures/Command.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const User = require("../../schemas/user");

module.exports = class EconomyOverview extends Command {
  constructor(client) {
    super(client, {
      name: "economy",
      description: {
        content: "Complete overview of your economy status and systems",
        examples: ["economy", "economy dashboard", "economy stats"],
        usage: "economy [dashboard|stats|quick]",
      },
      category: "economy",
      aliases: ["eco", "financial", "money"],
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
          name: "view",
          description: "What to view",
          type: 3,
          required: false,
          choices: [
            { name: "Complete Dashboard", value: "dashboard" },
            { name: "Quick Stats", value: "quick" },
            { name: "Income Sources", value: "income" },
            { name: "Expense Summary", value: "expenses" },
          ],
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

    const view = args[0]?.toLowerCase() || "dashboard";

    switch (view) {
      case "dashboard":
        await this.showCompleteDashboard(ctx, user, color, emoji);
        break;
      case "quick":
        await this.showQuickStats(ctx, user, color, emoji);
        break;
      case "income":
        await this.showIncomeStreams(ctx, user, color, emoji);
        break;
      case "expenses":
        await this.showExpenseSummary(ctx, user, color, emoji);
        break;
      default:
        await this.showCompleteDashboard(ctx, user, color, emoji);
    }
  }

  async showCompleteDashboard(ctx, user, color, emoji) {
    // Calculate various stats
    const totalWealth = this.calculateTotalWealth(user);
    const creditBankBalance = user.creditBank?.balance || 0;
    const miningLevel = user.creditMining?.level || 1;
    const totalMined = user.creditMining?.totalMined || 0;
    const monthlyExpenses = this.calculateMonthlyExpenses(user);
    const investmentValue = this.calculateInvestmentValue(user);

    // Calculate pending interest
    const pendingInterest = this.calculatePendingInterest(user);

    // Get top expense category
    const topExpenseCategory = this.getTopExpenseCategory(user);

    const dashboardEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("💼 PEACHY Financial Dashboard")
      .setDescription(
        `**💰 Wealth Overview:**\n` +
          `├ **Total Net Worth:** \`${totalWealth.toLocaleString()}\` credits\n` +
          `├ **Liquid Credits:** \`${user.balance.credit.toLocaleString()}\`\n` +
          `├ **Coins:** \`${user.balance.coin.toLocaleString()}\`\n` +
          `└ **Bank Balance:** \`${user.balance.bank.toLocaleString()}\`\n\n` +
          `**🏦 Credit Banking:**\n` +
          `├ **Savings:** \`${creditBankBalance.toLocaleString()}\` credits\n` +
          `├ **Pending Interest:** \`${pendingInterest.toLocaleString()}\` credits\n` +
          `└ **Total Interest Earned:** \`${(user.creditBank?.totalInterestEarned || 0).toLocaleString()}\`\n\n` +
          `**⛏️ Mining Operation:**\n` +
          `├ **Miner Level:** \`${miningLevel}\`\n` +
          `├ **Total Mined:** \`${totalMined.toLocaleString()}\` credits\n` +
          `└ **Mining Power:** \`${this.calculateMiningPower(user)}\`\n\n` +
          `**📊 Financial Activity:**\n` +
          `├ **Monthly Expenses:** \`${monthlyExpenses.toLocaleString()}\` credits\n` +
          `├ **Investment Portfolio:** \`${investmentValue.toLocaleString()}\` credits\n` +
          `└ **Top Expense:** ${topExpenseCategory}\n\n` +
          `**💡 Quick Actions:** Use the buttons below to access different systems!`
      )
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Financial Health: ${this.calculateFinancialHealth(user)} | Last Updated: ${new Date().toLocaleDateString()}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    const systemMenu = new StringSelectMenuBuilder()
      .setCustomId("economy_system")
      .setPlaceholder("🎯 Select a financial system to access...")
      .addOptions([
        {
          label: "Exchange Center",
          description: "Convert between coins and credits",
          value: "exchange",
          emoji: "💱",
        },
        {
          label: "Investment Portfolio",
          description: "Manage your investments",
          value: "investment",
          emoji: "📈",
        },
        {
          label: "Credit Bank",
          description: "Savings with interest",
          value: "creditbank",
          emoji: "🏦",
        },
        {
          label: "Credit Miner",
          description: "Mine credits with equipment",
          value: "creditminer",
          emoji: "⛏️",
        },
        {
          label: "Expense Tracker",
          description: "Track your spending",
          value: "expense",
          emoji: "💳",
        },
      ]);

    const quickButtons = [
      new ButtonBuilder()
        .setCustomId("quick_stats")
        .setLabel("Quick Stats")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊"),
      new ButtonBuilder()
        .setCustomId("income_streams")
        .setLabel("Income Sources")
        .setStyle(ButtonStyle.Success)
        .setEmoji("💰"),
      new ButtonBuilder()
        .setCustomId("expense_summary")
        .setLabel("Expenses")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("💸"),
      new ButtonBuilder()
        .setCustomId("financial_tips")
        .setLabel("Tips")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("💡"),
    ];

    const row1 = new ActionRowBuilder().addComponents(systemMenu);
    const row2 = new ActionRowBuilder().addComponents(quickButtons);

    const message = await ctx.sendMessage({
      embeds: [dashboardEmbed],
      components: [row1, row2],
    });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 300000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "economy_system") {
        const system = interaction.values[0];
        await interaction.followUp({
          content: `🎯 **Quick Access:** Use \`${ctx.prefix || "/"}${system}\` to access the ${system} system!`,
          ephemeral: true,
        });
      } else {
        switch (interaction.customId) {
          case "quick_stats":
            await this.showQuickStats(interaction, user, color, emoji, true);
            break;
          case "income_streams":
            await this.showIncomeStreams(interaction, user, color, emoji, true);
            break;
          case "expense_summary":
            await this.showExpenseSummary(
              interaction,
              user,
              color,
              emoji,
              true
            );
            break;
          case "financial_tips":
            await this.showFinancialTips(interaction, user, color, emoji, true);
            break;
        }
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }).catch(() => {});
    });
  }

  async showQuickStats(ctx, user, color, emoji, isInteraction = false) {
    const stats = {
      totalWealth: this.calculateTotalWealth(user),
      liquidCredits: user.balance.credit,
      savedCredits: user.creditBank?.balance || 0,
      monthlyExpenses: this.calculateMonthlyExpenses(user),
      totalMined: user.creditMining?.totalMined || 0,
      investmentReturns: user.investments?.totalReturns || 0,
    };

    const quickEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("📊 Quick Financial Stats")
      .addFields([
        {
          name: "💰 Wealth Summary",
          value:
            `**Total Net Worth:** \`${stats.totalWealth.toLocaleString()}\`\n` +
            `**Liquid Credits:** \`${stats.liquidCredits.toLocaleString()}\`\n` +
            `**Saved Credits:** \`${stats.savedCredits.toLocaleString()}\``,
          inline: true,
        },
        {
          name: "📈 Income Sources",
          value:
            `**Mining Total:** \`${stats.totalMined.toLocaleString()}\`\n` +
            `**Investment Returns:** \`${stats.investmentReturns.toLocaleString()}\`\n` +
            `**Interest Earned:** \`${(user.creditBank?.totalInterestEarned || 0).toLocaleString()}\``,
          inline: true,
        },
        {
          name: "💸 Spending",
          value:
            `**Monthly Expenses:** \`${stats.monthlyExpenses.toLocaleString()}\`\n` +
            `**Total Invested:** \`${(user.investments?.totalInvested || 0).toLocaleString()}\`\n` +
            `**Financial Health:** ${this.calculateFinancialHealth(user)}`,
          inline: true,
        },
      ])
      .setFooter({ text: "Use the main dashboard for detailed views" });

    if (isInteraction) {
      await ctx.update({ embeds: [quickEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [quickEmbed] });
    }
  }

  async showIncomeStreams(ctx, user, color, emoji, isInteraction = false) {
    const incomeEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("💰 Income Streams Analysis")
      .setDescription(
        `**Active Income Sources:**\n\n` +
          `⛏️ **Credit Mining**\n` +
          `├ Total Mined: \`${(user.creditMining?.totalMined || 0).toLocaleString()}\` credits\n` +
          `├ Current Level: \`${user.creditMining?.level || 1}\`\n` +
          `└ Status: ${this.getMiningStatus(user)}\n\n` +
          `🏦 **Credit Bank Interest**\n` +
          `├ Total Earned: \`${(user.creditBank?.totalInterestEarned || 0).toLocaleString()}\` credits\n` +
          `├ Current Balance: \`${(user.creditBank?.balance || 0).toLocaleString()}\` credits\n` +
          `└ Daily Rate: 2.0%\n\n` +
          `📈 **Investment Returns**\n` +
          `├ Total Returns: \`${(user.investments?.totalReturns || 0).toLocaleString()}\` credits\n` +
          `├ Success Rate: ${this.getInvestmentSuccessRate(user)}%\n` +
          `└ Portfolio Value: \`${this.calculateInvestmentValue(user).toLocaleString()}\` credits\n\n` +
          `**💡 Income Optimization Tips:**\n` +
          `• Mine credits every 2 hours for consistent income\n` +
          `• Keep credits in bank to earn daily interest\n` +
          `• Diversify investments across risk levels\n` +
          `• Upgrade mining equipment for better returns`
      );

    if (isInteraction) {
      await ctx.update({ embeds: [incomeEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [incomeEmbed] });
    }
  }

  async showExpenseSummary(ctx, user, color, emoji, isInteraction = false) {
    const monthlyExpenses = this.calculateMonthlyExpenses(user);
    const categoryBreakdown = this.getCategoryBreakdown(user);
    const totalInvested = user.investments?.totalInvested || 0;

    const expenseEmbed = new EmbedBuilder()
      .setColor(color.primary)
      .setTitle("💸 Expense Summary")
      .setDescription(
        `**Monthly Spending Breakdown:**\n\n` +
          `**💳 Tracked Expenses:** \`${monthlyExpenses.toLocaleString()}\` credits\n` +
          `**📈 Investments:** \`${totalInvested.toLocaleString()}\` credits\n` +
          `**🔧 Equipment Upgrades:** \`${this.calculateUpgradeExpenses(user).toLocaleString()}\` credits\n\n` +
          (categoryBreakdown.length > 0
            ? `**Top Spending Categories:**\n` +
              categoryBreakdown
                .map(
                  ([category, amount]) =>
                    `${this.getCategoryEmoji(category)} **${category}:** \`${amount.toLocaleString()}\` credits`
                )
                .join("\n")
            : `*No expense categories recorded*`) +
          `\n\n**💡 Expense Management Tips:**\n` +
          `• Track all expenses for better budgeting\n` +
          `• Set monthly spending limits per category\n` +
          `• Review expenses regularly to identify trends\n` +
          `• Balance spending with savings and investments`
      );

    if (isInteraction) {
      await ctx.update({ embeds: [expenseEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [expenseEmbed] });
    }
  }

  async showFinancialTips(ctx, user, color, emoji, isInteraction = false) {
    const wealth = this.calculateTotalWealth(user);
    const level = user.creditMining?.level || 1;

    let tips = [];

    if (wealth < 1000) {
      tips.push(
        "🌱 **Getting Started:** Focus on daily mining to build your credit base"
      );
      tips.push(
        "💡 **Quick Growth:** Complete daily tasks and use the exchange system"
      );
    } else if (wealth < 10000) {
      tips.push(
        "📈 **Building Wealth:** Start investing in low-risk bonds and real estate"
      );
      tips.push(
        "🏦 **Smart Saving:** Keep 30% of credits in the bank for interest"
      );
    } else {
      tips.push(
        "🎯 **Advanced Strategy:** Diversify across all investment types"
      );
      tips.push(
        "⚖️ **Risk Management:** Balance high-risk/high-reward investments"
      );
    }

    if (level < 5) {
      tips.push(
        "⛏️ **Mining Focus:** Upgrade your pickaxe first for consistent income"
      );
    } else {
      tips.push(
        "🔧 **Equipment Goals:** Invest in drills and explosives for maximum power"
      );
    }

    tips.push(
      "📊 **Track Everything:** Use expense tracker to monitor spending patterns"
    );
    tips.push(
      "💱 **Exchange Wisely:** Watch market rates for optimal conversion timing"
    );

    const tipsEmbed = new EmbedBuilder()
      .setColor(color.warning)
      .setTitle("💡 Personalized Financial Tips")
      .setDescription(
        `**Based on your current financial profile:**\n\n` +
          tips.join("\n\n") +
          `\n\n**🎯 Your Current Status:**\n` +
          `**Net Worth:** \`${wealth.toLocaleString()}\` credits\n` +
          `**Mining Level:** \`${level}\`\n` +
          `**Financial Health:** ${this.calculateFinancialHealth(user)}\n\n` +
          `**🏆 Next Milestone:** ${this.getNextMilestone(wealth)}`
      );

    if (isInteraction) {
      await ctx.update({ embeds: [tipsEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [tipsEmbed] });
    }
  }

  // Helper methods
  calculateTotalWealth(user) {
    return (
      (user.balance.credit || 0) +
      (user.balance.coin * 0.1 || 0) + // Coins at exchange rate
      (user.creditBank?.balance || 0) +
      this.calculateInvestmentValue(user)
    );
  }

  calculateMonthlyExpenses(user) {
    if (!user.expenses?.transactions) return 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return user.expenses.transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  calculateInvestmentValue(user) {
    if (!user.investments?.portfolio) return 0;
    return user.investments.portfolio
      .filter((inv) => inv.status === "active")
      .reduce((sum, inv) => sum + inv.currentValue, 0);
  }

  calculatePendingInterest(user) {
    if (!user.creditBank?.balance || !user.creditBank?.lastInterest) return 0;

    const hoursSince =
      (Date.now() - new Date(user.creditBank.lastInterest).getTime()) /
      (1000 * 60 * 60);
    const dailyInterest = Math.floor(user.creditBank.balance * 0.02);
    return Math.floor((hoursSince / 24) * dailyInterest);
  }

  calculateMiningPower(user) {
    if (!user.creditMining) return 10;

    const basePower = user.creditMining.level * 10;
    const equipmentPower =
      user.creditMining.equipment.pickaxe * 5 +
      user.creditMining.equipment.drill * 15 +
      user.creditMining.equipment.explosives * 25;
    return basePower + equipmentPower;
  }

  calculateFinancialHealth(user) {
    const wealth = this.calculateTotalWealth(user);
    const monthlyExpenses = this.calculateMonthlyExpenses(user);
    const savings = user.creditBank?.balance || 0;

    if (wealth > 50000 && savings > 10000) return "Excellent 🌟";
    if (wealth > 20000 && savings > 5000) return "Very Good 📈";
    if (wealth > 10000 && savings > 2000) return "Good 👍";
    if (wealth > 5000) return "Fair 📊";
    return "Building 🌱";
  }

  getTopExpenseCategory(user) {
    if (!user.expenses?.transactions) return "None tracked";

    const categories = {};
    user.expenses.transactions.forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const top = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];
    return top
      ? `${this.getCategoryEmoji(top[0])} ${top[0]} (${top[1].toLocaleString()})`
      : "None";
  }

  getCategoryBreakdown(user) {
    if (!user.expenses?.transactions) return [];

    const categories = {};
    user.expenses.transactions.forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }

  getCategoryEmoji(category) {
    const emojis = {
      food: "🍔",
      entertainment: "🎮",
      shopping: "🛍️",
      transport: "🚗",
      bills: "📄",
      investment: "📈",
      other: "💳",
    };
    return emojis[category] || "💳";
  }

  calculateUpgradeExpenses(user) {
    // This would track equipment upgrade expenses
    // For now, returning 0 as placeholder
    return 0;
  }

  getMiningStatus(user) {
    if (!user.creditMining?.lastMine) return "Ready to start!";

    const hoursSince =
      (Date.now() - new Date(user.creditMining.lastMine).getTime()) /
      (1000 * 60 * 60);
    return hoursSince >= 2
      ? "Ready to mine!"
      : `Cooldown: ${(2 - hoursSince).toFixed(1)}h`;
  }

  getInvestmentSuccessRate(user) {
    if (!user.investments) return 0;
    const total =
      user.investments.successfulInvestments +
      user.investments.failedInvestments;
    return total > 0
      ? Math.round((user.investments.successfulInvestments / total) * 100)
      : 0;
  }

  getNextMilestone(wealth) {
    if (wealth < 1000) return "Reach 1,000 credits";
    if (wealth < 5000) return "Reach 5,000 credits";
    if (wealth < 10000) return "Reach 10,000 credits";
    if (wealth < 25000) return "Reach 25,000 credits";
    if (wealth < 50000) return "Reach 50,000 credits";
    return "Financial mastery achieved! 🏆";
  }
};
