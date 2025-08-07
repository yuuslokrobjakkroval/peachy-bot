const Command = require("../../structures/Command.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const User = require("../../schemas/user");

module.exports = class CreditMiner extends Command {
  constructor(client) {
    super(client, {
      name: "creditminer",
      description: {
        content: "Mine for credits with your equipment and skills",
        examples: ["creditminer", "creditminer mine", "creditminer upgrade"],
        usage: "creditminer [mine|upgrade|shop]",
      },
      category: "economy",
      aliases: ["cmine", "miner", "creditmine"],
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
          name: "action",
          description: "What to do",
          type: 3,
          required: false,
          choices: [
            { name: "Mine Credits", value: "mine" },
            { name: "Upgrade Equipment", value: "upgrade" },
            { name: "Equipment Shop", value: "shop" },
            { name: "View Stats", value: "stats" },
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
            .setDescription("Please create an account first!"),
        ],
      });
    }

    // Initialize mining data
    if (!user.creditMining) {
      user.creditMining = {
        level: 1,
        experience: 0,
        equipment: {
          pickaxe: 1,
          drill: 0,
          explosives: 0,
        },
        totalMined: 0,
        lastMine: null,
        successfulMines: 0,
        upgradeCosts: {
          pickaxe: 100,
          drill: 500,
          explosives: 1500,
        },
      };
      await user.save();
    }

    const mining = user.creditMining;
    const cooldownHours = 2; // 2 hour cooldown

    if (!args[0]) {
      await this.showMiningDashboard(
        ctx,
        user,
        mining,
        cooldownHours,
        color,
        emoji
      );
    } else {
      const action = args[0].toLowerCase();

      switch (action) {
        case "mine":
          await this.mineCredits(
            ctx,
            user,
            mining,
            cooldownHours,
            color,
            emoji
          );
          break;
        case "upgrade":
          await this.showUpgradeShop(ctx, user, mining, color, emoji);
          break;
        case "shop":
          await this.showEquipmentShop(ctx, user, mining, color, emoji);
          break;
        case "stats":
          await this.showMiningStats(ctx, user, mining, color, emoji);
          break;
        case "testcredits":
          // Test command to add credits for testing upgrades
          user.balance.credit += 10000;
          await user.save();
          return ctx.sendMessage({
            embeds: [
              new EmbedBuilder()
                .setColor(color.success)
                .setTitle("✅ Test Credits Added")
                .setDescription(
                  `Added 10,000 credits for testing! New balance: \`${user.balance.credit.toLocaleString()}\``
                ),
            ],
          });
        default:
          await this.showMiningDashboard(
            ctx,
            user,
            mining,
            cooldownHours,
            color,
            emoji
          );
      }
    }
  }

  async showMiningDashboard(ctx, user, mining, cooldownHours, color, emoji) {
    const canMine =
      !mining.lastMine ||
      Date.now() - new Date(mining.lastMine).getTime() >=
        cooldownHours * 60 * 60 * 1000;
    const timeUntilNext = mining.lastMine
      ? Math.max(
          0,
          cooldownHours * 60 * 60 * 1000 -
            (Date.now() - new Date(mining.lastMine).getTime())
        )
      : 0;

    const nextMineTime =
      timeUntilNext > 0
        ? `${Math.floor(timeUntilNext / (60 * 60 * 1000))}h ${Math.floor((timeUntilNext % (60 * 60 * 1000)) / (60 * 1000))}m`
        : "Ready!";

    // Calculate mining power
    const power = this.calculateMiningPower(mining);
    const expToNext = mining.level * 100 - mining.experience;

    const dashboardEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("⛏️ PEACHY Credit Mining Operation")
      .setDescription(
        `**Your Mining Setup:**\n\n` +
          `👷 **Miner Level:** \`${mining.level}\` (${mining.experience} XP)\n` +
          `💪 **Mining Power:** \`${power}\`\n` +
          `⏱️ **Next Mine:** ${nextMineTime}\n\n` +
          `**Equipment:**\n` +
          `⛏️ **Pickaxe Level:** \`${mining.equipment.pickaxe}\`\n` +
          `🔧 **Drill Level:** \`${mining.equipment.drill}\`\n` +
          `💥 **Explosives Level:** \`${mining.equipment.explosives}\`\n\n` +
          `**Statistics:**\n` +
          `💎 **Total Mined:** \`${mining.totalMined.toLocaleString()}\` credits\n` +
          `🎯 **Success Rate:** \`${mining.successfulMines}\` successful mines\n` +
          `🏆 **Your Balance:** \`${user.balance.credit.toLocaleString()}\` credits\n\n` +
          `📈 **XP to Next Level:** \`${expToNext}\`\n\n` +
          `${canMine ? "✅ **Ready to mine!**" : "⏳ **Mining on cooldown**"}`
      )
      .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Choose an action below" })
      .setTimestamp();

    const mineBtn = new ButtonBuilder()
      .setCustomId("mine_credits")
      .setLabel("Mine Credits")
      .setStyle(ButtonStyle.Success)
      .setEmoji("⛏️")
      .setDisabled(!canMine);

    const upgradeBtn = new ButtonBuilder()
      .setCustomId("upgrade_equipment")
      .setLabel("Upgrade")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔧");

    const shopBtn = new ButtonBuilder()
      .setCustomId("equipment_shop")
      .setLabel("Shop")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🛒");

    const statsBtn = new ButtonBuilder()
      .setCustomId("mining_stats")
      .setLabel("Stats")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📊");

    const row = new ActionRowBuilder().addComponents(
      mineBtn,
      upgradeBtn,
      shopBtn,
      statsBtn
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
      switch (interaction.customId) {
        case "mine_credits":
          await this.mineCredits(
            interaction,
            user,
            mining,
            cooldownHours,
            color,
            emoji,
            true
          );
          break;
        case "upgrade_equipment":
          // Refresh user data for latest balance
          const refreshedUser = await User.findOne({
            userId: interaction.user.id,
          });
          await this.showUpgradeShop(
            interaction,
            refreshedUser,
            refreshedUser.creditMining,
            color,
            emoji,
            true
          );
          break;
        case "equipment_shop":
          await this.showEquipmentShop(
            interaction,
            user,
            mining,
            color,
            emoji,
            true
          );
          break;
        case "mining_stats":
          await this.showMiningStats(
            interaction,
            user,
            mining,
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

  calculateMiningPower(mining) {
    const basePower = mining.level * 10;
    const equipmentPower =
      mining.equipment.pickaxe * 5 +
      mining.equipment.drill * 15 +
      mining.equipment.explosives * 25;
    return basePower + equipmentPower;
  }

  async mineCredits(
    ctx,
    user,
    mining,
    cooldownHours,
    color,
    emoji,
    isInteraction = false
  ) {
    const canMine =
      !mining.lastMine ||
      Date.now() - new Date(mining.lastMine).getTime() >=
        cooldownHours * 60 * 60 * 1000;

    if (!canMine) {
      const timeRemaining =
        cooldownHours * 60 * 60 * 1000 -
        (Date.now() - new Date(mining.lastMine).getTime());
      const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutes = Math.floor(
        (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
      );

      const errorEmbed = new EmbedBuilder()
        .setColor(color.danger)
        .setTitle("⏳ Mining Cooldown")
        .setDescription(`You can mine again in ${hours}h ${minutes}m!`);

      if (isInteraction) {
        return ctx.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        return ctx.sendMessage({ embeds: [errorEmbed] });
      }
    }

    // Calculate mining results
    const power = this.calculateMiningPower(mining);
    const baseReward = 10 + mining.level * 5;
    const powerMultiplier = 1 + power / 100;

    // Success rate based on equipment
    const successRate = Math.min(95, 60 + power / 10);
    const success = Math.random() * 100 <= successRate;

    let creditsFound = 0;
    let experience = 0;
    let outcome = "";

    if (success) {
      // Successful mining
      const multiplier = 0.8 + Math.random() * 0.6; // 0.8x to 1.4x
      creditsFound = Math.floor(baseReward * powerMultiplier * multiplier);
      experience = 5 + Math.floor(mining.level * 2);
      outcome = "SUCCESS";
      mining.successfulMines++;
    } else {
      // Failed mining
      creditsFound = Math.floor(baseReward * 0.2); // 20% of base reward
      experience = 2;
      outcome = "PARTIAL";
    }

    // Special rare finds
    if (Math.random() < 0.05) {
      // 5% chance
      const bonus = Math.floor(creditsFound * (2 + Math.random() * 3)); // 2x-5x bonus
      creditsFound += bonus;
      outcome = "JACKPOT";
      experience += 10;
    }

    // Update user data
    user.balance.credit += creditsFound;
    mining.totalMined += creditsFound;
    mining.experience += experience;
    mining.lastMine = new Date();

    // Level up check
    const requiredExp = mining.level * 100;
    if (mining.experience >= requiredExp) {
      mining.level++;
      mining.experience -= requiredExp;
      outcome += "_LEVELUP";
    }

    await user.save();

    // Result embed
    let embedColor = color.main;
    let title = "⛏️ Mining Results";

    if (outcome.includes("JACKPOT")) {
      embedColor = "#FFD700";
      title = "💎 JACKPOT! Rare Find!";
    } else if (outcome.includes("SUCCESS")) {
      embedColor = color.success;
      title = "✅ Successful Mining!";
    } else {
      embedColor = color.warning;
      title = "⚠️ Partial Success";
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(title)
      .setDescription(
        `**Mining Results:**\n\n` +
          `💎 **Credits Found:** \`${creditsFound.toLocaleString()}\`\n` +
          `📈 **Experience Gained:** \`+${experience} XP\`\n` +
          `💪 **Mining Power Used:** \`${power}\`\n` +
          `🎯 **Success Rate:** \`${successRate.toFixed(1)}%\`\n\n` +
          `**Your Status:**\n` +
          `👷 **Level:** \`${mining.level}\` ${outcome.includes("LEVELUP") ? "🆙 **LEVEL UP!**" : ""}\n` +
          `💰 **Total Credits:** \`${user.balance.credit.toLocaleString()}\`\n` +
          `💎 **Total Mined:** \`${mining.totalMined.toLocaleString()}\`\n\n` +
          `⏱️ **Next mining available in ${cooldownHours} hours**\n\n` +
          (outcome.includes("JACKPOT")
            ? "🌟 **What a lucky find! The mine gods smile upon you!**"
            : outcome.includes("SUCCESS")
              ? "🎉 **Great work! Your equipment served you well!**"
              : "😔 **Better luck next time! Consider upgrading your equipment.**")
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

  async showUpgradeShop(
    ctx,
    user,
    mining,
    color,
    emoji,
    isInteraction = false
  ) {
    const upgrades = [
      {
        name: "Pickaxe",
        emoji: "⛏️",
        current: mining.equipment.pickaxe,
        cost: mining.upgradeCosts.pickaxe * (mining.equipment.pickaxe + 1),
        power: "+5 Mining Power",
        description: "Basic mining tool",
      },
      {
        name: "Drill",
        emoji: "🔧",
        current: mining.equipment.drill,
        cost: mining.upgradeCosts.drill * (mining.equipment.drill + 1),
        power: "+15 Mining Power",
        description: "Mechanical drilling power",
      },
      {
        name: "Explosives",
        emoji: "💥",
        current: mining.equipment.explosives,
        cost:
          mining.upgradeCosts.explosives * (mining.equipment.explosives + 1),
        power: "+25 Mining Power",
        description: "Explosive mining capability",
      },
    ];

    const upgradeEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("🔧 Equipment Upgrade Shop")
      .setDescription(
        `**Your Credits:** \`${user.balance.credit.toLocaleString()}\`\n\n` +
          upgrades
            .map(
              (upgrade) =>
                `${upgrade.emoji} **${upgrade.name} (Level ${upgrade.current})**\n` +
                `├ Power: ${upgrade.power}\n` +
                `├ Next Level Cost: \`${upgrade.cost.toLocaleString()}\` credits\n` +
                `└ *${upgrade.description}*`
            )
            .join("\n\n")
      );

    const upgradeButtons = upgrades.map((upgrade) =>
      new ButtonBuilder()
        .setCustomId(`upgrade_${upgrade.name.toLowerCase()}`)
        .setLabel(`${upgrade.name} (${upgrade.cost.toLocaleString()})`)
        .setStyle(
          user.balance.credit >= upgrade.cost
            ? ButtonStyle.Success
            : ButtonStyle.Secondary
        )
        .setEmoji(upgrade.emoji)
        .setDisabled(user.balance.credit < upgrade.cost)
    );

    const row = new ActionRowBuilder().addComponents(upgradeButtons);

    if (isInteraction) {
      const message = await ctx.update({
        embeds: [upgradeEmbed],
        components: [row],
      });
      // Set up collector for upgrade buttons
      this.handleUpgradeInteractions(
        ctx.message || (await ctx.fetchReply()),
        ctx.user.id,
        user,
        mining,
        color,
        emoji
      );
    } else {
      const message = await ctx.sendMessage({
        embeds: [upgradeEmbed],
        components: [row],
      });
      this.handleUpgradeInteractions(
        message,
        ctx.author.id,
        user,
        mining,
        color,
        emoji
      );
    }
  }

  async handleUpgradeInteractions(
    message,
    authorId,
    user,
    mining,
    color,
    emoji
  ) {
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === authorId,
      time: 120000,
    });

    collector.on("collect", async (interaction) => {
      try {
        const equipment = interaction.customId.split("_")[1];
        // Get fresh user data for the upgrade
        const freshUser = await User.findOne({ userId: interaction.user.id });
        await this.processUpgrade(
          interaction,
          freshUser,
          freshUser.creditMining,
          equipment,
          color,
          emoji
        );
      } catch (error) {
        console.error("Upgrade interaction error:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Upgrade failed. Please try again.",
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }).catch(() => {});
    });
  }

  async processUpgrade(ctx, user, mining, equipment, color, emoji) {
    const costs = mining.upgradeCosts;
    const currentLevel = mining.equipment[equipment];
    const upgradeCost = costs[equipment] * (currentLevel + 1);

    console.log(
      `Processing upgrade for ${equipment}, cost: ${upgradeCost}, balance: ${user.balance.credit}`
    );

    if (user.balance.credit < upgradeCost) {
      return ctx.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(color.danger)
            .setTitle("❌ Insufficient Credits")
            .setDescription(
              `You need \`${upgradeCost.toLocaleString()}\` credits but only have \`${user.balance.credit.toLocaleString()}\`!`
            ),
        ],
        ephemeral: true,
      });
    }

    // Process upgrade
    user.balance.credit -= upgradeCost;
    mining.equipment[equipment]++;

    try {
      await user.save();
      console.log(
        `Upgrade successful: ${equipment} level ${mining.equipment[equipment]}`
      );
    } catch (error) {
      console.error("Failed to save upgrade:", error);
      return ctx.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(color.danger)
            .setTitle("❌ Upgrade Failed")
            .setDescription("Failed to save upgrade. Please try again."),
        ],
        ephemeral: true,
      });
    }

    const equipmentEmojis = {
      pickaxe: "⛏️",
      drill: "🔧",
      explosives: "💥",
    };

    const successEmbed = new EmbedBuilder()
      .setColor(color.success)
      .setTitle("🔧 Upgrade Successful!")
      .setDescription(
        `${equipmentEmojis[equipment]} **${equipment.charAt(0).toUpperCase() + equipment.slice(1)} upgraded to level ${mining.equipment[equipment]}!**\n\n` +
          `💸 **Cost:** \`${upgradeCost.toLocaleString()}\` credits\n` +
          `💰 **Remaining Balance:** \`${user.balance.credit.toLocaleString()}\` credits\n` +
          `💪 **New Mining Power:** \`${this.calculateMiningPower(mining)}\`\n\n` +
          `🎉 **Your mining efficiency has increased!**`
      )
      .setTimestamp();

    await ctx.update({ embeds: [successEmbed], components: [] });
  }

  async showEquipmentShop(
    ctx,
    user,
    mining,
    color,
    emoji,
    isInteraction = false
  ) {
    const shopEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("🛒 Equipment Shop")
      .setDescription(
        "*Coming soon! More equipment and upgrades will be available in future updates.*"
      );

    if (isInteraction) {
      await ctx.update({ embeds: [shopEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [shopEmbed] });
    }
  }

  async showMiningStats(
    ctx,
    user,
    mining,
    color,
    emoji,
    isInteraction = false
  ) {
    const power = this.calculateMiningPower(mining);
    const efficiency =
      mining.totalMined > 0
        ? (mining.successfulMines / (mining.totalMined / 100)).toFixed(1)
        : 0;

    const statsEmbed = new EmbedBuilder()
      .setColor(color.main)
      .setTitle("📊 Mining Statistics")
      .setDescription(
        `**Performance Metrics:**\n\n` +
          `👷 **Miner Level:** \`${mining.level}\`\n` +
          `📈 **Experience:** \`${mining.experience}\` / \`${mining.level * 100}\`\n` +
          `💪 **Total Mining Power:** \`${power}\`\n` +
          `💎 **Total Credits Mined:** \`${mining.totalMined.toLocaleString()}\`\n` +
          `🎯 **Successful Mines:** \`${mining.successfulMines}\`\n` +
          `📊 **Mining Efficiency:** \`${efficiency}%\`\n\n` +
          `**Equipment Breakdown:**\n` +
          `⛏️ **Pickaxe Level:** \`${mining.equipment.pickaxe}\` (+${mining.equipment.pickaxe * 5} power)\n` +
          `🔧 **Drill Level:** \`${mining.equipment.drill}\` (+${mining.equipment.drill * 15} power)\n` +
          `💥 **Explosives Level:** \`${mining.equipment.explosives}\` (+${mining.equipment.explosives * 25} power)`
      )
      .setFooter({ text: "Keep mining to improve your stats!" });

    if (isInteraction) {
      await ctx.update({ embeds: [statsEmbed], components: [] });
    } else {
      await ctx.sendMessage({ embeds: [statsEmbed] });
    }
  }
};
