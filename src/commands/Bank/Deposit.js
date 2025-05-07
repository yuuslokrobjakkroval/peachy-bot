const { Command } = require("../../structures");
const moment = require("moment");
const globalGif = require("../../utils/Gif");

module.exports = class Deposit extends Command {
  constructor(client) {
    super(client, {
      name: "deposit",
      description: {
        content: "Deposit currency coins to your bank.",
        examples: ["deposit 100"],
        usage: "deposit <amount>",
      },
      category: "bank",
      aliases: ["dakluy", "dak", "dep"],
      cooldown: 5,
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
          description: "The amount you want to deposit.",
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
    const depositMessages = language.locales.get(language.defaultLocale)
      ?.bankMessages?.depositMessages;

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

      if (user.work.rob) {
        const cooldownTime = 2 * 60 * 1000;
        const isCooldownExpired = await client.utils.checkCooldown(
          ctx.author.id,
          "rob",
          cooldownTime
        );
        if (!isCooldownExpired) {
          const lastCooldownTimestamp = await client.utils.getCooldown(
            ctx.author.id,
            "rob"
          );
          const remainingTime = Math.ceil(
            (lastCooldownTimestamp + cooldownTime - Date.now()) / 1000
          );
          const duration = moment.duration(remainingTime, "seconds");
          const minutes = Math.floor(duration.asMinutes());
          const seconds = Math.floor(duration.asSeconds()) % 60;

          const cooldownMessage = depositMessages.cooldown
            .replace("%{minutes}", minutes)
            .replace("%{seconds}", seconds);
          const cooldownEmbed = client
            .embed()
            .setColor(color.danger)
            .setDescription(cooldownMessage);
          return ctx.sendMessage({ embeds: [cooldownEmbed] });
        }
      } else if (
        user.validation.isKlaKlouk ||
        user.validation.isMultiTransfer
      ) {
        const activeCommand = user.validation.isKlaKlouk
          ? "Kla Klouk"
          : "Multiple Transfer";
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You have already started the ${activeCommand} event. Please finish it before using this command.`,
          color
        );
      } else {
        const { coin } = user.balance;
        if (coin < 1) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            depositMessages.zeroBalance,
            color
          );
        }

        let amount = ctx.isInteraction
          ? ctx.interaction.options.getString("amount")
          : args[0] || 1;
        if (amount.toString().startsWith("-")) {
          return ctx.sendMessage({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(depositMessages.invalidAmount),
            ],
          });
        }

        amount = client.utils.formatBalance(
          client,
          ctx,
          color,
          coin,
          amount,
          depositMessages.invalidAmount
        );
        if (typeof amount === "object") return;

        if (isNaN(amount) || amount <= 0) {
          return ctx.sendMessage({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(depositMessages.invalidAmount),
            ],
          });
        }

        const baseCoins = Math.min(amount, coin);

        if (baseCoins > coin) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            depositMessages.tooHigh,
            color
          );
        }

        user.balance.coin -= Number.parseInt(baseCoins);
        user.balance.bank += Number.parseInt(baseCoins);

        await user.save();

        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", "DEPOSIT")
              .replace("%{mainRight}", emoji.mainRight) +
              depositMessages.success
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{mainRight}", emoji.mainRight)
                .replace("%{amount}", client.utils.formatNumber(baseCoins))
                .replace("%{coinEmote}", emoji.coin)
          )
          .setImage(globalGif.banner.depositWithdraw)
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          });

        return ctx.sendMessage({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error processing deposit command:", error);
      client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.userFetchError,
        color
      );
    }
  }
};
