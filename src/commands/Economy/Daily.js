const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const chance = require("chance").Chance();
const moment = require("moment-timezone");
const globalGif = require("../../utils/Gif");

module.exports = class Daily extends Command {
  constructor(client) {
    super(client, {
      name: "daily",
      description: {
        content: "𝑬𝒂𝒓𝒏 𝒔𝒐𝒎𝒆 𝒄𝒐𝒊𝒏𝒔 𝒅𝒂𝒊𝒍𝒚.",
        examples: ["𝒅𝒂𝒊𝒍𝒚"],
        usage: "𝒅𝒂𝒊𝒍𝒚",
      },
      category: "economy",
      aliases: ["daily"],
      cooldown: 5,
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

  run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const dailyMessages = language.locales.get(language.defaultLocale)
      ?.economyMessages?.dailyMessages;

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

        const baseCoins = chance.integer({ min: 50000, max: 100000 });
        const baseExp = chance.integer({ min: 100, max: 150 });

        let bonusCoins = 0;
        let bonusExp = 0;

        const verify = user.verification.verify.status === "verified";
        if (verify) {
          bonusCoins = Math.floor(baseCoins * 0.4);
          bonusExp = Math.floor(baseExp * 0.4);
        }

        const totalCoins = baseCoins + bonusCoins;
        const totalExp = baseExp + bonusExp;
        const newBalance = user.balance.coin + totalCoins;
        const newExp = user.profile.xp + totalExp;

        const now = moment().tz("Asia/Bangkok");
        const hours = now.hour();
        let nextDate = moment().tz("Asia/Bangkok");
        if (
          now.isAfter(moment().tz("Asia/Bangkok").hour(17).minute(0).second(0))
        ) {
          nextDate = moment().tz("Asia/Bangkok").add(1, "days");
        }
        const next5PM = nextDate.set({
          hour: 17,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        const timeUntilNext5PM = moment.duration(next5PM.diff(now));

        client.utils
          .checkCooldown(
            ctx.author.id,
            this.name.toLowerCase(),
            timeUntilNext5PM
          )
          .then((isCooldownExpired) => {
            if (!isCooldownExpired) {
              const duration = moment.duration(next5PM.diff(now));
              const cooldownMessage = dailyMessages.cooldown.replace(
                "%{time}",
                `${Math.floor(duration.asHours())}hrs, ${
                  Math.floor(duration.asMinutes()) % 60
                }mins, and ${Math.floor(duration.asSeconds()) % 60}secs`
              );
              const cooldownEmbed = client
                .embed()
                .setColor(color.danger)
                .setDescription(cooldownMessage);
              return ctx.sendMessage({ embeds: [cooldownEmbed] });
            } else {
              return Users.updateOne(
                { userId: user.userId },
                {
                  $set: {
                    "balance.coin": newBalance,
                    "profile.xp": newExp,
                  },
                }
              )
                .then(() => {
                  return client.utils.updateCooldown(
                    ctx.author.id,
                    this.name.toLowerCase(),
                    timeUntilNext5PM
                  );
                })
                .then(() => {
                  let bonusMessage = "";
                  if (bonusCoins > 0 || bonusExp > 0) {
                    bonusMessage = `\n****+40% Bonus****\n${
                      emoji.coin
                    }: ****+${client.utils.formatNumber(
                      bonusCoins
                    )}**** coins\n${emoji.exp} ****+${client.utils.formatNumber(
                      bonusExp
                    )}**** xp`;
                  }

                  const embed = client
                    .embed()
                    .setColor(color.main)
                    .setThumbnail(
                      client.utils.emojiToImage(
                        hours >= 6 && hours < 18
                          ? emoji.time.day
                          : emoji.time.night
                      )
                    )
                    .setDescription(
                      generalMessages.title
                        .replace("%{mainLeft}", emoji.mainLeft)
                        .replace("%{title}", "𝐃𝐀𝐈𝐋𝐘")
                        .replace("%{mainRight}", emoji.mainRight) +
                        dailyMessages.success
                          .replace("%{mainLeft}", emoji.mainLeft)
                          .replace("%{mainRight}", emoji.mainRight)
                          .replace("%{coinEmote}", emoji.coin)
                          .replace(
                            "%{coin}",
                            client.utils.formatNumber(baseCoins)
                          )
                          .replace("%{expEmote}", emoji.exp)
                          .replace("%{exp}", client.utils.formatNumber(baseExp))
                          .replace("%{bonusMessage}", bonusMessage)
                    )
                    .setImage(globalGif.banner.dailyReminder)
                    .setFooter({
                      text:
                        generalMessages.requestedBy.replace(
                          "%{username}",
                          ctx.author.displayName
                        ) || `Requested by ${ctx.author.displayName}`,
                      iconURL: ctx.author.displayAvatarURL(),
                    });

                  return ctx.sendMessage({ embeds: [embed] });
                });
            }
          })
          .catch((error) => {
            console.error("Error checking cooldown:", error);
            return client.utils.sendErrorMessage(
              client,
              ctx,
              generalMessages.userFetchError,
              color
            );
          });
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userFetchError,
          color
        );
      });
  }
};
