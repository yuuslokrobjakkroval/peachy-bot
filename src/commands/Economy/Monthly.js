const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const chance = require("chance").Chance();
const moment = require("moment-timezone");
const globalGif = require("../../utils/Gif");

module.exports = class Monthly extends Command {
  constructor(client) {
    super(client, {
      name: "monthly",
      description: {
        content: "Earn some coins monthly.",
        examples: ["monthly"],
        usage: "monthly",
      },
      category: "economy",
      aliases: ["month"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const monthlyMessages = language.locales.get(language.defaultLocale)
      ?.economyMessages?.monthlyMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);
      if (!user) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userNotFound,
          color
        );
      }

      const baseCoins = chance.integer({ min: 300000, max: 600000 });
      const baseExp = chance.integer({ min: 500, max: 1000 });

      const verify = user.verification.verify.status === "verified";

      let bonusCoins = 0;
      let bonusExp = 0;

      if (verify) {
        bonusCoins = Math.floor(baseCoins * 0.3);
        bonusExp = Math.floor(baseExp * 0.3);
      }

      const totalCoins = baseCoins + bonusCoins;
      const totalExp = baseExp + bonusExp;
      const newBalance = user.balance.coin + totalCoins;
      const newExp = user.profile.xp + totalExp;

      const now = moment().tz("Asia/Bangkok");
      const nextMonthly = moment(now).add(1, "month").toDate();

      const timeUntilNextMonthly = nextMonthly - now.toDate();

      const isCooldownExpired = await client.utils.checkCooldown(
        ctx.author.id,
        this.name.toLowerCase(),
        timeUntilNextMonthly
      );
      if (!isCooldownExpired) {
        const lastCooldownTimestamp = await client.utils.getCooldown(
          ctx.author.id,
          this.name.toLowerCase()
        );
        const remainingTime = Math.ceil(
          (lastCooldownTimestamp + timeUntilNextMonthly - Date.now()) / 1000
        );
        const cooldownMessage = this.getCooldownMessage(
          remainingTime,
          client,
          language,
          monthlyMessages
        );

        const cooldownEmbed = client
          .embed()
          .setColor(color.danger)
          .setDescription(cooldownMessage);
        return ctx.sendMessage({ embeds: [cooldownEmbed] });
      }

      // Use EconomyManager if available
      if (client.economyManager) {
        await client.economyManager.addCoins(
          ctx.author.id,
          ctx.guild?.id || "DM",
          totalCoins,
          "monthly"
        );
        // Update XP separately since EconomyManager doesn't handle XP
        await Users.updateOne(
          { userId: user.userId },
          {
            $inc: {
              "profile.xp": totalExp,
            },
          }
        );
      } else {
        // Fallback to direct database update
        await Users.updateOne(
          { userId: user.userId },
          {
            $set: {
              "balance.coin": newBalance,
              "profile.xp": newExp,
            },
          }
        );
      }

      await client.utils.updateCooldown(
        ctx.author.id,
        this.name.toLowerCase(),
        timeUntilNextMonthly
      );

      let bonusMessage = "";
      if (bonusCoins > 0 || bonusExp > 0) {
        bonusMessage = `\n**+30% Bonus**\n${emoji.coin}: **+${client.utils.formatNumber(bonusCoins)}** coins\n${emoji.exp} **+${client.utils.formatNumber(bonusExp)}** xp`;
      }

      const embed = this.createSuccessEmbed(
        client,
        ctx,
        emoji,
        totalCoins,
        totalExp,
        now,
        monthlyMessages,
        generalMessages,
        bonusMessage
      );

      return ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error processing monthly command:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        monthlyMessages.error,
        color
      );
    }
  }

  getCooldownMessage(remainingTime, client, language, monthlyMessages) {
    const days = Math.floor(remainingTime / 86400);
    const hours = Math.floor((remainingTime % 86400) / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    const daysString = days > 1 ? `${days} days` : `${days} day`;
    const hoursString = hours > 1 ? `${hours} hrs` : `${hours} hr`;
    const minutesString = minutes > 1 ? `${minutes} mins` : `${minutes} min`;
    const secondsString = seconds > 1 ? `${seconds} secs` : `${seconds} sec`;

    if (days > 1) {
      return monthlyMessages.cooldown.multipleDays
        .replace("%{days}", daysString)
        .replace("%{hours}", hoursString)
        .replace("%{minutes}", minutesString)
        .replace("%{seconds}", secondsString);
    } else if (days === 1) {
      return monthlyMessages.cooldown.singleDay
        .replace("%{days}", daysString)
        .replace("%{hours}", hoursString)
        .replace("%{minutes}", minutesString)
        .replace("%{seconds}", secondsString);
    } else {
      return monthlyMessages.cooldown.noDays
        .replace("%{hours}", hoursString)
        .replace("%{minutes}", minutesString)
        .replace("%{seconds}", secondsString);
    }
  }

  createSuccessEmbed(
    client,
    ctx,
    emoji,
    totalCoins,
    totalExp,
    now,
    monthlyMessages,
    generalMessages,
    bonusMessage
  ) {
    return client
      .embed()
      .setColor(client.config.color.main)
      .setThumbnail(
        client.utils.emojiToImage(
          `${now.hour() >= 6 && now.hour() < 18 ? emoji.time.day : emoji.time.night}`
        )
      )
      .setDescription(
        generalMessages.title
          .replace("%{mainLeft}", emoji.mainLeft)
          .replace("%{title}", "MONTHLY")
          .replace("%{mainRight}", emoji.mainRight) +
          monthlyMessages.success
            .replace("%{coin}", client.utils.formatNumber(totalCoins))
            .replace("%{coinEmote}", emoji.coin)
            .replace("%{expEmote}", emoji.exp)
            .replace("%{exp}", client.utils.formatNumber(totalExp))
            .replace("%{bonusMessage}", bonusMessage)
      )
      .setImage(globalGif.banner.monthlyReminder)
      .setFooter({
        text:
          generalMessages.requestedBy.replace(
            "%{username}",
            ctx.author.displayName
          ) || `Requested by ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      });
  }
};
