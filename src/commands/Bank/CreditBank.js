const Command = require("../../structures/Command.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const User = require("../../schemas/user");

module.exports = class CreditBank extends Command {
  constructor(client) {
    super(client, {
      name: "creditbank",
      description: {
        content: "Manage your credit savings with interest rates",
        examples: [
          "creditbank",
          "creditbank deposit 100",
          "creditbank withdraw 50",
        ],
        usage: "creditbank [deposit|withdraw] [amount]",
      },
      category: "bank",
      aliases: ["cbank", "creditsave", "csave"],
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
          name: "action",
          description: "What to do with your credit bank",
          type: 3,
          required: false,
          choices: [
            { name: "Deposit Credits", value: "deposit" },
            { name: "Withdraw Credits", value: "withdraw" },
            { name: "View Account", value: "view" },
            { name: "Claim Interest", value: "interest" },
          ],
        },
        {
          name: "amount",
          description: "Amount of credits",
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

    // Initialize credit bank if it doesn't exist
    if (!user.creditBank) {
      user.creditBank = {
        balance: 0,
        lastInterest: new Date(),
        totalInterestEarned: 0,
        depositHistory: [],
      };
    }

    const interestRate = 0.02; // 2% daily interest
    const maxBankBalance = 50000; // Max credit bank balance

    if (!args[0]) {
      await this.showCreditBankDashboard(
        ctx,
        user,
        interestRate,
        maxBankBalance,
        color,
        emoji
      );
    } else {
      const action = args[0].toLowerCase();
      const amount = parseInt(args[1]);

      switch (action) {
        case "deposit":
          if (!amount || amount <= 0) {
            return this.showDepositForm(
              ctx,
              user,
              maxBankBalance,
              color,
              emoji
            );
          }
          await this.depositCredits(
            ctx,
            user,
            amount,
            maxBankBalance,
            color,
            emoji
          );
          break;

        case "withdraw":
          if (!amount || amount <= 0) {
            return this.showWithdrawForm(ctx, user, color, emoji);
          }
          await this.withdrawCredits(ctx, user, amount, color, emoji);
          break;

        case "view":
          await this.showCreditBankDashboard(
            ctx,
            user,
            interestRate,
            maxBankBalance,
            color,
            emoji
          );
          break;

        case "interest":
          await this.claimInterest(ctx, user, interestRate, color, emoji);
          break;

        case "testinterest":
          // Test command to set last interest to 25 hours ago (for testing purposes)
          if (user.creditBank) {
            user.creditBank.lastInterest = new Date(
              Date.now() - 25 * 60 * 60 * 1000
            );
            await user.save();
            return ctx.sendMessage({
              embeds: [
                new EmbedBuilder()
                  .setColor(color.success)
                  .setTitle("✅ Test Interest Set")
                  .setDescription(
                    "Last interest time set to 25 hours ago for testing!"
                  ),
              ],
            });
          }
          break;

        default:
          await this.showCreditBankDashboard(
            ctx,
            user,
            interestRate,
            maxBankBalance,
            color,
            emoji
          );
      }
    }
  }

  async showCreditBankDashboard(
    ctx,
    user,
    interestRate,
    maxBankBalance,
    color,
    emoji
  ) {
    const bankBalance = user.creditBank?.balance || 0;
    const lastInterest = user.creditBank?.lastInterest || new Date();
    const totalEarned = user.creditBank?.totalInterestEarned || 0;

    // Calculate pending interest
    const hoursSinceLastInterest =
      (Date.now() - new Date(lastInterest).getTime()) / (1000 * 60 * 60);
    const dailyInterest = Math.floor(bankBalance * interestRate);
    const pendingInterest = hoursSinceLastInterest >= 24 ? dailyInterest : 0;

    // Calculate days until next interest
    const hoursUntilNext = Math.max(0, 24 - (hoursSinceLastInterest % 24));

    const dashboardEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("🏦 PEACHY Credit Bank")
      .setDescription(
        `**Your Account Summary:**\n\n` +
          `💳 **Wallet Credits:** \`${user.balance.credit.toLocaleString()}\`\n` +
          `🏦 **Bank Balance:** \`${bankBalance.toLocaleString()}\` / \`${maxBankBalance.toLocaleString()}\`\n` +
          `📈 **Interest Rate:** \`${(interestRate * 100).toFixed(1)}%\` per day\n` +
          `💰 **Pending Interest:** \`${pendingInterest.toLocaleString()}\` credits\n` +
          `🕐 **Next Interest:** ${hoursUntilNext.toFixed(1)} hours\n\n` +
          `**Statistics:**\n` +
          `📊 **Total Interest Earned:** \`${totalEarned.toLocaleString()}\`\n` +
          `🎯 **Bank Capacity:** \`${((bankBalance / maxBankBalance) * 100).toFixed(1)}%\`\n\n` +
          `💡 **Tip:** Keep credits in the bank to earn daily interest!`
      )
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Safe and secure credit banking" })
      .setTimestamp();

    const depositBtn = new ButtonBuilder()
      .setCustomId("deposit_credits")
      .setLabel("Deposit")
      .setStyle(ButtonStyle.Success)
      .setEmoji("💳");

    const withdrawBtn = new ButtonBuilder()
      .setCustomId("withdraw_credits")
      .setLabel("Withdraw")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("💰");

    const interestBtn = new ButtonBuilder()
      .setCustomId("claim_interest")
      .setLabel("Claim Interest")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📈")
      .setDisabled(pendingInterest <= 0);

    const historyBtn = new ButtonBuilder()
      .setCustomId("view_history")
      .setLabel("History")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📋");

    const row = new ActionRowBuilder().addComponents(
      depositBtn,
      withdrawBtn,
      interestBtn,
      historyBtn
    );

    const message = await ctx.sendMessage({
      embeds: [dashboardEmbed],
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 300000,
    });

    collector.on("collect", async (interaction) => {
      try {
        switch (interaction.customId) {
          case "deposit_credits":
            await this.showDepositForm(
              interaction,
              user,
              maxBankBalance,
              color,
              emoji,
              true
            );
            break;
          case "withdraw_credits":
            await this.showWithdrawForm(interaction, user, color, emoji, true);
            break;
          case "claim_interest":
            // Refresh user data before claiming interest
            const refreshedUser = await User.findOne({
              userId: interaction.user.id,
            });
            await this.claimInterest(
              interaction,
              refreshedUser,
              interestRate,
              color,
              emoji,
              true
            );
            break;
          case "view_history":
            await this.showBankHistory(interaction, user, color, emoji, true);
            break;
        }
      } catch (error) {
        console.error("Button interaction error:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ An error occurred. Please try again.",
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }).catch(() => {});
    });
  }

  async showDepositForm(
    ctx,
    user,
    maxBankBalance,
    color,
    emoji,
    isInteraction = false
  ) {
    const bankBalance = user.creditBank?.balance || 0;
    const availableSpace = maxBankBalance - bankBalance;
    const maxDeposit = Math.min(user.balance.credit, availableSpace);

    if (maxDeposit <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Cannot Deposit")
        .setDescription(
          bankBalance >= maxBankBalance
            ? "Your bank is at maximum capacity!"
            : "You don't have any credits to deposit!"
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    const depositEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("💳 Deposit Credits")
      .setDescription(
        `**Available to Deposit:** \`${user.balance.credit.toLocaleString()}\` credits\n` +
          `**Bank Space Available:** \`${availableSpace.toLocaleString()}\` credits\n` +
          `**Maximum Deposit:** \`${maxDeposit.toLocaleString()}\` credits\n\n` +
          "Choose deposit amount:"
      );

    const amounts = [
      Math.floor(maxDeposit * 0.25),
      Math.floor(maxDeposit * 0.5),
      Math.floor(maxDeposit * 0.75),
      maxDeposit,
    ].filter((amt) => amt > 0);

    const buttons = amounts.map((amount, index) =>
      new ButtonBuilder()
        .setCustomId(`deposit_${amount}`)
        .setLabel(`${amount.toLocaleString()}`)
        .setStyle(
          index === amounts.length - 1
            ? ButtonStyle.Success
            : ButtonStyle.Primary
        )
    );

    const row = new ActionRowBuilder().addComponents(buttons.slice(0, 4));

    if (isInteraction) {
      await ctx.update({ embeds: [depositEmbed], components: [row] });
      // Set up button collector on the updated message
      const updatedMessage = await ctx.fetchReply();
      this.handleButtonInteractions(
        updatedMessage,
        ctx.user.id,
        user,
        maxBankBalance,
        color,
        emoji
      );
    } else {
      const message = await ctx.sendMessage({
        embeds: [depositEmbed],
        components: [row],
      });
      this.handleButtonInteractions(
        message,
        ctx.author.id,
        user,
        maxBankBalance,
        color,
        emoji
      );
    }
  }

  async showWithdrawForm(ctx, user, color, emoji, isInteraction = false) {
    const bankBalance = user.creditBank?.balance || 0;

    if (bankBalance <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Cannot Withdraw")
        .setDescription("You don't have any credits in the bank!");

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    const withdrawEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("💰 Withdraw Credits")
      .setDescription(
        `**Bank Balance:** \`${bankBalance.toLocaleString()}\` credits\n\n` +
          "Choose withdrawal amount:"
      );

    const amounts = [
      Math.floor(bankBalance * 0.25),
      Math.floor(bankBalance * 0.5),
      Math.floor(bankBalance * 0.75),
      bankBalance,
    ].filter((amt) => amt > 0);

    const buttons = amounts.map((amount, index) =>
      new ButtonBuilder()
        .setCustomId(`withdraw_${amount}`)
        .setLabel(`${amount.toLocaleString()}`)
        .setStyle(
          index === amounts.length - 1
            ? ButtonStyle.Danger
            : ButtonStyle.Primary
        )
    );

    const row = new ActionRowBuilder().addComponents(buttons.slice(0, 4));

    if (isInteraction) {
      await ctx.update({ embeds: [withdrawEmbed], components: [row] });
      // Set up button collector on the updated message
      const updatedMessage = await ctx.fetchReply();
      this.handleButtonInteractions(
        updatedMessage,
        ctx.user.id,
        user,
        0,
        color,
        emoji
      );
    } else {
      const message = await ctx.sendMessage({
        embeds: [withdrawEmbed],
        components: [row],
      });
      this.handleButtonInteractions(
        message,
        ctx.author.id,
        user,
        0,
        color,
        emoji
      );
    }
  }

  async handleButtonInteractions(
    message,
    authorId,
    user,
    maxBankBalance,
    color,
    emoji
  ) {
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === authorId,
      time: 120000,
    });

    collector.on("collect", async (interaction) => {
      try {
        const [action, amount] = interaction.customId.split("_");
        const transactionAmount = parseInt(amount);

        if (action === "deposit") {
          await this.depositCredits(
            interaction,
            user,
            transactionAmount,
            maxBankBalance,
            color,
            emoji,
            true
          );
        } else if (action === "withdraw") {
          await this.withdrawCredits(
            interaction,
            user,
            transactionAmount,
            color,
            emoji,
            true
          );
        }
      } catch (error) {
        console.error("Transaction button error:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Transaction failed. Please try again.",
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }).catch(() => {});
    });
  }

  async depositCredits(
    ctx,
    user,
    amount,
    maxBankBalance,
    color,
    emoji,
    isInteraction = false
  ) {
    const bankBalance = user.creditBank?.balance || 0;

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

    if (bankBalance + amount > maxBankBalance) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Bank Capacity Exceeded")
        .setDescription(
          `Maximum bank balance is ${maxBankBalance.toLocaleString()} credits!`
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Process deposit
    user.balance.credit -= amount;
    user.creditBank.balance += amount;
    user.creditBank.depositHistory.push({
      type: "deposit",
      amount,
      date: new Date(),
      balance: user.creditBank.balance,
    });

    await user.save();

    const successEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("✅ Deposit Successful!")
      .setDescription(
        `**Deposited:** \`${amount.toLocaleString()}\` credits\n\n` +
          `**New Balances:**\n` +
          `💳 **Wallet:** \`${user.balance.credit.toLocaleString()}\` credits\n` +
          `🏦 **Bank:** \`${user.creditBank.balance.toLocaleString()}\` credits\n\n` +
          `💡 Your credits will earn 2% interest daily!`
      )
      .setTimestamp();

    if (isInteraction) {
      await ctx.update({ embeds: [successEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [successEmbed] });
    }
  }

  async withdrawCredits(
    ctx,
    user,
    amount,
    color,
    emoji,
    isInteraction = false
  ) {
    const bankBalance = user.creditBank?.balance || 0;

    if (bankBalance < amount) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Insufficient Bank Balance")
        .setDescription(
          `You only have ${bankBalance.toLocaleString()} credits in the bank!`
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Process withdrawal
    user.balance.credit += amount;
    user.creditBank.balance -= amount;
    user.creditBank.depositHistory.push({
      type: "withdrawal",
      amount,
      date: new Date(),
      balance: user.creditBank.balance,
    });

    await user.save();

    const successEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("✅ Withdrawal Successful!")
      .setDescription(
        `**Withdrawn:** \`${amount.toLocaleString()}\` credits\n\n` +
          `**New Balances:**\n` +
          `💳 **Wallet:** \`${user.balance.credit.toLocaleString()}\` credits\n` +
          `🏦 **Bank:** \`${user.creditBank.balance.toLocaleString()}\` credits`
      )
      .setTimestamp();

    if (isInteraction) {
      await ctx.update({ embeds: [successEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [successEmbed] });
    }
  }

  async claimInterest(
    ctx,
    user,
    interestRate,
    color,
    emoji,
    isInteraction = false
  ) {
    const bankBalance = user.creditBank?.balance || 0;
    const lastInterest = user.creditBank?.lastInterest || new Date();

    const hoursSinceLastInterest =
      (Date.now() - new Date(lastInterest).getTime()) / (1000 * 60 * 60);

    // Debug logging
    console.log(`Hours since last interest: ${hoursSinceLastInterest}`);
    console.log(`Bank balance: ${bankBalance}`);

    if (hoursSinceLastInterest < 24) {
      const hoursRemaining = 24 - hoursSinceLastInterest;
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ Interest Not Ready")
        .setDescription(
          `You can claim interest in ${hoursRemaining.toFixed(1)} hours!\n` +
            `**Last Interest:** ${new Date(lastInterest).toLocaleString()}\n` +
            `**Next Interest:** ${new Date(Date.now() + hoursRemaining * 60 * 60 * 1000).toLocaleString()}`
        );

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    const interest = Math.floor(bankBalance * interestRate);

    if (interest <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("❌ No Interest Available")
        .setDescription("You need credits in the bank to earn interest!");

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Grant interest
    user.balance.credit += interest;
    user.creditBank.totalInterestEarned += interest;
    user.creditBank.lastInterest = new Date();
    user.creditBank.depositHistory.push({
      type: "interest",
      amount: interest,
      date: new Date(),
      balance: user.creditBank.balance,
    });

    await user.save();

    console.log(`Interest granted: ${interest} credits`);

    const successEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("💰 Interest Claimed!")
      .setDescription(
        `**Interest Earned:** \`${interest.toLocaleString()}\` credits\n` +
          `**Bank Balance:** \`${bankBalance.toLocaleString()}\` credits\n` +
          `**Rate:** ${(interestRate * 100).toFixed(1)}% daily\n\n` +
          `**New Wallet Balance:** \`${user.balance.credit.toLocaleString()}\` credits\n` +
          `**Total Interest Earned:** \`${user.creditBank.totalInterestEarned.toLocaleString()}\` credits\n\n` +
          `**Next Interest Available:** 24 hours from now`
      )
      .setTimestamp();

    if (isInteraction) {
      await ctx.update({ embeds: [successEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [successEmbed] });
    }
  }

  async showBankHistory(ctx, user, color, emoji, isInteraction = false) {
    const history = user.creditBank?.depositHistory || [];
    const recent = history.slice(-10).reverse();

    const historyEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("📋 Bank Transaction History")
      .setDescription(
        recent.length > 0
          ? recent
              .map((t) => {
                const icon =
                  t.type === "deposit"
                    ? "💳"
                    : t.type === "withdrawal"
                      ? "💰"
                      : "📈";
                const action = t.type.charAt(0).toUpperCase() + t.type.slice(1);
                return (
                  `${icon} **${action}:** \`${t.amount.toLocaleString()}\` credits\n` +
                  `└ ${new Date(t.date).toLocaleDateString()} • Balance: \`${t.balance.toLocaleString()}\``
                );
              })
              .join("\n\n")
          : "*No transaction history*"
      )
      .setFooter({ text: `Showing last ${recent.length} transactions` });

    if (isInteraction) {
      await ctx.update({ embeds: [historyEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [historyEmbed] });
    }
  }
};
