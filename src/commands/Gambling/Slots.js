const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

const maxAmount = 250000;

module.exports = class Slots extends Command {
  constructor(client) {
    super(client, {
      name: "slots",
      description: {
        content: "𝑩𝒆𝒕 𝒚𝒐𝒖𝒓 𝒎𝒐𝒏𝒆𝒚 𝒊𝒏 𝒕𝒉𝒆 𝒔𝒍𝒐𝒕 𝒎𝒂𝒄𝒉𝒊𝒏𝒆!",
        examples: ["slots 100"],
        usage: "slots <baseCoins>",
      },
      category: "gambling",
      aliases: ["slot", "s"],
      cooldown: 3,
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
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const slotMessages = language.locales.get(language.defaultLocale)?.gamblingMessages?.slotMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);
      const SLOTS = [
        emoji.slots.cat,
        emoji.slots.coffee,
        emoji.slots.heart,
        emoji.slots.cake,
        emoji.slots.milk,
        emoji.slots.peachy,
      ];
      const verify = user.verification.verify.status === "verified";
      const { coin, bank, slots } = user.balance;

      if (user.validation.isKlaKlouk || user.validation.isMultiTransfer) {
        const activeCommand = user.validation.isKlaKlouk ? "𝑲𝒍𝒂 𝑲𝒌𝒍𝒐𝒖𝒌" : "𝑴𝒖𝒍𝒕𝒊𝒑𝒍𝒆 𝑻𝒓𝒂𝒏𝒔𝒇𝒆𝒓";
        return client.utils.sendErrorMessage(client, ctx, `𝒀𝒐𝒖 𝒉𝒂𝒗𝒆 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝒔𝒕𝒂𝒓𝒕𝒆𝒅 𝒕𝒉𝒆 ${activeCommand} 𝒆𝒗𝒆𝒏𝒕. 𝑷𝒍𝒆𝒂𝒔𝒆 𝒇𝒊𝒏𝒊𝒔𝒉 𝒊𝒕 𝒃𝒆𝒇𝒐𝒓𝒆 𝒖𝒔𝒊𝒏𝒈 𝒕𝒉𝒊𝒔 𝒄𝒐𝒎𝒎𝒂𝒏𝒅.`, color);
      }

      if (coin < 1) {
        return client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
      }

      let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;

      if (amount.toString().startsWith("-")) {
        return ctx.sendMessage({
          embeds: [client.embed().setColor(color.danger).setDescription(generalMessages.invalidAmount)],
        });
      }

      if (isNaN(amount) || amount <= 0 || amount.toString().includes(".") || amount.toString().includes(",")) {
        const amountMap = { all: coin, half: Math.ceil(coin / 2) };
        if (amount in amountMap) {
          amount = amountMap[amount];
        } else {
          return client.utils.sendErrorMessage(client, ctx, generalMessages.invalidAmount, color);
        }
      }

      const baseCoins = parseInt(Math.min(amount, coin, maxAmount));

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

      // Decide the result of the slots
      let rslots = [];
      let rand = client.utils.getRandomNumber(1, 100);
      let win = 0;

      if (user.verification.isBlacklist) {
        if (rand <= 10) {
          win = baseCoins;
          rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
        } else if (rand <= 13) {
          win = baseCoins * 3;
          rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
        } else if (rand <= 15) {
          win = baseCoins * 4;
          rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
        } else if (rand <= 23) {
          win = baseCoins * 5;
          rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
        } else if (rand <= 24) {
          win = baseCoins * 2;
          rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
        } else if (rand <= 24.5) {
          win = baseCoins * 10;
          rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
        } else {
          let slot1 = Math.floor(Math.random() * SLOTS.length);
          let slot2 = Math.floor(Math.random() * SLOTS.length);
          let slot3 = Math.floor(Math.random() * SLOTS.length);
          if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
          if (slot3 === slot1 || slot3 === slot2)
            slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
          rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
        }
      } else {
        if (rand <= 20) {
          win = baseCoins;
          rslots.push(SLOTS[0], SLOTS[0], SLOTS[0]);
        } else if (rand <= 30) {
          win = baseCoins * 2;
          rslots.push(SLOTS[1], SLOTS[1], SLOTS[1]);
        } else if (rand <= 36) {
          win = baseCoins * 3;
          rslots.push(SLOTS[2], SLOTS[2], SLOTS[2]);
        } else if (rand <= 41) {
          win = baseCoins * 4;
          rslots.push(SLOTS[3], SLOTS[3], SLOTS[3]);
        } else if (rand <= 45) {
          win = baseCoins * 5;
          rslots.push(SLOTS[4], SLOTS[4], SLOTS[4]);
        } else if (rand <= 47.5) {
          win = baseCoins * 10;
          rslots.push(SLOTS[5], SLOTS[5], SLOTS[5]);
        } else {
          let slot1 = Math.floor(Math.random() * SLOTS.length);
          let slot2 = Math.floor(Math.random() * SLOTS.length);
          let slot3 = Math.floor(Math.random() * SLOTS.length);
          if (slot2 === slot1) slot2 = (slot1 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
          if (slot3 === slot1 || slot3 === slot2)
            slot3 = (slot2 + Math.ceil(Math.random() * (SLOTS.length - 1))) % SLOTS.length;
          rslots = [SLOTS[slot1], SLOTS[slot2], SLOTS[slot3]];
          win = 0;
        }
      }

      const newBalance = coin + win - baseCoins;

      const initialEmbed = client.embed().setColor(color.main).setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })).setDescription(
          `# ****${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}****\n ### ╔══ »•» ${globalEmoji.romdoul} «• ═╗\n ## ****   「${emoji.slots.spin} ${emoji.slots.spin} ${emoji.slots.spin}」 ****\n ### ╚═ •» ${globalEmoji.romdoul} «•« ══╝\n\n${slotMessages.bet.replace("%{coin}", client.utils.formatNumber(baseCoins)).replace("%{coinEmote}", emoji.coin)}\n`
      ).setFooter({ text: `${generalMessages.gameInProgress.replace("%{user}", ctx.author.displayName)}`, iconURL: ctx.author.displayAvatarURL() });

      const message = await ctx.sendMessage({ embeds: [initialEmbed] });

      // Update balance after sending message
      await Users.updateOne({ userId: ctx.author.id }, { $set: { "balance.coin": newBalance, "balance.bank": bank } });

      const spinEmbed = client.embed().setColor(color.main).setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })).setDescription(
          `# ****${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}****\n ### ╔══ »•» ${globalEmoji.romdoul} «• ═╗\n ## ****   「${rslots[0]} ${emoji.slots.spin} ${emoji.slots.spin}」 ****\n ### ╚═ •» ${globalEmoji.romdoul} «•« ══╝\n\n${slotMessages.bet.replace("%{coin}", client.utils.formatNumber(baseCoins)).replace("%{coinEmote}", emoji.coin)}\n`
      ).setFooter({ text: `${generalMessages.gameInProgress.replace("%{user}", ctx.author.displayName)}`, iconURL: ctx.author.displayAvatarURL() });

      const spinSecondEmbed = client.embed().setColor(color.main).setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })).setDescription(
          `# ****${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}****\n ### ╔══ »•» ${globalEmoji.romdoul} «• ═╗\n ## ****   「${rslots[0]} ${emoji.slots.spin} ${rslots[2]}」 ****\n ### ╚═ •» ${globalEmoji.romdoul} «•« ══╝\n\n${slotMessages.bet.replace("%{coin}", client.utils.formatNumber(baseCoins)).replace("%{coinEmote}", emoji.coin)}\n`
      ).setFooter({ text: `${generalMessages.gameInProgress.replace("%{user}", ctx.author.displayName)}`, iconURL: ctx.author.displayAvatarURL() });

      const resultEmbed = client.embed().setColor(color.main).setThumbnail(win === 0 ? client.utils.emojiToImage(globalEmoji.option.lose) : client.utils.emojiToImage(globalEmoji.option.win)).setDescription(
          `# ****${emoji.slots.mainLeft} 𝐒𝐋𝐎𝐓𝐒 ${emoji.slots.mainRight}****\n ### ╔══ »•» ${globalEmoji.romdoul} «• ═╗\n ## ****   「${rslots[0]} ${rslots[1]} ${rslots[2]}」 ****\n ### ╚═ •» ${globalEmoji.romdoul} «•« ══╝\n\n${slotMessages.bet.replace("%{coin}", client.utils.formatNumber(baseCoins)).replace("%{coinEmote}", emoji.coin)}\n${win === 0 ? `${slotMessages.lost.replace("%{coin}", client.utils.formatNumber(baseCoins)).replace("%{coinEmote}", emoji.coin)}` : `${slotMessages.won.replace("%{coin}", client.utils.formatNumber(win)).replace("%{coinEmote}", emoji.coin)}`}`
      ).setFooter({ text: `${generalMessages.gameOver.replace("%{user}", ctx.author.displayName)}`, iconURL: ctx.author.displayAvatarURL() });

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
      client.utils.sendErrorMessage(client, ctx, "An error occurred. Please try again later.", color);
    }
  }
};
