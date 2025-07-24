const { Command } = require("../../structures/index.js");
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Users = require("../../schemas/user");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const Shops = [...ShopItems];

module.exports = class Shop extends Command {
  constructor(client) {
    super(client, {
      name: "shop",
      description: {
        content: "View which items you can buy.",
        examples: ["shop"],
        usage: "shop",
      },
      cooldown: 5,
      category: "inventory",
      aliases: ["store"],
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

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages =
      language.locales.get(language.defaultLocale)?.generalMessages || {};
    const shopMessages =
      language.locales.get(language.defaultLocale)?.inventoryMessages
        ?.shopMessages || {};

    // Ensure we have default values for all messages
    const messages = {
      itemDetails: shopMessages.itemDetails || "Item Details",
      buyCommand:
        shopMessages.buyCommand || "Use `/buy [item] [amount]` to purchase",
      outOfStock: shopMessages.outOfStock || "Out of Stock",
      price: shopMessages.price || "Price",
      description: shopMessages.description || "Description",
      type: shopMessages.type || "Type",
      id: shopMessages.id || "ID",
      shopTitle: shopMessages.shopTitle || "SHOP",
      errorLoading:
        shopMessages.errorLoading ||
        "An error occurred while loading the shop.",
      categoryNotFound:
        shopMessages.categoryNotFound || "Shop category not found.",
      purchaseSuccess:
        shopMessages.purchaseSuccess ||
        "You have successfully purchased %{quantity}x %{item} for %{price} coins!",
      purchaseFailed:
        shopMessages.purchaseFailed || "Purchase failed: %{reason}",
      insufficientFunds:
        shopMessages.insufficientFunds ||
        "You don't have enough coins to buy this item.",
      invalidQuantity:
        shopMessages.invalidQuantity || "Please enter a valid quantity.",
      confirmPurchase:
        shopMessages.confirmPurchase ||
        "Are you sure you want to buy %{quantity}x %{item} for %{price} coins?",
      buyItem: shopMessages.buyItem || "Buy Item",
      buyMultiple: shopMessages.buyMultiple || "Buy Multiple",
      cancel: shopMessages.cancel || "Cancel",
      enterQuantity: shopMessages.enterQuantity || "Enter quantity",
      maxQuantity: shopMessages.maxQuantity || "Max: %{max}",
      confirm: shopMessages.confirm || "Confirm",
      back: shopMessages.back || "Back",
    };

    // Ensure we have default values for colors
    const safeColors = {
      main: color?.main || "#5865F2",
      error: color?.error || "#ED4245",
      warning: color?.warning || "#FEE75C",
      success: color?.success || "#57F287",
      danger: color?.danger || "#ED4245",
    };

    // Get all unique categories
    const categories = Shops.map((shop) => shop.type);
    const categorySet = new Set(categories);
    const uniqueCategories = [...categorySet];

    try {
      if (categorySet.size !== categories.length) {
        console.error("Duplicate category values found:", categories);
      }

      // Get initial category (from args or default to first)
      let selectedCategory = args[0] || uniqueCategories[0];
      let selectedShop = Shops.find((shop) => shop.type === selectedCategory);

      if (!selectedShop) {
        console.error(`No shop found for category: ${selectedCategory}`);
        selectedCategory = uniqueCategories[0];
        selectedShop = Shops.find((shop) => shop.type === selectedCategory);

        if (!selectedShop) {
          return await ctx.sendMessage({
            embeds: [
              client
                .embed()
                .setColor(safeColors.error)
                .setDescription(messages.categoryNotFound),
            ],
          });
        }
      }

      return await this.showShop(
        client,
        ctx,
        safeColors,
        emoji || {},
        uniqueCategories,
        selectedCategory,
        generalMessages,
        messages,
      );
    } catch (error) {
      console.error("Error in Shop command:", error);
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(safeColors.error)
            .setDescription(messages.errorLoading),
        ],
      });
    }
  }

  async showShop(
    client,
    ctx,
    color,
    emoji,
    categories,
    initialCategory,
    generalMessages,
    messages,
  ) {
    const currentState = {
      category: initialCategory,
      page: 0,
      selectedItemId: null,
      viewMode: "list", // "list" or "details"
      purchaseMode: false, // Whether in purchase confirmation mode
      purchaseQuantity: 1, // Quantity to purchase
      needsUpdate: false, // Flag to indicate if we need to update the message after a purchase
      filter: "all",
    };

    // Items per page in list view
    const ITEMS_PER_PAGE = 8;

    // Function to get the current shop and items
    const getCurrentShop = () => {
      return Shops.find((shop) => shop.type === currentState.category);
    };

    // Function to get all items in the current shop
    const getCurrentItems = () => {
      const shop = getCurrentShop();
      if (!shop) return [];

      let items = shop.inventory;

      // Apply filter if not "all"
      if (currentState.filter && currentState.filter !== "all") {
        items = items.filter((item) => {
          if (currentState.filter === "tool") {
            return item.type.includes("tool");
          } else if (currentState.filter === "consumable") {
            return item.type === "food" || item.type === "drink";
          } else if (currentState.filter === "decorative") {
            return item.type === "wallpaper" || item.type === "color";
          } else if (currentState.filter === "rare") {
            return item.rarity === "rare" || item.rarity === "legendary";
          }
          return true;
        });
      }

      return items;
    };

    // Function to get total pages for current shop
    const getTotalPages = () => {
      const items = getCurrentItems();
      return Math.ceil(items.length / ITEMS_PER_PAGE) ?? 1;
    };

    // Function to get items for current page
    const getCurrentPageItems = () => {
      const items = getCurrentItems();
      const startIndex = currentState.page * ITEMS_PER_PAGE;
      return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    // Function to get selected item
    const getSelectedItem = () => {
      if (!currentState.selectedItemId) return null;
      return getCurrentItems().find(
        (item) => item.id === currentState.selectedItemId,
      );
    };

    // Function to generate shop list embed
    const generateShopListEmbed = () => {
      const shop = getCurrentShop();
      const items = getCurrentPageItems();
      const totalPages = getTotalPages();

      // Create a more visually appealing item list
      const itemList = items
        .map((item, index) => {
          const price = client.utils.formatString(item.price.buy);
          // Add some visual distinction based on item price/rarity
          const priceDisplay =
            item.price.buy > 10000
              ? `**${price}** ${emoji.coin || "💰"}`
              : `${price} ${emoji.coin || "💰"}`;

          return `\`${item.id}\` ${item.emoji} **${item.name}** - ${priceDisplay}`;
        })
        .join("\n");

      // Create a more attractive embed
      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle(
          `${emoji.mainLeft || "🛒"} ${
            messages.shopTitle
          }: ${shop.name.toUpperCase()} ${emoji.mainRight || "🛒"}`,
        )
        .setDescription(`${shop.description}\n\n${itemList}`)
        .setThumbnail(client.utils.emojiToImage(emoji.shop || "🛍️"))
        .setFooter({
          text: `Page ${
            currentState.page + 1
          }/${totalPages} • Select an item to view details and purchase`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return embed;
    };

    // Function to generate item details embed
    const generateItemDetailsEmbed = () => {
      const item = getSelectedItem();
      if (!item) return generateShopListEmbed();

      // Create a more detailed and attractive item embed
      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${item.emoji} ${item.name}`)
        .setThumbnail(
          item.emoji
            ? client.utils.emojiToImage(item.emoji)
            : ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }),
        )
        .addFields([
          {
            name: `${messages.id}`,
            value: `\`${item.id}\``,
            inline: true,
          },
          {
            name: `${messages.price}`,
            value: `${client.utils.formatString(item.price.buy)} ${
              emoji.coin || "💰"
            }`,
            inline: true,
          },
          {
            name: `${messages.type}`,
            value: `${client.utils.formatCapitalize(item.type)}`,
            inline: true,
          },
          {
            name: `${messages.description}`,
            value: item.description || "No description available.",
          },
        ])
        .setImage(item.image || null)
        .setFooter({
          text: "Use the buttons below to purchase this item",
          iconURL: ctx.author.displayAvatarURL(),
        });

      return embed;
    };

    // Function to generate purchase confirmation embed
    const generatePurchaseConfirmEmbed = () => {
      const item = getSelectedItem();
      if (!item) return generateShopListEmbed();

      const quantity = currentState.purchaseQuantity;
      const totalPrice = item.price.buy * quantity;

      const embed = client
        .embed()
        .setColor(color.warning)
        .setTitle(`Confirm Purchase: ${item.name}`)
        .setDescription(
          messages.confirmPurchase
            .replace("%{quantity}", quantity.toString())
            .replace("%{item}", item.name)
            .replace("%{price}", client.utils.formatString(totalPrice)),
        )
        .addFields([
          {
            name: "Item",
            value: `${item.emoji} ${item.name}`,
            inline: true,
          },
          {
            name: "Quantity",
            value: `${quantity}x`,
            inline: true,
          },
          {
            name: "Total Price",
            value: `${client.utils.formatString(totalPrice)} ${
              emoji.coin || "💰"
            }`,
            inline: true,
          },
        ])
        .setThumbnail(client.utils.emojiToImage(item.emoji))
        .setFooter({
          text: "Click Confirm to complete your purchase or Cancel to go back",
          iconURL: ctx.author.displayAvatarURL(),
        });

      return embed;
    };

    // Function to generate category dropdown
    const generateCategoryDropdown = () => {
      const categoryOptions = categories.map((category) => {
        const shop = Shops.find((shop) => shop.type === category);
        return {
          label: shop.name,
          value: category,
          description: `${shop.inventory.length} items`,
          default: category === currentState.category,
        };
      });

      const dropdown = new StringSelectMenuBuilder()
        .setCustomId("category_select")
        .setPlaceholder("Select a category")
        .addOptions(categoryOptions);

      return new ActionRowBuilder().addComponents(dropdown);
    };

    // Function to generate item dropdown
    const generateItemDropdown = () => {
      const items = getCurrentItems();

      // Limit options to 25 (Discord's limit)
      const itemOptions = items.slice(0, 25).map((item) => {
        const emojiStr =
          typeof emoji.coin === "string"
            ? emoji.coin.replace(/<a?:\w+:(\d+)>/, "")
            : "💰";
        return {
          label: item.name,
          value: item.id,
          description: `${client.utils.formatString(
            item.price.buy,
          )} ${emojiStr}`,
          emoji:
            item.emoji && item.emoji.includes(":") ? undefined : item.emoji, // Only use Unicode emojis in dropdown
          default: item.id === currentState.selectedItemId,
        };
      });

      const dropdown = new StringSelectMenuBuilder()
        .setCustomId("item_select")
        .setPlaceholder("Select an item for details")
        .addOptions(itemOptions);

      return new ActionRowBuilder().addComponents(dropdown);
    };

    // Function to generate navigation buttons
    const generateNavigationButtons = () => {
      const totalPages = getTotalPages();

      // Create navigation buttons
      const prevButton = new ButtonBuilder()
        .setCustomId("prev_page")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
        .setDisabled(currentState.page === 0);

      const nextButton = new ButtonBuilder()
        .setCustomId("next_page")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️")
        .setDisabled(currentState.page >= totalPages - 1);

      const homeButton = new ButtonBuilder()
        .setCustomId("home")
        .setLabel("Home")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🏠");

      // Return different button rows based on view mode
      if (currentState.viewMode === "details") {
        // In details view, we use a different back button
        const backButton = new ButtonBuilder()
          .setCustomId("details_back")
          .setLabel(messages.back || "Back")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("↩️");

        return new ActionRowBuilder().addComponents(backButton);
      } else {
        // Only show pagination if there are multiple pages
        if (totalPages > 1) {
          return new ActionRowBuilder().addComponents(
            homeButton,
            prevButton,
            nextButton,
          );
        } else {
          return new ActionRowBuilder().addComponents(homeButton);
        }
      }
    };

    // Function to generate purchase buttons for item details view
    const generatePurchaseButtons = () => {
      const item = getSelectedItem();
      if (!item) return null;

      // Buy 1 button
      const buyButton = new ButtonBuilder()
        .setCustomId("buy_item")
        .setLabel(messages.buyItem || "Buy Item")
        .setStyle(ButtonStyle.Success)
        .setEmoji("💰");

      return new ActionRowBuilder().addComponents(buyButton);
    };

    // Function to generate purchase confirmation buttons
    const generatePurchaseConfirmButtons = () => {
      // Confirm button
      const confirmButton = new ButtonBuilder()
        .setCustomId("confirm_purchase")
        .setLabel(messages.confirm || "Confirm")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅");

      // Cancel button
      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel_purchase")
        .setLabel(messages.cancel || "Cancel")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌");

      // Quantity adjustment buttons
      const decreaseButton = new ButtonBuilder()
        .setCustomId("decrease_quantity")
        .setLabel("-")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentState.purchaseQuantity <= 1);

      const increaseButton = new ButtonBuilder()
        .setCustomId("increase_quantity")
        .setLabel("+")
        .setStyle(ButtonStyle.Secondary);

      const quantityButton = new ButtonBuilder()
        .setCustomId("quantity_indicator")
        .setLabel(`Quantity: ${currentState.purchaseQuantity}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const row1 = new ActionRowBuilder().addComponents(
        decreaseButton,
        quantityButton,
        increaseButton,
      );
      const row2 = new ActionRowBuilder().addComponents(
        confirmButton,
        cancelButton,
      );

      return [row1, row2];
    };

    // Function to update message with current state
    const updateMessage = async (
      interaction = null,
      skipInteractionUpdate = false,
    ) => {
      try {
        const components = [];

        // Generate appropriate components based on current state
        if (currentState.purchaseMode) {
          // Purchase confirmation view
          components.push(...generatePurchaseConfirmButtons());
        } else if (currentState.viewMode === "details") {
          // Item details view with purchase buttons
          const purchaseButtons = generatePurchaseButtons();
          if (purchaseButtons) {
            components.push(purchaseButtons);
          }

          // Only add navigation buttons if we have purchase buttons
          if (components.length > 0) {
            components.push(generateNavigationButtons());
          }
        } else {
          // List view
          components.push(generateCategoryDropdown());

          const items = getCurrentItems();
          if (items && items.length > 0) {
            components.push(generateItemDropdown());
          }

          components.push(generateNavigationButtons());
        }

        // Generate the appropriate embed
        let embed;
        if (currentState.purchaseMode) {
          embed = generatePurchaseConfirmEmbed();
        } else if (currentState.viewMode === "details") {
          embed = generateItemDetailsEmbed();
        } else {
          embed = generateShopListEmbed();
        }

        const messageOptions = {
          embeds: [embed],
          components: components,
        };

        // Update message based on context
        if (interaction && !skipInteractionUpdate) {
          await interaction.update(messageOptions);
        } else if (currentState.needsUpdate) {
          // If we need to update the message but can't use the interaction
          await msg.edit(messageOptions);
          currentState.needsUpdate = false;
        } else if (!interaction) {
          return messageOptions;
        }
      } catch (error) {
        console.error("Error in updateMessage:", error);
        // If we can't update the interaction, try to edit the message directly
        if (currentState.needsUpdate) {
          try {
            const errorEmbed = client
              .embed()
              .setColor(color.error)
              .setTitle("Error")
              .setDescription(
                "An error occurred while updating the shop display. Please try again.",
              );

            await msg.edit({ embeds: [errorEmbed], components: [] });
            currentState.needsUpdate = false;
          } catch (editError) {
            console.error("Error editing message:", editError);
          }
        }
      }
    };

    // Function to handle item purchase
    const handlePurchase = async (interaction) => {
      try {
        const item = getSelectedItem();
        if (!item) {
          await interaction.reply({
            content: "Item not found.",
            flags: 64,
          });
          return false;
        }

        const quantity = currentState.purchaseQuantity;
        const totalPrice = item.price.buy * quantity;

        // Get user data
        const user = await client.utils.getUser(ctx.author.id);
        if (!user) {
          await interaction.reply({
            content: "User data not found.",
            flags: 64,
          });
          return false;
        }

        // Check if user has enough coins
        if (user.balance.coin < totalPrice) {
          await interaction.reply({
            content:
              messages.insufficientFunds ||
              "You don't have enough coins to buy this item.",
            flags: 64,
          });
          return false;
        }

        // Update user's balance and inventory
        const existingItem = user.inventory.find(
          (invItem) => invItem.id === item.id,
        );

        if (existingItem) {
          // Update existing item quantity
          await Users.updateOne(
            { userId: ctx.author.id, "inventory.id": item.id },
            {
              $inc: {
                "balance.coin": -totalPrice,
                "inventory.$.quantity": quantity,
              },
            },
          );
        } else {
          // Add new item to inventory
          await Users.updateOne(
            { userId: ctx.author.id },
            {
              $inc: { "balance.coin": -totalPrice },
              $push: {
                inventory: {
                  id: item.id,
                  quantity: quantity,
                },
              },
            },
          );
        }

        // Send success message
        const successMessage = (
          messages.purchaseSuccess ||
          "You have successfully purchased %{quantity}x %{item} for %{price} coins!"
        )
          .replace("%{quantity}", quantity.toString())
          .replace("%{item}", item.name)
          .replace("%{price}", client.utils.formatString(totalPrice));

        await interaction.reply({
          content: successMessage,
          flags: 64,
        });

        // Set flag to update the message after purchase
        currentState.needsUpdate = true;
        currentState.purchaseMode = false;

        return true;
      } catch (error) {
        console.error("Error processing purchase:", error);
        const errorMessage = (
          messages.purchaseFailed || "Purchase failed: %{reason}"
        ).replace("%{reason}", "An unexpected error occurred.");

        await interaction.reply({
          content: errorMessage,
          flags: 64,
        });
        return false;
      }
    };

    // Send initial message
    const initialOptions = await updateMessage();
    const msg = ctx.isInteraction
      ? await ctx.interaction.reply({ ...initialOptions, fetchReply: true })
      : await ctx.channel.send({ ...initialOptions, fetchReply: true });

    // Create collector for interactions
    const collector = msg.createMessageComponentCollector({
      filter: (int) => int.user.id === ctx.author.id,
      time: 300000, // 5 minutes
    });

    collector.on("collect", async (interaction) => {
      try {
        let skipUpdate = false;

        // Handle different interaction types
        switch (interaction.customId) {
          case "home":
            // Reset to first page of current category
            currentState.page = 0;
            currentState.selectedItemId = null;
            currentState.viewMode = "list";
            currentState.purchaseMode = false;
            break;

          case "prev_page":
            // Go to previous page
            if (currentState.page > 0) {
              currentState.page--;
            }
            break;

          case "next_page":
            // Go to next page
            const totalPages = getTotalPages();
            if (currentState.page < totalPages - 1) {
              currentState.page++;
            }
            break;

          case "purchase_back":
          case "details_back":
            // Return to list view
            currentState.viewMode = "list";
            currentState.purchaseMode = false;
            break;

          case "category_select":
            // Change category
            currentState.category = interaction.values[0];
            currentState.page = 0;
            currentState.selectedItemId = null;
            currentState.viewMode = "list";
            currentState.purchaseMode = false;
            break;

          case "item_select":
            // View item details
            currentState.selectedItemId = interaction.values[0];
            currentState.viewMode = "details";
            currentState.purchaseMode = false;
            break;

          case "buy_item":
            // Buy a single item
            currentState.purchaseQuantity = 1;
            currentState.purchaseMode = true;
            break;

          case "buy_multiple":
            // Buy multiple items
            currentState.purchaseQuantity = 1;
            currentState.purchaseMode = true;
            break;

          case "increase_quantity":
            // Increase purchase quantity
            currentState.purchaseQuantity++;
            break;

          case "decrease_quantity":
            // Decrease purchase quantity
            if (currentState.purchaseQuantity > 1) {
              currentState.purchaseQuantity--;
            }
            break;

          case "confirm_purchase":
            // Process the purchase
            skipUpdate = true; // Skip the automatic update since we'll handle it after purchase
            const success = await handlePurchase(interaction);
            if (success) {
              // The message will be updated separately after the purchase
              // We've set currentState.needsUpdate = true in handlePurchase
            }
            break;

          case "cancel_purchase":
            // Cancel purchase and return to item details
            currentState.purchaseMode = false;
            break;

          case "filter_select":
            currentState.filter = interaction.values[0];
            currentState.page = 0;
            break;
        }

        // Update the message with new state
        if (!skipUpdate) {
          await updateMessage(interaction);
        } else if (currentState.needsUpdate) {
          // If we need to update but can't use the interaction, do it in the next tick
          setTimeout(async () => {
            await updateMessage(null, true);
          }, 100);
        }
      } catch (error) {
        console.error("Error in collector:", error);
        // If we can't update the interaction, try to edit the message directly
        if (!currentState.needsUpdate) {
          currentState.needsUpdate = true;
          setTimeout(async () => {
            try {
              const errorEmbed = client
                .embed()
                .setColor(color.error)
                .setDescription("An error occurred during interaction.");

              await msg.edit({ embeds: [errorEmbed], components: [] });
              currentState.needsUpdate = false;
            } catch (editError) {
              console.error("Error editing message:", editError);
            }
          }, 100);
        }
      }
    });

    collector.on("end", async () => {
      // Disable all components when collector ends
      try {
        const disabledComponents = msg.components.map((row) => {
          const newRow = new ActionRowBuilder();
          row.components.forEach((component) => {
            if (component.type === 3) {
              // Select menu
              newRow.addComponents(
                StringSelectMenuBuilder.from(component).setDisabled(true),
              );
            } else if (component.type === 2) {
              // Button
              newRow.addComponents(
                ButtonBuilder.from(component).setDisabled(true),
              );
            }
          });
          return newRow;
        });

        await msg.edit({ components: disabledComponents });
      } catch (error) {
        console.error("Error disabling components:", error);
      }
    });

    return msg;
  }
};
