const BaseGiveaway = require("../../managers/BaseGiveaway.js");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem.js");
const importantItems = require("../../assets/inventory/ImportantItems.js");
const shopItems = require("../../assets/inventory/ShopItems.js");
const items = shopItems.flatMap((shop) => shop.inventory);

module.exports = class GiveawayShopItem extends BaseGiveaway {
  constructor(client) {
    super(client, {
      name: "gshopitem",
      description: {
        content:
          "Start a shop item giveaway for food, drink, themes, milk, ring, or other items.",
        examples: [
          'giveawayshopitem "Special food giveaway!" food f01 5 1h 1',
          'giveawayshopitem "Try this drink!" drink d01 2 2h 3',
        ],
        usage:
          "giveawayshopitem <description> <type> <itemID> <amount> <duration> <winners> [image] [thumbnail] [autoadd]",
      },
      category: "giveaway",
      aliases: [""],
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "description",
          description: "Custom description for the giveaway.",
          type: 3,
          required: true,
        },
        {
          name: "type",
          description: "The item type (food, drink, theme, milk, ring, etc).",
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
          name: "duration",
          description: "Duration of the giveaway (e.g. 1h, 1d, 1w).",
          type: 3,
          required: true,
        },
        {
          name: "winners",
          description: "Number of winners (1-20).",
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
          name: "thumbnail",
          description: "Thumbnail URL for the giveaway.",
          type: 11,
          required: false,
        },
        {
          name: "autoadd",
          description: "Automatically add item to winners (Owner Only).",
          type: 3,
          required: false,
        },
      ],
    });
  }

  /**
   * Validates item parameters
   * @param {Object} ctx - Command context
   * @param {Object} client - Discord client
   * @param {Object} color - Color configuration
   * @param {string} type - Item type
   * @param {string} itemID - Item ID
   * @param {number} amount - Item amount
   * @returns {Object} - Validation result with success flag and item data
   */
  async validateItemParams(ctx, client, color, type, itemID, amount) {
    // Find item category
    const category = items
      .concat(importantItems)
      .filter((c) => c.type === type);
    if (!category || category.length === 0) {
      await this.sendErrorMessage(
        ctx,
        client,
        color,
        `Invalid item type: ${type}. Available types include food, drink, theme, milk, ring, etc.`
      );
      return { success: false };
    }

    // Find specific item
    const item = category.find(
      (i) => i.id.toLowerCase() === itemID.toLowerCase()
    );
    if (!item) {
      await this.sendErrorMessage(
        ctx,
        client,
        color,
        `No item found with ID ${itemID} in category ${type}.`
      );
      return { success: false };
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      await this.sendErrorMessage(
        ctx,
        client,
        color,
        "Amount must be between 1 and 100."
      );
      return { success: false };
    }

    return { success: true, item };
  }

  async run(client, ctx, args, color, emoji, language) {
    // Defer reply to give us time to process
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
    }

    // Parse command arguments in the new order
    const description = ctx.isInteraction
      ? ctx.interaction.options.getString("description")
      : args[0];
    const type = ctx.isInteraction
      ? ctx.interaction.options.getString("type")
      : args[1];
    const itemID = ctx.isInteraction
      ? ctx.interaction.options.getString("itemid")
      : args[2];
    const amount = ctx.isInteraction
      ? ctx.interaction.options.getInteger("amount")
      : args[3];
    const durationStr = ctx.isInteraction
      ? ctx.interaction.options.getString("duration")
      : args[4];
    const winnersStr = ctx.isInteraction
      ? ctx.interaction.options.getInteger("winners")
      : args[5];
    const image = ctx.isInteraction
      ? ctx.interaction.options.getAttachment("image")
      : null;
    const thumbnail = ctx.isInteraction
      ? ctx.interaction.options.getAttachment("thumbnail")
      : null;
    const autoAdd = ctx.isInteraction
      ? ctx.interaction.options.getString("autoadd")
      : args[8];

    // Check autoadd permission
    if (autoAdd && !this.hasSpecialPermission(ctx.author.id, "autoadd")) {
      return ctx.isInteraction
        ? ctx.interaction.editReply({
            content: "Only the bot owner can enable auto-add for giveaways.",
            flags: 64,
          })
        : ctx.editMessage({
            content: "Only the bot owner can enable auto-add for giveaways.",
            flags: 64,
          });
    }

    // Validate common parameters
    const winners = Number.parseInt(winnersStr, 10);
    const commonValidation = await this.validateCommonParams(
      ctx,
      client,
      color,
      durationStr,
      winners
    );
    if (!commonValidation.success) return;

    // Extract validated data
    const { duration, endTime, formattedDuration } = commonValidation.data;

    // Validate item parameters
    const itemValidation = await this.validateItemParams(
      ctx,
      client,
      color,
      type,
      itemID,
      amount
    );
    if (!itemValidation.success) return;

    // Get validated item
    const item = itemValidation.item;

    // Create giveaway embed
    const giveawayEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle(
        `**ID: \`${item.id}\`\n${item.name} ${client.utils.formatNumber(
          amount
        )}**`
      )
      .setThumbnail(client.utils.emojiToImage(item.emoji))
      .setDescription(
        `${description ? `${description}\n\n` : ""}Click ${
          emoji.main
        } button to enter!\nWinners: ${winners}\nHosted by: ${
          ctx.author.displayName
        }\nEnds: <t:${formattedDuration}:R>`
      );

    // Add optional image and thumbnail
    if (image) giveawayEmbed.setImage(image.url);
    if (thumbnail) giveawayEmbed.setThumbnail(thumbnail.url);

    // Create buttons
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

    // Send giveaway message
    const messageResult = await this.createGiveawayMessage(ctx, {
      client,
      color,
      emoji,
      embed: giveawayEmbed,
      buttonRow,
    });

    if (!messageResult.success) return;

    // Save giveaway to database
    try {
      await GiveawayShopItemSchema.create({
        guildId: ctx.guild.id,
        channelId: ctx.channel.id,
        messageId: messageResult.message.id,
        hostedBy: ctx.author.id,
        winners: winners,
        itemId: item.id,
        type: type,
        amount: amount,
        endTime: endTime,
        paused: false,
        ended: false,
        entered: [],
        autoAdd: !!autoAdd,
        retryAutopay: false,
        winnerId: [],
        rerollOptions: [],
        description: description || "",
      });

      // Send confirmation message
      const confirmEmbed = client
        .embed()
        .setColor(color.success)
        .setDescription(
          `Item giveaway created successfully! It will end <t:${formattedDuration}:R>.`
        );

      await ctx.channel.send({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error("Error creating item giveaway:", error);
      await ctx.channel.send({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "There was an error saving the giveaway. Please try again."
            ),
        ],
      });
    }
  }
};
