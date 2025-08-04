const { Command } = require("../../structures/index.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");

// Create a shop structure for ImportantItems
const ImportantItemsShop = {
  name: "Important Items",
  description:
    "Essential items and tools for your adventure!\n**・** `pbuy {id}` to buy an item",
  type: "important",
  inventory: ImportantItems,
};

const Shops = [...ShopItems, ImportantItemsShop];

module.exports = class ShopInfo extends Command {
  constructor(client) {
    super(client, {
      name: "shopinfo",
      description: {
        content:
          "Get detailed information about shop items or browse all available items.",
        examples: ["shopinfo", "shopinfo axe", "shopinfo t01"],
        usage: "shopinfo [itemId]",
      },
      cooldown: 3,
      category: "inventory",
      aliases: ["shop-info", "iteminfo"],
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "item",
          description: "The ID of the item you want to get information about",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages =
      language.locales.get(language.defaultLocale)?.generalMessages || {};
    const shopInfoMessages =
      language.locales.get(language.defaultLocale)?.inventoryMessages
        ?.shopInfoMessages || {};

    // Ensure we have default values for all messages
    const messages = {
      itemNotFound:
        shopInfoMessages.itemNotFound || "Item with ID `{id}` not found.",
      noItemsAvailable:
        shopInfoMessages.noItemsAvailable || "No items available in the shop.",
      itemDetailsHeader: shopInfoMessages.itemDetailsHeader || "Item Details",
      itemLimit: shopInfoMessages.itemLimit || "Limit",
      itemPrice: shopInfoMessages.itemPrice || "Price",
      itemSellPrice: shopInfoMessages.itemSellPrice || "Sell Price",
      itemDescription: shopInfoMessages.itemDescription || "Description",
      shopItemListHeader:
        shopInfoMessages.shopItemListHeader ||
        "Here is the list of all items sorted by type:",
      itemListFooter:
        shopInfoMessages.itemListFooter ||
        "Use `shopinfo <id>` to get more details about an item.",
      errorLoading:
        shopInfoMessages.errorLoading ||
        "An error occurred while loading shop information.",
      categoryOverview:
        shopInfoMessages.categoryOverview || "Category Overview",
      totalItems: shopInfoMessages.totalItems || "Total Items",
      priceRange: shopInfoMessages.priceRange || "Price Range",
      averagePrice: shopInfoMessages.averagePrice || "Average Price",
      mostExpensive: shopInfoMessages.mostExpensive || "Most Expensive",
      cheapest: shopInfoMessages.cheapest || "Cheapest",
      backToList: shopInfoMessages.backToList || "Back to List",
      viewDetails: shopInfoMessages.viewDetails || "View Details",
      shopOverview: shopInfoMessages.shopOverview || "Shop Overview",
      categories: shopInfoMessages.categories || "Categories",
    };

    // Ensure we have default values for colors
    const safeColors = {
      main: color?.main || "#5865F2",
      error: color?.error || "#ED4245",
      warning: color?.warning || "#FEE75C",
      success: color?.success || "#57F287",
      info: color?.info || "#00D4FF",
    };

    // Get the item ID from args or slash command options
    const itemId = args[0] || ctx.options?.getString("item");

    try {
      if (itemId) {
        // Show specific item information
        return await this.showItemInfo(
          client,
          ctx,
          itemId,
          safeColors,
          emoji,
          messages
        );
      } else {
        // Show shop overview with interactive browsing
        return await this.showShopOverview(
          client,
          ctx,
          safeColors,
          emoji,
          messages
        );
      }
    } catch (error) {
      console.error("Error in ShopInfo command:", error);
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

  async showItemInfo(client, ctx, itemId, color, emoji, messages) {
    // Find the item across all shops
    let foundItem = null;
    let foundShop = null;

    for (const shop of Shops) {
      const item = shop.inventory.find((item) => item.id === itemId);
      if (item) {
        foundItem = item;
        foundShop = shop;
        break;
      }
    }

    if (!foundItem) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.error)
            .setDescription(messages.itemNotFound.replace("{id}", itemId)),
        ],
      });
    }

    // Create detailed item embed
    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle(`${foundItem.emoji || "📦"} ${foundItem.name}`)
      .setDescription(foundItem.description || "No description available.")
      .addFields([
        {
          name: "🆔 ID",
          value: `\`${foundItem.id}\``,
          inline: true,
        },
        {
          name: "🏪 Category",
          value: `${foundShop.name}`,
          inline: true,
        },
        {
          name: "🏷️ Type",
          value: `${client.utils.formatCapitalize(foundItem.type)}`,
          inline: true,
        },
        {
          name: `💰 ${messages.itemPrice}`,
          value: `${client.utils.formatString(foundItem.price.buy)} ${emoji.coin || "💰"}`,
          inline: true,
        },
        {
          name: `💸 ${messages.itemSellPrice}`,
          value:
            foundItem.price.sell > 0
              ? `${client.utils.formatString(foundItem.price.sell)} ${emoji.coin || "💰"}`
              : "Not sellable",
          inline: true,
        },
        {
          name: "📦 Quantity Available",
          value: foundItem.quantity ? `${foundItem.quantity}x` : "Unlimited",
          inline: true,
        },
      ])
      .setThumbnail(
        foundItem.emoji
          ? client.utils.emojiToImage(foundItem.emoji)
          : ctx.author.displayAvatarURL({ dynamic: true, size: 1024 })
      )
      .setFooter({
        text: `Use /buy ${foundItem.id} to purchase this item`,
        iconURL: ctx.author.displayAvatarURL(),
      });

    // Add additional fields if available
    if (foundItem.able) {
      const abilities = [];
      if (foundItem.able.use) abilities.push("Usable");
      if (foundItem.able.gift) abilities.push("Giftable");
      if (foundItem.able.multiple) abilities.push("Stackable");

      if (abilities.length > 0) {
        embed.addFields([
          {
            name: "✨ Abilities",
            value: abilities.join(", "),
            inline: false,
          },
        ]);
      }
    }

    if (foundItem.rarity) {
      embed.addFields([
        {
          name: "💎 Rarity",
          value: client.utils.formatCapitalize(foundItem.rarity),
          inline: true,
        },
      ]);
    }

    // Add image if available
    if (foundItem.image) {
      embed.setImage(foundItem.image);
    }

    return await ctx.sendMessage({
      embeds: [embed],
    });
  }

  async showShopOverview(client, ctx, color, emoji, messages) {
    const currentState = {
      viewMode: "overview", // "overview", "category", "item"
      selectedCategory: null,
      selectedItemId: null,
      currentPage: 0,
      itemsPerPage: 10,
    };

    // Get shop statistics
    const totalItems = Shops.reduce(
      (total, shop) => total + shop.inventory.length,
      0
    );
    const allItems = Shops.flatMap((shop) => shop.inventory);
    const prices = allItems
      .map((item) => item.price.buy)
      .filter((price) => price > 0);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(
      prices.reduce((sum, price) => sum + price, 0) / prices.length
    );

    const mostExpensiveItem = allItems.find(
      (item) => item.price.buy === maxPrice
    );
    const cheapestItem = allItems.find((item) => item.price.buy === minPrice);

    // Function to generate overview embed
    const generateOverviewEmbed = () => {
      const shopList = Shops.map((shop, index) => {
        const itemCount = shop.inventory.length;
        const shopPrices = shop.inventory
          .map((item) => item.price.buy)
          .filter((price) => price > 0);
        const avgShopPrice =
          shopPrices.length > 0
            ? Math.round(
                shopPrices.reduce((sum, price) => sum + price, 0) /
                  shopPrices.length
              )
            : 0;

        return `**${index + 1}.** ${shop.name} - ${itemCount} items`;
      }).join("\n");

      const embed = client
        .embed()
        .setColor(color.info)
        .setTitle(`${emoji.shop || "🛍️"} ${messages.shopOverview}`)
        .setDescription(
          `Welcome to the shop information center! Here you can browse all available items and categories.`
        )
        .addFields([
          {
            name: `📊 Shop Statistics`,
            value: `**${messages.totalItems}:** ${totalItems}\n**${messages.categories}:** ${Shops.length}\n**${messages.priceRange}:** ${client.utils.formatString(minPrice)} - ${client.utils.formatString(maxPrice)} ${emoji.coin || "💰"}\n**${messages.averagePrice}:** ${client.utils.formatString(avgPrice)} ${emoji.coin || "💰"}`,
            inline: false,
          },
          {
            name: `🏪 ${messages.categories}`,
            value: shopList,
            inline: false,
          },
          {
            name: `💎 ${messages.mostExpensive}`,
            value: `${mostExpensiveItem.emoji || "📦"} **${mostExpensiveItem.name}** - ${client.utils.formatString(maxPrice)} ${emoji.coin || "💰"}`,
            inline: true,
          },
          {
            name: `💰 ${messages.cheapest}`,
            value: `${cheapestItem.emoji || "📦"} **${cheapestItem.name}** - ${client.utils.formatString(minPrice)} ${emoji.coin || "💰"}`,
            inline: true,
          },
        ])
        .setFooter({
          text: "Select a category below to browse items",
          iconURL: ctx.author.displayAvatarURL(),
        });

      return embed;
    };

    // Function to generate category embed
    const generateCategoryEmbed = () => {
      const shop = Shops.find(
        (shop) => shop.type === currentState.selectedCategory
      );
      if (!shop) return generateOverviewEmbed();

      const items = shop.inventory;
      const totalPages = Math.ceil(items.length / currentState.itemsPerPage);
      const startIndex = currentState.currentPage * currentState.itemsPerPage;
      const endIndex = Math.min(
        startIndex + currentState.itemsPerPage,
        items.length
      );
      const currentItems = items.slice(startIndex, endIndex);

      const itemList = currentItems
        .map((item, index) => {
          const price = client.utils.formatString(item.price.buy);
          const globalIndex = startIndex + index + 1;
          return `**${globalIndex}.** \`${item.id}\` ${item.emoji || "📦"} **${item.name}** - ${price} ${emoji.coin || "💰"}`;
        })
        .join("\n");

      const categoryPrices = items
        .map((item) => item.price.buy)
        .filter((price) => price > 0);
      const minCatPrice = Math.min(...categoryPrices);
      const maxCatPrice = Math.max(...categoryPrices);
      const avgCatPrice = Math.round(
        categoryPrices.reduce((sum, price) => sum + price, 0) /
          categoryPrices.length
      );

      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji.shop || "🛍️"} ${shop.name}`)
        .setDescription(`${shop.description}\n\n${itemList}`)
        .addFields([
          {
            name: `📊 ${messages.categoryOverview}`,
            value: `**${messages.totalItems}:** ${items.length}\n**${messages.priceRange}:** ${client.utils.formatString(minCatPrice)} - ${client.utils.formatString(maxCatPrice)} ${emoji.coin || "💰"}\n**${messages.averagePrice}:** ${client.utils.formatString(avgCatPrice)} ${emoji.coin || "💰"}`,
            inline: false,
          },
        ])
        .setFooter({
          text: `Page ${currentState.currentPage + 1} of ${totalPages} • Select an item below for detailed information`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return embed;
    };

    // Function to generate category dropdown
    const generateCategoryDropdown = () => {
      const categoryOptions = Shops.map((shop) => ({
        label: shop.name,
        value: shop.type,
        description: `${shop.inventory.length} items available`,
        emoji: shop.inventory[0]?.emoji?.includes(":")
          ? undefined
          : shop.inventory[0]?.emoji?.substring(0, 2),
        default: shop.type === currentState.selectedCategory,
      }));

      const dropdown = new StringSelectMenuBuilder()
        .setCustomId("category_select")
        .setPlaceholder("Select a category to browse")
        .addOptions(categoryOptions);

      return new ActionRowBuilder().addComponents(dropdown);
    };

    // Function to generate item dropdown for category view
    const generateItemDropdown = () => {
      if (!currentState.selectedCategory) return null;

      const shop = Shops.find(
        (shop) => shop.type === currentState.selectedCategory
      );
      if (!shop) return null;

      const startIndex = currentState.currentPage * currentState.itemsPerPage;
      const endIndex = Math.min(
        startIndex + currentState.itemsPerPage,
        shop.inventory.length
      );
      const currentItems = shop.inventory.slice(startIndex, endIndex);

      const itemOptions = currentItems.map((item) => ({
        label:
          item.name.length > 100
            ? item.name.substring(0, 97) + "..."
            : item.name,
        value: item.id,
        description:
          `${client.utils.formatString(item.price.buy)} ${emoji.coin || "💰"}`.replace(
            /<[^>]*>/g,
            ""
          ),
        emoji: item.emoji?.includes(":") ? undefined : item.emoji,
        default: item.id === currentState.selectedItemId,
      }));

      if (itemOptions.length === 0) return null;

      const dropdown = new StringSelectMenuBuilder()
        .setCustomId("item_select")
        .setPlaceholder("Select an item for details")
        .addOptions(itemOptions);

      return new ActionRowBuilder().addComponents(dropdown);
    };

    // Function to generate navigation buttons
    const generateNavigationButtons = () => {
      const buttons = [];

      if (currentState.viewMode === "category") {
        const shop = Shops.find(
          (shop) => shop.type === currentState.selectedCategory
        );

        if (shop) {
          const totalPages = Math.ceil(
            shop.inventory.length / currentState.itemsPerPage
          );

          // Previous page button
          if (currentState.currentPage > 0) {
            const prevButton = new ButtonBuilder()
              .setCustomId("prev_page")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⬅️");
            buttons.push(prevButton);
          }

          // Page info button (disabled, shows current page)
          if (totalPages > 1) {
            const pageInfoButton = new ButtonBuilder()
              .setCustomId("page_info")
              .setLabel(`${currentState.currentPage + 1}/${totalPages}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true);
            buttons.push(pageInfoButton);
          }

          // Next page button
          if (currentState.currentPage < totalPages - 1) {
            const nextButton = new ButtonBuilder()
              .setCustomId("next_page")
              .setLabel("Next")
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");
            buttons.push(nextButton);
          }
        }

        // Back to overview button
        const backButton = new ButtonBuilder()
          .setCustomId("back_to_overview")
          .setLabel(messages.backToList || "Back to Overview")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔙");
        buttons.push(backButton);
      }

      if (currentState.selectedItemId) {
        const detailsButton = new ButtonBuilder()
          .setCustomId("view_item_details")
          .setLabel(messages.viewDetails || "View Full Details")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🔍");
        buttons.push(detailsButton);
      }

      return buttons.length > 0
        ? new ActionRowBuilder().addComponents(buttons)
        : null;
    };

    // Function to update message
    const updateMessage = async (interaction = null) => {
      try {
        const components = [];

        // Generate appropriate embed
        let embed;
        if (currentState.viewMode === "overview") {
          embed = generateOverviewEmbed();
          components.push(generateCategoryDropdown());
        } else if (currentState.viewMode === "category") {
          embed = generateCategoryEmbed();
          const itemDropdown = generateItemDropdown();
          if (itemDropdown) components.push(itemDropdown);

          const navButtons = generateNavigationButtons();
          if (navButtons) components.push(navButtons);
        }

        const messageOptions = {
          embeds: [embed],
          components: components,
        };

        if (interaction) {
          await interaction.update(messageOptions);
        } else {
          return messageOptions;
        }
      } catch (error) {
        console.error("Error in updateMessage:", error);
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
        switch (interaction.customId) {
          case "category_select":
            currentState.selectedCategory = interaction.values[0];
            currentState.viewMode = "category";
            currentState.selectedItemId = null;
            currentState.currentPage = 0; // Reset to first page when switching categories
            break;

          case "item_select":
            currentState.selectedItemId = interaction.values[0];
            break;

          case "back_to_overview":
            currentState.viewMode = "overview";
            currentState.selectedCategory = null;
            currentState.selectedItemId = null;
            currentState.currentPage = 0;
            break;

          case "prev_page":
            if (currentState.currentPage > 0) {
              currentState.currentPage--;
              currentState.selectedItemId = null; // Clear selected item when changing pages
            }
            break;

          case "next_page":
            const shop = Shops.find(
              (shop) => shop.type === currentState.selectedCategory
            );
            if (shop) {
              const totalPages = Math.ceil(
                shop.inventory.length / currentState.itemsPerPage
              );
              if (currentState.currentPage < totalPages - 1) {
                currentState.currentPage++;
                currentState.selectedItemId = null; // Clear selected item when changing pages
              }
            }
            break;

          case "view_item_details":
            if (currentState.selectedItemId) {
              // Defer the interaction first to avoid timeout
              await interaction.deferReply({ flags: 64 });

              // Show detailed item information in a new message
              await this.showItemInfo(
                client,
                {
                  ...ctx,
                  sendMessage: (options) =>
                    interaction.editReply({ ...options }),
                },
                currentState.selectedItemId,
                color,
                emoji,
                messages
              );
              return; // Don't update the main message
            }
            break;
        }

        await updateMessage(interaction);
      } catch (error) {
        console.error("Error in collector:", error);
      }
    });

    collector.on("end", async () => {
      try {
        const disabledComponents = msg.components.map((row) => {
          const newRow = new ActionRowBuilder();
          row.components.forEach((component) => {
            if (component.type === 3) {
              // Select menu
              newRow.addComponents(
                StringSelectMenuBuilder.from(component).setDisabled(true)
              );
            } else if (component.type === 2) {
              // Button
              newRow.addComponents(
                ButtonBuilder.from(component).setDisabled(true)
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
