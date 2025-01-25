const { Command } = require("../../structures/index.js");
const globalConfig = require("../../utils/Config");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem.js");
const importantItems = require("../../assets/inventory/ImportantItems.js");
const shopItems = require("../../assets/inventory/ShopItems.js");
const items = shopItems.flatMap((shop) => shop.inventory);
const ms = require("ms");

module.exports = class GiveawayShopItem extends Command {
  constructor(client) {
    super(client, {
      name: "giveawayshopitem",
      description: {
        content:
          "𝑺𝒕𝒂𝒓𝒕 𝒂 𝒔𝒉𝒐𝒑 𝒊𝒕𝒆𝒎 𝒈𝒊𝒗𝒆𝒂𝒘𝒂𝒚 𝒇𝒐𝒓 𝒇𝒐𝒐𝒅, 𝒅𝒓𝒊𝒏𝒌, 𝒐𝒓 𝒕𝒉𝒆𝒎𝒆𝒔, 𝒎𝒊𝒍𝒌, 𝒓𝒊𝒏𝒈 𝒊𝒏 𝒕𝒉𝒆 𝒔𝒉𝒐𝒑.",
        examples: [
          "giveawayshopitem 1h 1 food f01 5 true",
          "giveawayshopitem 2h 3 drink d01 false @User #channel",
        ],
        usage:
          "giveawayshopitem <duration> <winners> <type> <itemID> <amount> <image> <thumbnail> <autoadd> [host] [channel]",
      },
      category: "giveaway",
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "duration",
          description: "Duration of the giveaway.",
          type: 3,
          required: true,
        },
        {
          name: "winners",
          description: "Number of winners.",
          type: 4,
          required: true,
        },
        {
          name: "type",
          description: "The giveaway type (food, drink, theme, milk, ring).",
          type: 3,
          required: true,
        },
        {
          name: "itemid",
          description: "The item ID from the shop.",
          type: 3,
          required: true,
        },
        {
          name: "amount",
          description: "The amount of items to give away.",
          type: 4,
          required: true,
        },
        {
          name: "image",
          description: "Image URL for the giveaway.",
          type: 11,
          required: false,
        },
        {
          name: "autoadd",
          description: "Automatically add item winners (true/false).",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is Thinking...`);
    }

    const isOwner = globalConfig.owners.includes(ctx.author.id);
    const durationStr = ctx.isInteraction
      ? ctx.interaction.options.getString("duration")
      : args[0];
    const winnersStr = ctx.isInteraction
      ? ctx.interaction.options.getInteger("winners")
      : args[1];
    const type = ctx.isInteraction
      ? ctx.interaction.options.getString("type")
      : args[2];
    const itemID = ctx.isInteraction
      ? ctx.interaction.options.getString("itemid")
      : args[3];
    const amount = ctx.isInteraction
      ? ctx.interaction.options.getInteger("amount")
      : args[4];
    const image = ctx.isInteraction
      ? ctx.interaction.options.getAttachment("image")
      : args[5];
    const autoAdd = ctx.isInteraction
      ? ctx.interaction.options.getString("autoadd")
      : args[6];

    if (autoAdd && !isOwner) {
      return ctx.isInteraction
        ? ctx.interaction.editReply({
            content: "Only the bot owner can enable auto add for giveaways.",
            ephemeral: true,
          })
        : ctx.editMessage({
            content: "Only the bot owner can enable auto add for giveaways.",
            ephemeral: true,
          });
    }

    const category = items
      .concat(importantItems)
      .filter((c) => c.type === type);
    if (!category)
      return ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: "Invalid item type specified.",
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: "Invalid item type specified.",
            fetchReply: true,
          });

    const item = category.find(
      (i) => i.id.toLowerCase() === itemID.toLowerCase()
    );
    if (!item)
      return ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: `No item found with ID ${itemID} in category ${type}.`,
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: `No item found with ID ${itemID} in category ${type}.`,
            fetchReply: true,
          });

    const duration = ms(durationStr);
    const winners = parseInt(winnersStr, 10);

    // Validate inputs
    if (!duration || isNaN(winners) || winners <= 0 || !itemID || amount <= 0) {
      const replyMessage = {
        embeds: [
          client
            .embed()
            .setAuthor({
              name: client.user.displayName,
              iconURL: client.user.displayAvatarURL(),
            })
            .setColor(color.danger)
            .setDescription(
              "Invalid input. Please ensure the duration, number of winners, amount, and prize are correctly provided."
            ),
        ],
      };
      if (ctx.isInteraction) {
        await ctx.interaction.editReply(replyMessage);
      } else {
        await ctx.editMessage(replyMessage);
      }
      return;
    }

    const endTime = Date.now() + duration;
    const formattedDuration = Math.floor(endTime / 1000);

    const giveawayEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle(
        `****ID: \`${item.id}\`\n${item.name} ${client.utils.formatNumber(
          amount
        )}****`
      )
      .setThumbnail(client.utils.emojiToImage(item.emoji))
      .setDescription(
        `Click ${emoji.main} button to enter!\nWinners: ${winners}\nHosted by: ${ctx.author.displayName}\nEnds: <t:${formattedDuration}:R>`
      );

    if (image) giveawayEmbed.setImage(image.url);

    const joinButton = client.utils.fullOptionButton(
      "giveawayshopitem-join",
      emoji.main,
      "0",
      1,
      false
    );
    const participantsButton = client.utils.fullOptionButton(
      "giveawayshopitem-participants",
      "",
      "Participants",
      2,
      false
    );

    const buttonRow = client.utils.createButtonRow(
      joinButton,
      participantsButton
    );

    // After sending the giveaway message
    let giveawayMessage;
    try {
      giveawayMessage = ctx.isInteraction
        ? await ctx.interaction.editReply({
            content: "",
            embeds: [giveawayEmbed],
            components: [buttonRow],
            fetchReply: true,
          })
        : await ctx.editMessage({
            content: "",
            embeds: [giveawayEmbed],
            components: [buttonRow],
            fetchReply: true,
          });
    } catch (err) {
      console.error(err);
      const response = "There was an error sending the giveaway message.";
      return ctx.isInteraction
        ? ctx.interaction.editReply({ content: response })
        : ctx.editMessage({ content: response });
    }

    await GiveawayShopItemSchema.create({
      guildId: ctx.guild.id,
      channelId: ctx.channel.id,
      messageId: giveawayMessage.id,
      hostedBy: ctx.author.id,
      winners: winners,
      itemId: item.id,
      type: type,
      amount: amount,
      endTime: Date.now() + duration,
      paused: false,
      ended: false,
      entered: [],
      autoAdd: !!autoAdd,
      retryAutopay: false,
      winnerId: [],
      rerollOptions: [],
    });
  }
};
