const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");
const Logger = require("../../structures/Logger");

const maxAmount = 250000;
const SPECIAL_CHANNELS = ["1376910445453250660", "1376911850209284146"];

module.exports = class Slots extends Command {
  constructor(client) {
    super(client, {
      name: "slots",
      description: {
        content: "Bet your money in the slot machine!",
        examples: ["slots 100"],
        usage: "slots <baseCoins>",
      },
      category: "gambling",
      aliases: ["slot", "s"],
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
          description: "The baseCoins you want to bet.",
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
    const slotMessages = language.locales.get(language.defaultLocale)
      ?.gamblingMessages?.slotMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);
      const SLOTS = [
        emoji.slots.x1,
        emoji.slots.x2,
        emoji.slots.x3,
        emoji.slots.x4,
        emoji.slots.x5,
        emoji.slots.x10,
      ];
      const { coin, bank, slots } = user.balance;

      if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
        const activeCommand = user.validation.isKlaKlouk
          ? "Kla Klouk"
          : "Multiple Transfer";
        return client.utils.sendErrorMessage(
          client,
          ctx,
          `You have already started the ${activeCommand} event. Please finish it before using this command.`,
          color
        );
      }

      if (coin < 1) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.zeroBalance,
          color
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
            color
          );
        }
      }

      const baseCoins = Number.parseInt(Math.min(amount, coin, maxAmount));

      // Update the user's balance for the bet
      await Users.updateOne(
        { userId: ctx.author.id },
        {
          $set: {
            "balance.coin": coin - baseCoins,
            "balance.slots": slots + baseCoins,
            "balance.bank": bank,
          },
        }
      );

      // Decide the result of the slots with updated win probabilities
      let rslots = [];
      const rand = client.utils.getRandomNumber(1, 100);
      let win = 0;

      // Check for luck buff from potions
      let baseWinThreshold = 0;
      const luckBuff = client.luckBuffs?.get(ctx.author.id);
      const isLuckActive = luckBuff && luckBuff.expires > Date.now();
      const luckBoost = isLuckActive ? 10 : 0; // 10% boost for potion users

      // Determine win probability based on user status and channel
      const isSpecialChannel = SPECIAL_CHANNELS.includes(ctx.channelId);

      if (isSpecialChannel) {
        // Special channel: 50-65% win chance
        baseWinThreshold = client.utils.getRandomNumber(50, 65);
      } else if (user.verification.isBlacklist) {
        // Blacklisted users: 10% win chance
        baseWinThreshold = 10;
      } else if (isLuckActive) {
        // Potion users: 45-55% win chance
        baseWinThreshold = client.utils.getRandomNumber(45, 55);
      } else {
        // Normal users: 30-50% win chance
        baseWinThreshold = client.utils.getRandomNumber(30, 50);
      }

      const totalWinThreshold = Math.min(baseWinThreshold + luckBoost, 100); // Cap total win chance at 100%

      if (rand <= totalWinThreshold) {
        // Distribute win multipliers with adjusted probabilities
        const winRand = client.utils.getRandomNumber(1, 100);
        if (winRand <= 5) {
          // 5% chance for 10x (very rare)
          win = baseCoins * 10;
          rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
        } else if (winRand <= 15) {
          // 10% chance for 5x (rare)
          win = baseCoins * 5;
          rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
        } else if (winRand <= 30) {
          // 15% chance for 4x
          win = baseCoins * 4;
          rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
        } else if (winRand <= 50) {
          // 20% chance for 3x
          win = baseCoins * 3;
          rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
        } else if (winRand <= 75) {
          // 25% chance for 2x
          win = baseCoins * 2;
          rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
        } else {
          // 25% chance for 1x
          win = baseCoins;
          rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
        }
      } else {
        // Loss case: generate different slots
        const slot1 = Math.floor(Math.random() * SLOTS.length);
        let slot2 = Math.floor(Math.random() * SLOTS.length);
        let slot3 = Math.floor(Math.random() * SLOTS.length);
        if (slot2 === slot1)
          slot2 =
            (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
            SLOTS.length;
        if (slot3 === slot1 || slot3 === slot2)
          slot3 =
            (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) %
            SLOTS.length;
        rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
        win = 0;
      }

      const newBalance = coin + win - baseCoins;

      const initialEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ═╗\n ## **   「${emoji.slots.spin} ${emoji.slots.spin} ${
            emoji.slots.spin
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n`
        )
        .setFooter({
          text: `${generalMessages.gameInProgress.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      const message = await ctx.sendMessage({ embeds: [initialEmbed] });

      // Update balance after sending message
      await Users.updateOne(
        { userId: ctx.author.id },
        { $set: { "balance.coin": newBalance, "balance.bank": bank } }
      );

      const spinEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ═╗\n ## **   「${rslots[0]} ${emoji.slots.spin} ${
            emoji.slots.spin
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n`
        )
        .setFooter({
          text: `${generalMessages.gameInProgress.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      const spinSecondEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ═╗\n ## **   「${rslots[0]} ${emoji.slots.spin} ${
            rslots[2]
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n`
        )
        .setFooter({
          text: `${generalMessages.gameInProgress.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      const resultEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          win === 0
            ? client.utils.emojiToImage(globalEmoji.option.lose)
            : client.utils.emojiToImage(globalEmoji.option.win)
        )
        .setDescription(
          `# **${emoji.mainLeft} SLOTS ${emoji.mainRight}**\n ### ╔══ »•» ${
            globalEmoji.romdoul
          } «• ═╗\n ## **   「${rslots[0]} ${rslots[1]} ${
            rslots[2]
          }」 **\n ### ╚═ •» ${
            globalEmoji.romdoul
          } «•« ══╝\n\n${slotMessages.bet
            .replace("%{coin}", client.utils.formatNumber(baseCoins))
            .replace("%{coinEmote}", emoji.coin)}\n${
            win === 0
              ? `${slotMessages.lost
                  .replace("%{coin}", client.utils.formatNumber(baseCoins))
                  .replace("%{coinEmote}", emoji.coin)}`
              : `${slotMessages.won
                  .replace("%{coin}", client.utils.formatNumber(win))
                  .replace("%{coinEmote}", emoji.coin)}`
          }`
        )
        .setFooter({
          text: `${generalMessages.gameOver.replace(
            "%{user}",
            ctx.author.displayName
          )}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      setTimeout(async () => {
        await message.edit({ embeds: [spinEmbed] });
        setTimeout(async () => {
          await message.edit({ embeds: [spinSecondEmbed] });
          setTimeout(async () => {
            await message.edit({ embeds: [resultEmbed] });
          }, 1000);
        }, 700);
      }, 1000);
    } catch (error) {
      console.error("Error in slots command:", error);
      client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred. Please try again later.",
        color
      );
    }
  }
};
