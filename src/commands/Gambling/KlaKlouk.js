const { Command } = require("../../structures/index.js");
const kkUtil = require("../../utils/KlaKloukUtil");

const maxAmount = 300000;

module.exports = class KlaKlouk extends Command {
  constructor(client) {
    super(client, {
      name: "klaklouk",
      description: {
        content: "Play the KlaKlouk game and see if you can win!",
        examples: ["kk 1000"],
        usage: "kk <amount>",
      },
      category: "gambling",
      aliases: ["kk"],
      cooldown: 4,
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
          description: "The amount you want to bet.",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    const klaKloukMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.klaKloukMessages;
    try {
      client.utils.getUser(ctx.author.id).then((user) => {
        const { coin } = user.balance;

        if (coin < 1) {
          return client.utils.sendErrorMessage(
            client,
            ctx,
            generalMessages.zeroBalance,
            color,
          );
        }

        let amount = ctx.isInteraction
          ? ctx.interaction.options.data[0]?.value || 1
          : args[0] || 1;

        if (amount.toString().startsWith("-")) {
          return ctx.sendMessage({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(generalMessages.invalidAmount),
            ],
          });
        }

        if (
          isNaN(amount) ||
          amount <= 0 ||
          amount.toString().includes(".") ||
          amount.toString().includes(",")
        ) {
          const amountMap = { all: coin, half: Math.ceil(coin / 2) };
          if (amount in amountMap) {
            amount = amountMap[amount];
          } else {
            return client.utils.sendErrorMessage(
              client,
              ctx,
              generalMessages.invalidAmount,
              color,
            );
          }
        }

        const betCoins = Number.parseInt(Math.min(amount, coin, maxAmount));
        return kkUtil.klakloukStarting(
          client,
          ctx,
          color,
          emoji,
          user,
          coin,
          betCoins,
          generalMessages,
          klaKloukMessages,
        );
      });
    } catch (error) {
      console.error(error);
    }
  }
};
