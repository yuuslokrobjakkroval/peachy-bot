const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const MoreItems = ShopItems.flatMap((shop) => shop.inventory);
const AllItems = [...ImportantItems, ...MoreItems].filter(
  (item) => item.price.sell !== 0
);

module.exports = class Sell extends Command {
  constructor(client) {
    super(client, {
      name: "sell",
      description: {
        content: "Sell an item from your inventory.",
        examples: ["sell coal", "sell all", "sell coal 5"],
        usage: "sell <item_id> [amount]",
      },
      cooldown: 5,
      category: "inventory",
      aliases: [],
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "items",
          description: "The item you want to sell.",
          type: 3,
          required: true,
        },
        {
          name: "amount",
          description: "The amount of the item you want to sell.",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const sellMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.sellMessages;

    try {
      const user = await Users.findOne({ userId: ctx.author.id });
      if (!user || !user.inventory || user.inventory.length === 0) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          sellMessages.inventoryEmpty,
          color
        );
      }

      const itemId = ctx.isInteraction
        ? ctx.interaction.options.getString("items")
        : args[0];

      // Handle "all" command to sell everything
      if (itemId.toLowerCase() === "all") {
        return await this.sellAllItems(
          client,
          ctx,
          user,
          color,
          emoji,
          sellMessages
        );
      }

      // Find the item in the database
      const itemInfo = AllItems.find((item) => item.id === itemId);
      if (!itemInfo) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          sellMessages.itemNotFound.replace("{item}", itemId),
          color
        );
      }

      const hasItems = user.inventory.find((item) => item.id === itemId);
      if (!hasItems || hasItems.quantity <= 0) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          sellMessages.itemNotOwned.replace("{item}", itemInfo.name),
          color
        );
      }

      if (itemInfo.price.sell === 0) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          sellMessages.itemNotSellable.replace("{item}", itemInfo.name),
          color
        );
      }

      const quantity = ctx.isInteraction
        ? ctx.interaction.options.getString("amount") || "1"
        : args[1] || "1";

      // Show interactive sell interface
      return await this.showSellInterface(
        client,
        ctx,
        user,
        itemInfo,
        hasItems,
        quantity,
        color,
        emoji,
        sellMessages
      );
    } catch (error) {
      console.error("Error in Sell command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        sellMessages.sellError,
        color
      );
    }
  }

  async showSellInterface(
    client,
    ctx,
    user,
    itemInfo,
    hasItems,
    quantityInput,
    color,
    emoji,
    sellMessages
  ) {
    // Parse the quantity
    let quantity = this.parseQuantity(quantityInput, hasItems.quantity);
    if (quantity === null) {
      quantity = 1; // Default to 1 if invalid
    }

    // Calculate sale price
    const salePrice = itemInfo.price.sell * quantity;

    // Create the initial embed
    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle(`${itemInfo.emoji} ${itemInfo.name}`)
      .setDescription(
        `**${sellMessages.quantity.replace("{quantity}", quantity)}**\n` +
          `**${sellMessages.totalValue
            .replace("{coinEmoji}", emoji.coin)
            .replace("{value}", client.utils.formatNumber(salePrice))}**\n\n` +
          (itemInfo.description ? `*${itemInfo.description}*\n\n` : "") +
          `${sellMessages.remainingBalance
            .replace("{coinEmoji}", emoji.coin)
            .replace(
              "{balance}",
              client.utils.formatNumber(user.balance.coin)
            )}`
      )
      .setThumbnail(client.utils.emojiToImage(itemInfo.emoji))
      .setFooter({
        text: `You have ${hasItems.quantity}x ${itemInfo.name}`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    // Create quantity adjustment buttons
    const decreaseButton = new ButtonBuilder()
      .setCustomId("decrease_quantity")
      .setLabel("-")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(quantity <= 1);

    const quantityButton = new ButtonBuilder()
      .setCustomId("quantity_indicator")
      .setLabel(`${quantity}/${hasItems.quantity}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const increaseButton = new ButtonBuilder()
      .setCustomId("increase_quantity")
      .setLabel("+")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(quantity >= hasItems.quantity);

    // Create action buttons
    const sellOneButton = new ButtonBuilder()
      .setCustomId("sell_one")
      .setLabel(sellMessages.sellOne)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1️⃣");

    const sellHalfButton = new ButtonBuilder()
      .setCustomId("sell_half")
      .setLabel(sellMessages.sellHalf)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("2️⃣")
      .setDisabled(hasItems.quantity <= 1);

    const sellAllButton = new ButtonBuilder()
      .setCustomId("sell_all")
      .setLabel(sellMessages.sellAllButtonLabel)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("3️⃣");

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm_sell")
      .setLabel(sellMessages.confirm)
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅");

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_sell")
      .setLabel(sellMessages.cancel)
      .setStyle(ButtonStyle.Danger)
      .setEmoji("❌");

    // Create rows
    const quantityRow = new ActionRowBuilder().addComponents(
      decreaseButton,
      quantityButton,
      increaseButton
    );
    const presetRow = new ActionRowBuilder().addComponents(
      sellOneButton,
      sellHalfButton,
      sellAllButton
    );
    const actionRow = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton
    );

    // Send the message
    const message = await ctx.sendMessage({
      embeds: [embed],
      components: [quantityRow, presetRow, actionRow],
    });

    // Create collector
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 60000, // 1 minute timeout
    });

    // Current state
    let currentQuantity = quantity;

    collector.on("collect", async (interaction) => {
      try {
        switch (interaction.customId) {
          case "decrease_quantity":
            if (currentQuantity > 1) {
              currentQuantity--;
            }
            break;

          case "increase_quantity":
            if (currentQuantity < hasItems.quantity) {
              currentQuantity++;
            }
            break;

          case "sell_one":
            currentQuantity = 1;
            break;

          case "sell_half":
            currentQuantity = Math.ceil(hasItems.quantity / 2);
            break;

          case "sell_all":
            currentQuantity = hasItems.quantity;
            break;

          case "confirm_sell":
            // Process the sale
            await this.processSale(
              client,
              ctx,
              user,
              itemInfo,
              currentQuantity,
              interaction,
              color,
              emoji,
              sellMessages
            );
            collector.stop();
            return;

          case "cancel_sell":
            await interaction.update({
              embeds: [
                client
                  .embed()
                  .setColor(color.danger)
                  .setDescription(sellMessages.sellCancelled),
              ],
              components: [],
            });
            collector.stop();
            return;
        }

        // Update the sale price
        const newSalePrice = itemInfo.price.sell * currentQuantity;

        // Update the embed
        const updatedEmbed = client
          .embed()
          .setColor(color.main)
          .setTitle(`${itemInfo.emoji} ${itemInfo.name}`)
          .setDescription(
            `**${sellMessages.quantity.replace(
              "{quantity}",
              currentQuantity
            )}**\n` +
              `**${sellMessages.totalValue
                .replace("{coinEmoji}", emoji.coin)
                .replace(
                  "{value}",
                  client.utils.formatNumber(newSalePrice)
                )}**\n\n` +
              (itemInfo.description ? `*${itemInfo.description}*\n\n` : "") +
              `${sellMessages.remainingBalance
                .replace("{coinEmoji}", emoji.coin)
                .replace(
                  "{balance}",
                  client.utils.formatNumber(user.balance.coin)
                )}`
          )
          .setThumbnail(client.utils.emojiToImage(itemInfo.emoji))
          .setFooter({
            text: `You have ${hasItems.quantity}x ${itemInfo.name}`,
            iconURL: ctx.author.displayAvatarURL(),
          });

        // Update buttons
        const updatedDecreaseButton = ButtonBuilder.from(
          decreaseButton
        ).setDisabled(currentQuantity <= 1);

        const updatedQuantityButton = ButtonBuilder.from(
          quantityButton
        ).setLabel(`${currentQuantity}/${hasItems.quantity}`);

        const updatedIncreaseButton = ButtonBuilder.from(
          increaseButton
        ).setDisabled(currentQuantity >= hasItems.quantity);

        const updatedQuantityRow = new ActionRowBuilder().addComponents(
          updatedDecreaseButton,
          updatedQuantityButton,
          updatedIncreaseButton
        );

        // Update the message
        await interaction.update({
          embeds: [updatedEmbed],
          components: [updatedQuantityRow, presetRow, actionRow],
        });
      } catch (error) {
        console.error("Error in sell interaction:", error);
        try {
          await interaction.update({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(sellMessages.sellError),
            ],
            components: [],
          });
        } catch (replyError) {
          console.error("Error replying to interaction:", replyError);
        }
        collector.stop();
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        try {
          // Disable all buttons
          const disabledComponents = message.components.map((row) => {
            const newRow = new ActionRowBuilder();
            row.components.forEach((component) => {
              newRow.addComponents(
                ButtonBuilder.from(component).setDisabled(true)
              );
            });
            return newRow;
          });

          await message.edit({ components: disabledComponents });
        } catch (error) {
          console.error("Error disabling buttons:", error);
        }
      }
    });

    return message;
  }

  async processSale(
    client,
    ctx,
    user,
    itemInfo,
    quantity,
    interaction,
    color,
    emoji,
    sellMessages
  ) {
    try {
      // Calculate total sale price
      const totalSalePrice = itemInfo.price.sell * quantity;

      // Update the user's inventory and balance
      const updatedUser = await Users.findOneAndUpdate(
        { userId: ctx.author.id, "inventory.id": itemInfo.id },
        {
          $inc: {
            "balance.coin": totalSalePrice,
            "inventory.$.quantity": -quantity,
          },
        },
        { new: true }
      );

      // If the item quantity is now 0, remove it from inventory
      if (
        updatedUser.inventory.find((item) => item.id === itemInfo.id)
          ?.quantity <= 0
      ) {
        await Users.updateOne(
          { userId: ctx.author.id },
          {
            $pull: {
              inventory: { id: itemInfo.id },
              equip: { id: itemInfo.id },
            },
          }
        );
      }

      // Send success message
      await interaction.update({
        embeds: [
          client
            .embed()
            .setColor(color.success)
            .setDescription(
              sellMessages.itemSold
                .replace("{emoji}", itemInfo.emoji)
                .replace("{quantity}", quantity)
                .replace("{item}", itemInfo.name)
                .replace("{coinEmoji}", emoji.coin)
                .replace("{price}", client.utils.formatNumber(totalSalePrice))
            )
            .setFooter({
              text: sellMessages.remainingBalance
                .replace("{coinEmoji}", "")
                .replace(
                  "{balance}",
                  client.utils.formatNumber(updatedUser.balance.coin)
                ),
              iconURL: ctx.author.displayAvatarURL(),
            }),
        ],
        components: [],
      });
    } catch (error) {
      console.error("Error processing sale:", error);
      await interaction.update({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(sellMessages.sellError),
        ],
        components: [],
      });
    }
  }

  async sellAllItems(client, ctx, user, color, emoji, sellMessages) {
    try {
      // Get all sellable items from the user's inventory
      const sellableItems = user.inventory.filter((item) => {
        const itemInfo = AllItems.find((i) => i.id === item.id);
        return itemInfo && itemInfo.price.sell > 0;
      });

      if (sellableItems.length === 0) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          sellMessages.noSellableItems,
          color
        );
      }

      // Calculate total value
      let totalValue = 0;
      const itemsToSell = [];

      for (const item of sellableItems) {
        const itemInfo = AllItems.find((i) => i.id === item.id);
        if (itemInfo) {
          const value = itemInfo.price.sell * item.quantity;
          totalValue += value;
          itemsToSell.push({
            id: item.id,
            name: itemInfo.name,
            emoji: itemInfo.emoji,
            quantity: item.quantity,
            value: value,
          });
        }
      }

      // Create confirmation embed
      const embed = client
        .embed()
        .setColor(color.warning)
        .setTitle(sellMessages.sellConfirmation || "Sell Confirmation")
        .setDescription(
          sellMessages.sellAll
            .replace("{coinEmoji}", emoji.coin)
            .replace("{price}", client.utils.formatNumber(totalValue))
        )
        .addFields({
          name: sellMessages.sellableItems,
          value: itemsToSell
            .map(
              (item) =>
                `${item.emoji} ${item.quantity}x ${item.name} - ${
                  emoji.coin
                } ${client.utils.formatNumber(item.value)}`
            )
            .join("\n")
            .substring(0, 1024),
        })
        .setFooter({
          text: sellMessages.remainingBalance
            .replace("{coinEmoji}", emoji.coin)
            .replace("{balance}", client.utils.formatNumber(user.balance.coin)),
          iconURL: ctx.author.displayAvatarURL(),
        });

      // Create confirmation buttons
      const confirmButton = new ButtonBuilder()
        .setCustomId("confirm_sell_all")
        .setLabel(sellMessages.confirm)
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅");

      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel_sell_all")
        .setLabel(sellMessages.cancel)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌");

      const actionRow = new ActionRowBuilder().addComponents(
        confirmButton,
        cancelButton
      );

      // Send confirmation message
      const message = await ctx.sendMessage({
        embeds: [embed],
        components: [actionRow],
      });

      // Create collector
      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        time: 60000, // 1 minute timeout
      });

      collector.on("collect", async (interaction) => {
        try {
          if (interaction.customId === "confirm_sell_all") {
            // Process the sale of all items
            let totalSold = 0;

            // Update user's balance
            await Users.updateOne(
              { userId: ctx.author.id },
              { $inc: { "balance.coin": totalValue } }
            );

            // Remove all sold items from inventory
            for (const item of itemsToSell) {
              await Users.updateOne(
                { userId: ctx.author.id },
                {
                  $pull: {
                    inventory: { id: item.id },
                    equip: { id: item.id },
                  },
                }
              );
              totalSold += item.quantity;
            }

            // Get updated user data
            const updatedUser = await Users.findOne({ userId: ctx.author.id });

            // Send success message
            await interaction.update({
              embeds: [
                client
                  .embed()
                  .setColor(color.success)
                  .setDescription(
                    sellMessages.sellAllSuccess
                      .replace("{count}", itemsToSell.length)
                      .replace("{coinEmoji}", emoji.coin)
                      .replace("{price}", client.utils.formatNumber(totalValue))
                  )
                  .setFooter({
                    text: sellMessages.remainingBalance
                      .replace("{coinEmoji}", "")
                      .replace(
                        "{balance}",
                        client.utils.formatNumber(updatedUser.balance.coin)
                      ),
                    iconURL: ctx.author.displayAvatarURL(),
                  }),
              ],
              components: [],
            });
          } else if (interaction.customId === "cancel_sell_all") {
            await interaction.update({
              embeds: [
                client
                  .embed()
                  .setColor(color.danger)
                  .setDescription(sellMessages.sellCancelled),
              ],
              components: [],
            });
          }

          collector.stop();
        } catch (error) {
          console.error("Error in sell all interaction:", error);
          await interaction.update({
            embeds: [
              client
                .embed()
                .setColor(color.danger)
                .setDescription(sellMessages.sellError),
            ],
            components: [],
          });
          collector.stop();
        }
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time") {
          try {
            // Disable all buttons
            const disabledRow = new ActionRowBuilder().addComponents(
              ButtonBuilder.from(confirmButton).setDisabled(true),
              ButtonBuilder.from(cancelButton).setDisabled(true)
            );

            await message.edit({ components: [disabledRow] });
          } catch (error) {
            console.error("Error disabling buttons:", error);
          }
        }
      });

      return message;
    } catch (error) {
      console.error("Error in sellAllItems:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        sellMessages.sellError,
        color
      );
    }
  }

  parseQuantity(input, maxQuantity) {
    if (typeof input === "string") {
      const lowerInput = input.toLowerCase().trim();
      if (lowerInput === "all") return maxQuantity;
      if (lowerInput === "half") return Math.ceil(maxQuantity / 2);

      // Remove commas for number parsing
      const sanitizedInput = lowerInput.replace(/,/g, "");
      const quantity = Number.parseInt(sanitizedInput);

      // Better validation
      if (!isNaN(quantity) && quantity > 0) {
        return Math.min(quantity, maxQuantity);
      }
    } else if (typeof input === "number" && input > 0) {
      return Math.min(input, maxQuantity);
    }

    return null;
  }
};
