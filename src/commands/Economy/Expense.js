const Command = require("../../structures/Command.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const User = require("../../schemas/user");

module.exports = class Expense extends Command {
  constructor(client) {
    super(client, {
      name: "expense",
      description: {
        content: "Track your spending and manage expenses with categories",
        examples: [
          "expense",
          "expense add food 50",
          "expense category shopping",
        ],
        usage: "expense [add|view|category] [category] [amount]",
      },
      category: "economy",
      aliases: ["spend", "track", "budget"],
      cooldown: 3,
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
          name: "action",
          description: "What to do",
          type: 3,
          required: false,
          choices: [
            { name: "Add Expense", value: "add" },
            { name: "View Expenses", value: "view" },
            { name: "View by Category", value: "category" },
            { name: "Monthly Report", value: "report" },
          ],
        },
        {
          name: "category",
          description: "Expense category",
          type: 3,
          required: false,
        },
        {
          name: "amount",
          description: "Amount spent",
          type: 4,
          required: false,
        },
        {
          name: "description",
          description: "What you spent on",
          type: 3,
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

    // Initialize expense tracking if it doesn't exist
    if (!user.expenses) {
      user.expenses = {
        transactions: [],
        monthlyBudget: 0,
        categories: [
          "food",
          "entertainment",
          "shopping",
          "transport",
          "bills",
          "other",
        ],
      };
    }

    const categories = {
      food: { emoji: "🍔", name: "Food & Dining", color: "#FF6B6B" },
      entertainment: { emoji: "🎮", name: "Entertainment", color: "#4ECDC4" },
      shopping: { emoji: "🛍️", name: "Shopping", color: "#45B7D1" },
      transport: { emoji: "🚗", name: "Transportation", color: "#96CEB4" },
      bills: { emoji: "📄", name: "Bills & Utilities", color: "#FFEAA7" },
      investment: { emoji: "📈", name: "Investments", color: "#DDA0DD" },
      other: { emoji: "💳", name: "Other", color: "#95A5A6" },
    };

    if (!args[0]) {
      await this.showExpenseDashboard(ctx, user, categories, color, emoji);
    } else {
      const action = args[0].toLowerCase();

      switch (action) {
        case "add":
          if (!args[1] || !args[2]) {
            return this.showAddExpenseForm(ctx, user, categories, color, emoji);
          }
          await this.addExpense(
            ctx,
            user,
            args[1],
            parseInt(args[2]),
            args.slice(3).join(" "),
            categories,
            color,
            emoji
          );
          break;

        case "view":
          await this.showExpenseHistory(ctx, user, categories, color, emoji);
          break;

        case "category":
          await this.showCategoryBreakdown(
            ctx,
            user,
            args[1],
            categories,
            color,
            emoji
          );
          break;

        case "report":
          await this.showMonthlyReport(ctx, user, categories, color, emoji);
          break;

        default:
          await this.showExpenseDashboard(ctx, user, categories, color, emoji);
      }
    }
  }

  async showExpenseDashboard(ctx, user, categories, color, emoji) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = (user.expenses?.transactions || []).filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const totalMonthly = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
    const categoryTotals = {};

    Object.keys(categories).forEach((cat) => {
      categoryTotals[cat] = monthlyExpenses
        .filter((t) => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const dashboardEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("💳 Expense Tracker Dashboard")
      .setDescription(
        `**Current Balance:**\n` +
          `💰 **Coins:** \`${user.balance.coin.toLocaleString()}\`\n` +
          `🏆 **Credits:** \`${user.balance.credit.toLocaleString()}\`\n\n` +
          `**This Month's Spending:**\n` +
          `💸 **Total Expenses:** \`${totalMonthly.toLocaleString()}\` credits\n` +
          `📊 **Transactions:** \`${monthlyExpenses.length}\`\n\n` +
          `**Top Categories:**\n` +
          (topCategories.length > 0
            ? topCategories
                .map(
                  ([cat, amount]) =>
                    `${categories[cat].emoji} **${categories[cat].name}:** \`${amount.toLocaleString()}\` credits`
                )
                .join("\n")
            : "*No expenses recorded this month*")
      )
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Select an action below" })
      .setTimestamp();

    const actionMenu = new StringSelectMenuBuilder()
      .setCustomId("expense_action")
      .setPlaceholder("Choose an action...")
      .addOptions([
        {
          label: "Add Expense",
          description: "Record a new expense",
          value: "add_expense",
          emoji: "➕",
        },
        {
          label: "View History",
          description: "See all your expenses",
          value: "view_history",
          emoji: "📋",
        },
        {
          label: "Category Report",
          description: "Breakdown by category",
          value: "category_report",
          emoji: "📊",
        },
        {
          label: "Monthly Summary",
          description: "This month's report",
          value: "monthly_summary",
          emoji: "📅",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(actionMenu);

    const message = await ctx.sendMessage({
      embeds: [dashboardEmbed],
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 300000,
    });

    collector.on("collect", async (interaction) => {
      switch (interaction.values[0]) {
        case "add_expense":
          await this.showAddExpenseForm(
            interaction,
            user,
            categories,
            color,
            emoji,
            true
          );
          break;
        case "view_history":
          await this.showExpenseHistory(
            interaction,
            user,
            categories,
            color,
            emoji,
            true
          );
          break;
        case "category_report":
          await this.showCategoryBreakdown(
            interaction,
            user,
            null,
            categories,
            color,
            emoji,
            true
          );
          break;
        case "monthly_summary":
          await this.showMonthlyReport(
            interaction,
            user,
            categories,
            color,
            emoji,
            true
          );
          break;
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }).catch(() => {});
    });
  }

  async showAddExpenseForm(
    ctx,
    user,
    categories,
    color,
    emoji,
    isInteraction = false
  ) {
    const formEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("➕ Add New Expense")
      .setDescription(
        "Select a category for your expense:\n\n" +
          Object.entries(categories)
            .map(([key, cat]) => `${cat.emoji} **${cat.name}**`)
            .join("\n")
      );

    const categoryMenu = new StringSelectMenuBuilder()
      .setCustomId("expense_category")
      .setPlaceholder("Choose expense category...")
      .addOptions(
        Object.entries(categories).map(([key, cat]) => ({
          label: cat.name,
          value: key,
          emoji: cat.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(categoryMenu);

    if (isInteraction) {
      await ctx.update({ embeds: [formEmbed], components: [row] });
    } else {
      await ctx.sendMessage({ embeds: [formEmbed], components: [row] });
    }
  }

  async addExpense(
    ctx,
    user,
    category,
    amount,
    description,
    categories,
    color,
    emoji,
    isInteraction = false
  ) {
    if (!categories[category]) {
      category = "other";
    }

    if (amount <= 0 || amount > user.balance.credit) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Invalid Amount")
        .setDescription(
          amount <= 0
            ? "Amount must be greater than 0!"
            : `You don't have enough credits! Available: ${user.balance.credit.toLocaleString()}`
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Initialize expenses if needed
    if (!user.expenses) {
      user.expenses = {
        transactions: [],
        monthlyBudget: 0,
        categories: Object.keys(categories),
      };
    }

    // Deduct from credits
    user.balance.credit -= amount;

    // Add expense record
    const expense = {
      category,
      amount,
      description: description || "No description",
      date: new Date(),
      id: Date.now().toString(),
    };

    user.expenses.transactions.push(expense);
    await user.save();

    const successEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("✅ Expense Added!")
      .setDescription(
        `**Expense Details:**\n` +
          `${categories[category].emoji} **Category:** ${categories[category].name}\n` +
          `💸 **Amount:** \`${amount.toLocaleString()}\` credits\n` +
          `📝 **Description:** ${description || "No description"}\n` +
          `📅 **Date:** ${new Date().toLocaleDateString()}\n\n` +
          `**Remaining Credits:** \`${user.balance.credit.toLocaleString()}\` 🏆`
      )
      .setTimestamp();

    if (isInteraction) {
      await ctx.update({ embeds: [successEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [successEmbed] });
    }
  }

  async showExpenseHistory(
    ctx,
    user,
    categories,
    color,
    emoji,
    isInteraction = false
  ) {
    const transactions = user.expenses?.transactions || [];
    const recent = transactions.slice(-10).reverse();

    const historyEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("📋 Expense History")
      .setDescription(
        recent.length > 0
          ? recent
              .map(
                (t) =>
                  `${categories[t.category]?.emoji || "💳"} **${t.amount.toLocaleString()}** credits\n` +
                  `└ *${t.description}* • ${new Date(t.date).toLocaleDateString()}`
              )
              .join("\n\n")
          : "*No expenses recorded yet*"
      )
      .setFooter({ text: `Showing last ${recent.length} transactions` });

    if (isInteraction) {
      await ctx.update({ embeds: [historyEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [historyEmbed] });
    }
  }

  async showCategoryBreakdown(
    ctx,
    user,
    targetCategory,
    categories,
    color,
    emoji,
    isInteraction = false
  ) {
    const transactions = user.expenses?.transactions || [];
    const categoryTotals = {};

    Object.keys(categories).forEach((cat) => {
      categoryTotals[cat] = transactions
        .filter((t) => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .filter(([, amount]) => amount > 0);

    const total = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);

    const breakdownEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("📊 Expense Breakdown by Category")
      .setDescription(
        sortedCategories.length > 0
          ? sortedCategories
              .map(([cat, amount]) => {
                const percentage =
                  total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                return (
                  `${categories[cat].emoji} **${categories[cat].name}**\n` +
                  `└ \`${amount.toLocaleString()}\` credits (${percentage}%)`
                );
              })
              .join("\n\n")
          : "*No expenses recorded*"
      )
      .setFooter({ text: `Total: ${total.toLocaleString()} credits` });

    if (isInteraction) {
      await ctx.update({ embeds: [breakdownEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [breakdownEmbed] });
    }
  }

  async showMonthlyReport(
    ctx,
    user,
    categories,
    color,
    emoji,
    isInteraction = false
  ) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyExpenses = (user.expenses?.transactions || []).filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const total = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
    const avgPerDay = total / new Date().getDate();

    const reportEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle(`📅 ${monthNames[currentMonth]} ${currentYear} Report`)
      .setDescription(
        `**Monthly Summary:**\n` +
          `💸 **Total Spent:** \`${total.toLocaleString()}\` credits\n` +
          `📊 **Transactions:** \`${monthlyExpenses.length}\`\n` +
          `📈 **Average/Day:** \`${avgPerDay.toFixed(0)}\` credits\n` +
          `💰 **Current Balance:** \`${user.balance.credit.toLocaleString()}\` credits\n\n` +
          (monthlyExpenses.length > 0
            ? `**Recent Transactions:**\n` +
              monthlyExpenses
                .slice(-5)
                .reverse()
                .map(
                  (t) =>
                    `${categories[t.category]?.emoji || "💳"} \`${t.amount.toLocaleString()}\` • *${t.description}*`
                )
                .join("\n")
            : "*No transactions this month*")
      );

    if (isInteraction) {
      await ctx.update({ embeds: [reportEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [reportEmbed] });
    }
  }
};
