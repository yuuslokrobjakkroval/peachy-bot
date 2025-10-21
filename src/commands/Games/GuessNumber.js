const { Command } = require("../../structures");

module.exports = class GuessNumber extends Command {
  constructor(client) {
    super(client, {
      name: "guessnumber",
      description: {
        content: "Try to guess the number between 1 and 100.",
        examples: ["guessnumber"],
        usage: "guessnumber",
      },
      category: "fun",
      aliases: ["gn"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks", "AddReactions"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    const guessNumberMessages = language.locales.get(language.defaultLocale)
      ?.gameMessages?.guessNumberMessages;
    const congratulations = [
      emoji.congratulation,
      emoji.peachCongratulation,
      emoji.gomaCongratulation,
    ];
    client.utils.getUser(ctx.author.id).then((user) => {
      if (user.balance.coin < 1000) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "GUESS THE NUMBER")
                  .replace("%{mainRight}", emoji.mainRight) +
                  guessNumberMessages.insufficientBalance.description.replace(
                    "%{coinEmote}",
                    emoji.coin,
                  ),
              )
              .setFooter({
                text:
                  generalMessages.requestedBy.replace(
                    "%{username}",
                    ctx.author.displayName,
                  ) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
              }),
          ],
        });
      }

      user.balance.coin -= 1000;
      user.save();

      const numberToGuess = Math.floor(Math.random() * 100) + 1;
      console.log(numberToGuess);
      let hearts = 3;
      let incorrectGuesses = 0;

      const embed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }),
        )
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "GUESS THE NUMBER")
            .replace("%{mainRight}", emoji.mainRight) +
            guessNumberMessages.description,
        )
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName,
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      ctx.sendMessage({ embeds: [embed] });

      const filter = (response) => {
        const guess = parseInt(response.content);
        return (
          !isNaN(guess) &&
          guess >= 1 &&
          guess <= 100 &&
          response.author.id === ctx.author.id
        );
      };

      const collector = ctx.channel.createMessageCollector({
        filter,
        time: 30000,
      });

      collector.on("collect", async (response) => {
        const guess = parseInt(response.content);
        if (guess === numberToGuess) {
          const coinEarned =
            Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
          const xpEarned = Math.floor(Math.random() * 51) + 30;

          user.balance.coin += coinEarned;
          user.profile.xp = xpEarned;

          user.save().then(() => {
            const resultEmbed = client
              .embed()
              .setColor(color.success)
              .setDescription(
                generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "CORRECT ANSWER")
                  .replace("%{mainRight}", emoji.mainRight) +
                  `${
                    guessNumberMessages.correct.description
                  } ${client.utils.getRandomElement(
                    congratulations,
                  )} !!!\nYou guessed the number correctly: **${numberToGuess}**.\nYou've earned ${client.utils.formatNumber(
                    coinEarned,
                  )} ${emoji.coin} and ${xpEarned} XP.`,
              )
              .setFooter({
                text: generalMessages.gameOver.replace(
                  "%{user}",
                  ctx.author.displayName,
                ),
                iconURL: ctx.author.displayAvatarURL(),
              });

            ctx.sendMessage({ embeds: [resultEmbed] });
            collector.stop();
          });
        } else {
          hearts -= 1;
          incorrectGuesses += 1;
          let resultEmbed;

          if (hearts > 0) {
            let hint = "";
            if (incorrectGuesses === 1) {
              hint =
                guess < numberToGuess
                  ? guessNumberMessages.hint.bigger
                  : guessNumberMessages.hint.smaller;
            } else if (incorrectGuesses === 2) {
              const rangeSize = Math.floor(Math.random() * 16) + 5;
              const minRange = Math.max(1, numberToGuess - rangeSize);
              const maxRange = Math.min(100, numberToGuess + rangeSize);
              hint = `${guessNumberMessages.hint.range} **${minRange}** and **${maxRange}**.`;
            }

            resultEmbed = client
              .embed()
              .setColor(color.danger)
              .setDescription(
                generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "WRONG ANSWER")
                  .replace("%{mainRight}", emoji.mainRight) +
                  `${guessNumberMessages.incorrect.description} **${hearts}** hearts left. ${hint}`,
              )
              .setFooter({
                text: generalMessages.reply.replace(
                  "%{user}",
                  ctx.author.displayName,
                ),
                iconURL: ctx.author.displayAvatarURL(),
              });

            await ctx.sendMessage({ embeds: [resultEmbed] });
          } else {
            resultEmbed = client
              .embed()
              .setColor(color.danger)
              .setDescription(
                generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "GAME OVER")
                  .replace("%{mainRight}", emoji.mainRight) +
                  `${guessNumberMessages.gameOver.description} **${numberToGuess}**.`,
              )
              .setFooter({
                text: generalMessages.gameOver.replace(
                  "%{user}",
                  ctx.author.displayName,
                ),
                iconURL: ctx.author.displayAvatarURL(),
              });

            await ctx.sendMessage({ embeds: [resultEmbed] });
            collector.stop();
          }
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          const timeoutEmbed = client
            .embed()
            .setColor(color.warning)
            .setDescription(
              generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "TIME IS UP")
                .replace("%{mainRight}", emoji.mainRight) +
                guessNumberMessages.timeout.description,
            )
            .setFooter({
              text: `${ctx.author.displayName}, please start again`,
              iconURL: ctx.author.displayAvatarURL(),
            });

          await ctx.sendMessage({ embeds: [timeoutEmbed] });
        }
      });
    });
  }
};
