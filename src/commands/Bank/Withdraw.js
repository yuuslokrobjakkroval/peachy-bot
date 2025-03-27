const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const moment = require("moment/moment");
const globalGif = require("../../utils/Gif");

module.exports = class Withdraw extends Command {
  constructor(client) {
    super(client, {
      name: "withdraw",
      description: {
        content: "Withdraw currency coins from your bank.",
        examples: ["withdraw 100"],
        usage: "withdraw <amount>",
      },
      category: "bank",
      aliases: ["dokluy", "with", "dok"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "amount",
          description: "The amount you want to withdraw.",
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
    const withdrawMessages = language.locales.get(language.defaultLocale)
      ?.bankMessages?.withdrawMessages;

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

          const cooldownMessage = withdrawMessages.cooldown
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
        const { bank } = user.balance;

        if (bank < 1) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            withdrawMessages.zeroBalance,
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
                .setDescription(withdrawMessages.invalidAmount),
            ],
          });
        }

        amount = client.utils.formatBalance(
          client,
          ctx,
          color,
          bank,
          amount,
          withdrawMessages.invalidAmount
        );
        if (typeof amount === "object") return;

        if (isNaN(amount) || amount <= 0) {
          return ctx.sendMessage({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(withdrawMessages.invalidAmount),
            ],
          });
        }

        const baseCoins = Math.min(amount, bank);

        if (baseCoins > bank) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            withdrawMessages.tooHigh,
            color
          );
        }

        await Users.findOneAndUpdate(
          { userId: ctx.author.id },
          {
            $inc: {
              "balance.coin": parseInt(baseCoins),
              "balance.bank": -parseInt(baseCoins),
            },
          },
          { new: true }
        );

        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            generalMessages.title
              .replace("%{mainLeft}", emoji.mainLeft)
              .replace("%{title}", "WITHDRAW")
              .replace("%{mainRight}", emoji.mainRight) +
              withdrawMessages.success
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
      console.error("Error processing withdraw command:", error);
      client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.userFetchError,
        color
      );
    }
  }
};
