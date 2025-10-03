const { Command } = require("../../structures/index.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const Woods = require("../../assets/inventory/Woods");
const Minerals = require("../../assets/inventory/Minerals");
const SlimeCategory = require("../../assets/inventory/SlimeCatalog");
const Tools = require("../../assets/inventory/SlimeTools");
const Inventory = ShopItems.flatMap((shop) => shop.inventory);
const Items = Inventory.filter((value) => value.price.buy !== 0).sort(
  (a, b) => a.price.buy - b.price.buy,
);

module.exports = class Inventory extends Command {
  constructor(client) {
    super(client, {
      name: "inventory",
      description: {
        content: "Shows your inventory.",
        examples: ["inventory"],
        usage: "inventory",
      },
      category: "inventory",
      aliases: ["inv"],
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

  async run(client, ctx, args, color, emoji, language) {
    const invMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.invMessages;

    try {
      const user = await client.utils.getUser(ctx.author.id);

      if (!user || !user.inventory) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          invMessages.noInventory || "No inventory data found for this user.",
          color,
        );
      }

      // Define category icons/emojis for better visual distinction
      // Include "resources" category
      const categoryIcons = {
        drink: "🥤",
        cake: "🎂",
        couple: "💑",
        ring: "💍",
        color: "🎨",
        theme: "🎭",
        specialtheme: "✨",
        wallpaper: "🖼️",
        card: "💳",
        resources: "⛏️",
      };

      // Pagination settings
      const ITEMS_PER_PAGE = 10;
      const currentView = {
        category: "all", // Current category being viewed (all = overview)
        page: 1, // Current page number
      };

      const itemList = {};
      let totalWorth = 0;
      let totalItems = 0;

      // Process inventory items
      // Map woods, minerals, slime, tools to "resources"
      user.inventory.forEach((item) => {
        if (item.quantity > 0) {
          const itemInfo = Items.concat(
            ImportantItems,
            Woods,
            Minerals,
            SlimeCategory,
            Tools,
          ).find(({ id }) => id.toLowerCase() === item.id.toLowerCase());

          if (itemInfo) {
            // Map specific types to "resources"
            let type = itemInfo.type;
            if (["woods", "minerals", "slime", "tools"].includes(type)) {
              type = "resources";
            }
            itemList[type] = itemList[type] || [];

            // Format item name
            const itemName = itemInfo.name
              ? itemInfo.name
              : client.utils.formatCapitalize(itemInfo.id);

            // Calculate item worth
            const itemWorth = (itemInfo.price?.sell || 0) * item.quantity;

            // Create item object
            const itemObj = {
              id: itemInfo.id,
              emoji: itemInfo.emoji || "📦",
              quantity: item.quantity,
              name: itemName,
              rarity: itemInfo.rarity || "common",
              worth: itemWorth,
              type: type,
              display: `\`${itemInfo.id}\` ${
                itemInfo.emoji || "📦"
              } ${itemName} **x${item.quantity}**`,
            };

            // Add to category list
            itemList[type].push(itemObj);

            // Update totals
            if (itemInfo.price?.sell) {
              totalWorth += itemWorth;
            }
            totalItems += item.quantity;
          }
        }
      });

      // Calculate total pages for each category
      const categoryPages = {};
      // Include "resources" instead of individual categories
      const inventoryTypes = [
        "card",
        "milk",
        "couple",
        "ring",
        "color",
        "theme",
        "special theme",
        "wallpaper",
        "resources",
      ];

      inventoryTypes.forEach((type) => {
        const items = itemList[type] || [];
        categoryPages[type] = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
      });

      // Function to generate the overview embed (main inventory view)
      const generateOverviewEmbed = () => {
        const fields = [];

        // Process each inventory type
        inventoryTypes.forEach((type) => {
          const items = itemList[type];
          if (items && items.length > 0) {
            // For overview, show the first few items of each category
            const previewItems = items.slice(0, 3);
            const hasMore = items.length > 3;

            fields.push({
              name: `${
                categoryIcons[type] || ""
              } ${client.utils.formatCapitalize(type)}`,
              value: `${previewItems.map((item) => item.display).join("\n")}${
                hasMore ? `\n... and ${items.length - 3} more items` : ""
              }`,
              inline: false,
            });
          }
        });

        // Create inventory summary
        const inventorySummary = [
          `📦 **Total Items:** \`${totalItems}\``,
          `🗃️ **Categories:** \`${Object.keys(itemList).length}\``,
        ].join("\n");

        // Create embed
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            `# ${emoji.mainLeft} ${
              invMessages.inventoryTitle || "INVENTORY"
            } ${emoji.mainRight}\n\n${inventorySummary}`,
          )
          .setThumbnail(
            client.utils.emojiToImage(emoji.inventory || emoji.main),
          )
          .setFooter({
            text:
              invMessages.footerText?.replace(
                "{user}",
                ctx.author.displayName,
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          })
          .setTimestamp();

        // Add fields to embed
        if (fields.length > 0) {
          embed.addFields(fields);
        } else {
          embed.addFields({
            name: invMessages.emptyInventoryFieldName || "Inventory",
            value:
              invMessages.emptyInventoryFieldValue ||
              "Your inventory is currently empty.",
            inline: false,
          });
        }

        return embed;
      };

      // Function to generate category embed (showing items of a specific category)
      const generateCategoryEmbed = (category, page) => {
        const items = itemList[category] || [];
        const totalPages = categoryPages[category] || 1;

        // Get items for the current page
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
        const pageItems = items.slice(startIndex, endIndex);

        // Create embed
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            `# ${emoji.mainLeft} ${client.utils
              .formatCapitalize(category)
              .toUpperCase()} ${emoji.mainRight}\n\n` +
              `Total ${items.length} items`,
          )
          .setThumbnail(
            client.utils.emojiToImage(
              categoryIcons[category] || emoji.inventory || emoji.main,
            ),
          )
          .setFooter({
            text: `Page ${page}/${totalPages} • Use the buttons to navigate`,
            iconURL: ctx.author.displayAvatarURL(),
          })
          .setTimestamp();

        // Add items to embed
        if (pageItems.length > 0) {
          embed.addFields({
            name: `${
              categoryIcons[category] || ""
            } ${client.utils.formatCapitalize(category)}`,
            value: pageItems.map((item) => item.display).join("\n"),
            inline: false,
          });
        } else {
          embed.addFields({
            name: `${
              categoryIcons[category] || ""
            } ${client.utils.formatCapitalize(category)}`,
            value: "No items found in this category.",
            inline: false,
          });
        }

        return embed;
      };

      // Function to generate category dropdown menu
      const generateCategoryDropdown = () => {
        // Create options for dropdown
        const categoryOptions = [
          {
            label: "Overview",
            description: "View all categories",
            value: "all",
            emoji: "🏠",
            default: currentView.category === "all",
          },
        ];

        // Add options for categories with items
        Object.keys(itemList).forEach((category) => {
          if (itemList[category] && itemList[category].length > 0) {
            categoryOptions.push({
              label: client.utils.formatCapitalize(category),
              description: `${itemList[category].length} items`,
              value: category,
              emoji: categoryIcons[category] || "📦",
              default: currentView.category === category,
            });
          }
        });

        // Create dropdown menu
        const dropdown = new StringSelectMenuBuilder()
          .setCustomId("category_select")
          .setPlaceholder("Select a category to view")
          .addOptions(categoryOptions);

        return new ActionRowBuilder().addComponents(dropdown);
      };

      // Function to generate pagination buttons
      const generatePaginationButtons = (category, page) => {
        const totalPages = categoryPages[category];

        // Create pagination buttons
        const prevButton = new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("◀️")
          .setDisabled(page <= 1);

        const pageIndicator = new ButtonBuilder()
          .setCustomId("page_indicator")
          .setLabel(`Page ${page}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        const nextButton = new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("▶️")
          .setDisabled(page >= totalPages);

        return new ActionRowBuilder().addComponents(
          prevButton,
          pageIndicator,
          nextButton,
        );
      };

      // Function to generate components for the overview embed
      const generateOverviewComponents = () => {
        const components = [generateCategoryDropdown()];

        // Add "View Resources" button if resources category has items
        if (itemList.resources && itemList.resources.length > 0) {
          const resourcesButton = new ButtonBuilder()
            .setCustomId("view_resources")
            .setLabel("View Resources")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(categoryIcons.resources);

          components.push(
            new ActionRowBuilder().addComponents(resourcesButton),
          );
        }

        return components;
      };

      // Initial embed and components
      const initialEmbed = generateOverviewEmbed();
      const initialComponents = generateOverviewComponents();

      // Send the message with components
      const message = await ctx.sendMessage({
        embeds: [initialEmbed],
        components: initialComponents,
      });

      // Create collector for interactions
      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        time: 180000, // 3 minutes timeout
      });

      collector.on("collect", async (interaction) => {
        // Reset collector timeout
        collector.resetTimer();

        // Handle dropdown selection
        if (interaction.customId === "category_select") {
          const selectedCategory = interaction.values[0];
          currentView.category = selectedCategory;
          currentView.page = 1;

          if (selectedCategory === "all") {
            // Show overview
            await interaction.update({
              embeds: [generateOverviewEmbed()],
              components: generateOverviewComponents(),
            });
          } else {
            // Show category
            const components = [
              generateCategoryDropdown(),
              generatePaginationButtons(selectedCategory, 1),
            ];

            await interaction.update({
              embeds: [generateCategoryEmbed(selectedCategory, 1)],
              components: components,
            });
          }
        }
        // Handle "View Resources" button
        else if (interaction.customId === "view_resources") {
          currentView.category = "resources";
          currentView.page = 1;

          const components = [
            generateCategoryDropdown(),
            generatePaginationButtons("resources", 1),
          ];

          await interaction.update({
            embeds: [generateCategoryEmbed("resources", 1)],
            components: components,
          });
        }
        // Handle pagination buttons
        else if (interaction.customId === "prev_page") {
          if (currentView.page > 1) {
            currentView.page--;
            await interaction.update({
              embeds: [
                generateCategoryEmbed(currentView.category, currentView.page),
              ],
              components: [
                generateCategoryDropdown(),
                generatePaginationButtons(
                  currentView.category,
                  currentView.page,
                ),
              ],
            });
          }
        } else if (interaction.customId === "next_page") {
          if (currentView.page < categoryPages[currentView.category]) {
            currentView.page++;
            await interaction.update({
              embeds: [
                generateCategoryEmbed(currentView.category, currentView.page),
              ],
              components: [
                generateCategoryDropdown(),
                generatePaginationButtons(
                  currentView.category,
                  currentView.page,
                ),
              ],
            });
          }
        }
      });

      collector.on("end", async () => {
        // Disable all components when collector ends
        try {
          const disabledComponents = message.components.map((row) => {
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

          await message.edit({ components: disabledComponents });
        } catch (error) {
          console.error("Error disabling components:", error);
        }
      });

      return message;
    } catch (error) {
      console.error("Error in Inventory command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        invMessages.error ||
          "An error occurred while retrieving your inventory.",
        color,
      );
    }
  }
};
