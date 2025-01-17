const { Command } = require("../../structures");
const moment = require("moment/moment");
const globalGif = require("../../utils/Gif");

module.exports = class Withdraw extends Command {
  constructor(client) {
    super(client, {
      name: "withdraw",
      description: {
        content: "𝑾𝒊𝒕𝒉𝒅𝒓𝒂𝒘 𝒄𝒖𝒓𝒓𝒆𝒏𝒄𝒚 𝒄𝒐𝒊𝒏𝒔 𝒇𝒓𝒐𝒎 𝒚𝒐𝒖𝒓 𝒃𝒂𝒏𝒌.",
        examples: ["𝒘𝒊𝒕𝒉𝒅𝒓𝒂𝒘 100"],
        usage: "𝒘𝒊𝒕𝒉𝒅𝒓𝒂𝒘 <𝒂𝒎𝒐𝒖𝒏𝒕>",
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

  run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const withdrawMessages = language.locales.get(language.defaultLocale)
      ?.bankMessages?.withdrawMessages;

    client.utils
      .getUser(ctx.author.id)
      .then((user) => {
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
          client.utils
            .checkCooldown(ctx.author.id, "rob", cooldownTime)
            .then(async (isCooldownExpired) => {
              if (!isCooldownExpired) {
                client.utils
                  .getCooldown(ctx.author.id, "rob")
                  .then((lastCooldownTimestamp) => {
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
                  });
              }
            });
        } else if (
          user.validation.isKlaKlouk ||
          user.validation.isMultiTransfer
        ) {
          const activeCommand = user.validation.isKlaKlouk
            ? "𝑲𝒍𝒂 𝑲𝒍𝒐𝒖𝒌"
            : "𝑴𝒖𝒍𝒕𝒊𝒑𝒍𝒆 𝑻𝒓𝒂𝒏𝒔𝒇𝒆𝒓";
          return client.utils.sendErrorMessage(
            client,
            ctx,
            `𝒀𝒐𝒖 𝒉𝒂𝒗𝒆 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒔𝒕𝒂𝒓𝒕𝒆𝒅 𝒕𝒉𝒆 ${activeCommand} 𝒆𝒗𝒆𝒏𝒕. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒇𝒊𝒏𝒊𝒔𝒉 𝒊𝒕 𝒃𝒆𝒇𝒐𝒓𝒆 𝒖𝒔𝒊𝒏𝒈 𝒕𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅.`,
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

          // Update user balance
          user.balance.coin += parseInt(baseCoins);
          user.balance.bank -= parseInt(baseCoins);

          user
            .save()
            .then(() => {
              const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                  generalMessages.title
                    .replace("%{mainLeft}", emoji.mainLeft)
                    .replace("%{title}", "𝐖𝐈𝐓𝐇𝐃𝐑𝐀𝐖")
                    .replace("%{mainRight}", emoji.mainRight) +
                    withdrawMessages.success
                      .replace(
                        "%{amount}",
                        client.utils.formatNumber(baseCoins)
                      )
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
            })
            .catch((error) => {
              console.error("Error saving user data:", error);
              client.utils.sendErrorMessage(
                client,
                ctx,
                generalMessages.saveError,
                color
              );
            });
        }
      })
      .catch((error) => {
        console.error("Error retrieving user data:", error);
        client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userFetchError,
          color
        );
      });
  }
};
