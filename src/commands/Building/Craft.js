const { Command } = require("../../structures/index.js");
const Woods = require("../../assets/inventory/Woods.js");
const Minerals = require("../../assets/inventory/Minerals.js");
const Fish = require("../../assets/inventory/Fish.js");

module.exports = class Craft extends Command {
  constructor(client) {
    super(client, {
      name: "craft",
      description: {
        content: "Craft new items by combining materials!",
        examples: ["craft", "craft sword", "craft list"],
        usage: "craft [item|list]",
      },
      category: "inventory",
      aliases: ["make", "create"],
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
          name: "item",
          description: "Item to craft or 'list' to see recipes",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const author = ctx.author;
    const user = await client.utils.getCachedUser(author.id);

    if (!user) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "You need to register first! Use the `/register` command.",
        color
      );
    }

    // Parse arguments - handle both text and slash commands
    let itemToCraft =
      args[0]?.toLowerCase() || ctx.options?.getString("item")?.toLowerCase();

    // Show recipe list if no item specified or "list" requested
    if (!itemToCraft || itemToCraft === "list") {
      return await this.showRecipeList(client, ctx, color, emoji, language);
    }

    // Get crafting recipes
    const recipes = this.getCraftingRecipes();
    const recipe = recipes[itemToCraft];

    if (!recipe) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        `Unknown recipe! Use \`craft list\` to see available recipes.`,
        color
      );
    }

    // Check if user has required materials
    const missingMaterials = [];
    for (const [materialId, requiredAmount] of Object.entries(
      recipe.materials
    )) {
      const userItem = user.inventory.find((item) => item.id === materialId);
      const hasAmount = userItem ? userItem.quantity : 0;

      if (hasAmount < requiredAmount) {
        const materialInfo = this.getMaterialInfo(materialId);
        missingMaterials.push(
          `${materialInfo.emoji} ${requiredAmount - hasAmount} ${materialInfo.name}`
        );
      }
    }

    if (missingMaterials.length > 0) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        `You don't have enough materials!\n**Missing:**\n${missingMaterials.join("\n")}`,
        color
      );
    }

    // Check crafting success chance
    const successRate = recipe.successRate || 0.85;
    const isSuccessful = Math.random() < successRate;

    // Update user inventory
    const result = await this.processCrafting(
      client,
      author.id,
      recipe,
      isSuccessful
    );

    // Create result embed
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    let resultDescription = "";

    if (isSuccessful) {
      resultDescription = `🎉 **Crafting Successful!**\n\n`;
      resultDescription += `${recipe.result.emoji} **+1** ${recipe.result.name}\n\n`;
    } else {
      resultDescription = `💥 **Crafting Failed!**\n\nSome materials were lost in the process...\n\n`;
    }

    // Show materials used
    resultDescription += `**Materials Used:**\n`;
    for (const [materialId, amount] of Object.entries(recipe.materials)) {
      const materialInfo = this.getMaterialInfo(materialId);
      resultDescription += `${materialInfo.emoji} **-${amount}** ${materialInfo.name}\n`;
    }

    const embed = client
      .embed()
      .setColor(isSuccessful ? color.success : color.error)
      .setDescription(
        generalMessages?.title
          ?.replace("%{mainLeft}", emoji.mainLeft)
          ?.replace("%{title}", "CRAFTING STATION")
          ?.replace("%{mainRight}", emoji.mainRight) ||
          `${emoji.mainLeft} **CRAFTING STATION** ${emoji.mainRight}`
      )
      .addFields(
        {
          name: "🔨 Crafting Result",
          value: resultDescription,
          inline: false,
        },
        {
          name: "📊 Success Rate",
          value: `**${Math.round(successRate * 100)}%**`,
          inline: true,
        }
      );

    if (isSuccessful && recipe.result.price) {
      embed.addFields({
        name: "💰 Item Value",
        value: `**${client.utils.formatNumber(recipe.result.price.sell)}** ${emoji.coin}`,
        inline: true,
      });
    }

    embed.setFooter({
      text:
        generalMessages?.requestedBy?.replace(
          "%{username}",
          ctx.author.displayName
        ) || `Requested by ${ctx.author.displayName}`,
      iconURL: ctx.author.displayAvatarURL(),
    });

    return await ctx.sendMessage({ embeds: [embed] });
  }

  async showRecipeList(client, ctx, color, emoji, language) {
    const recipes = this.getCraftingRecipes();
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;

    const categories = {
      "⚔️ **Weapons**": ["sword", "spear", "bow"],
      "🛡️ **Armor**": ["helmet", "chestplate", "boots"],
      "🔧 **Tools**": ["hammer", "saw", "compass"],
      "💎 **Jewelry**": ["ring", "necklace", "crown"],
      "🍳 **Food**": ["fishstew", "salad", "cake"],
    };

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        generalMessages?.title
          ?.replace("%{mainLeft}", emoji.mainLeft)
          ?.replace("%{title}", "CRAFTING RECIPES")
          ?.replace("%{mainRight}", emoji.mainRight) ||
          `${emoji.mainLeft} **CRAFTING RECIPES** ${emoji.mainRight}`
      )
      .setFooter({
        text: "Use `craft <item>` to craft an item!",
      });

    // Split recipes into separate fields to avoid character limit
    for (const [categoryName, items] of Object.entries(categories)) {
      let categoryText = "";

      for (const item of items) {
        if (recipes[item]) {
          const recipe = recipes[item];
          const materials = Object.entries(recipe.materials)
            .map(([id, amount]) => {
              const info = this.getMaterialInfo(id);
              return `${info.emoji}${amount}`;
            })
            .join(" ");
          categoryText += `\`${item}\` - ${materials} → ${recipe.result.emoji}\n`;
        }
      }

      if (categoryText) {
        embed.addFields({
          name: categoryName,
          value: categoryText,
          inline: true,
        });
      }
    }

    return await ctx.sendMessage({ embeds: [embed] });
  }

  getCraftingRecipes() {
    return {
      // Weapons
      sword: {
        materials: { bronzebar: 2, hardlog: 1 },
        result: {
          id: "sword",
          name: "Bronze Sword",
          emoji: "⚔️",
          price: { sell: 500 },
        },
        successRate: 0.85,
      },
      spear: {
        materials: { silverbar: 1, soft: 2 },
        result: {
          id: "spear",
          name: "Silver Spear",
          emoji: "🗡️",
          price: { sell: 400 },
        },
        successRate: 0.8,
      },
      bow: {
        materials: { hardlog: 3, soft: 1 },
        result: {
          id: "bow",
          name: "Wooden Bow",
          emoji: "🏹",
          price: { sell: 300 },
        },
        successRate: 0.9,
      },

      // Armor
      helmet: {
        materials: { bronzebar: 3, coal: 2 },
        result: {
          id: "helmet",
          name: "Bronze Helmet",
          emoji: "⛑️",
          price: { sell: 600 },
        },
        successRate: 0.75,
      },
      chestplate: {
        materials: { silverbar: 4, coal: 3 },
        result: {
          id: "chestplate",
          name: "Silver Chestplate",
          emoji: "🛡️",
          price: { sell: 1000 },
        },
        successRate: 0.7,
      },
      boots: {
        materials: { bronzebar: 2, soft: 1 },
        result: {
          id: "boots",
          name: "Bronze Boots",
          emoji: "🥾",
          price: { sell: 400 },
        },
        successRate: 0.85,
      },

      // Tools
      hammer: {
        materials: { goldbar: 2, hardlog: 2 },
        result: {
          id: "hammer",
          name: "Golden Hammer",
          emoji: "🔨",
          price: { sell: 800 },
        },
        successRate: 0.8,
      },
      saw: {
        materials: { silverbar: 1, hardlog: 1 },
        result: {
          id: "saw",
          name: "Silver Saw",
          emoji: "🪚",
          price: { sell: 450 },
        },
        successRate: 0.85,
      },
      compass: {
        materials: { goldbar: 1, coal: 1 },
        result: {
          id: "compass",
          name: "Golden Compass",
          emoji: "🧭",
          price: { sell: 350 },
        },
        successRate: 0.9,
      },

      // Jewelry
      ring: {
        materials: { goldbar: 1 },
        result: {
          id: "ring",
          name: "Gold Ring",
          emoji: "💍",
          price: { sell: 600 },
        },
        successRate: 0.95,
      },
      necklace: {
        materials: { goldbar: 2, silverbar: 1 },
        result: {
          id: "necklace",
          name: "Precious Necklace",
          emoji: "📿",
          price: { sell: 1200 },
        },
        successRate: 0.8,
      },
      crown: {
        materials: { osmiumbar: 2, goldbar: 3 },
        result: {
          id: "crown",
          name: "Royal Crown",
          emoji: "👑",
          price: { sell: 3000 },
        },
        successRate: 0.6,
      },

      // Food
      fishstew: {
        materials: { bass: 2, trout: 1 },
        result: {
          id: "fishstew",
          name: "Fish Stew",
          emoji: "🍲",
          price: { sell: 200 },
        },
        successRate: 0.95,
      },
      salad: {
        materials: { sardine: 3, anchovy: 2 },
        result: {
          id: "salad",
          name: "Fish Salad",
          emoji: "🥗",
          price: { sell: 150 },
        },
        successRate: 0.98,
      },
      cake: {
        materials: { salmon: 1, tuna: 1 },
        result: {
          id: "cake",
          name: "Seafood Cake",
          emoji: "🎂",
          price: { sell: 500 },
        },
        successRate: 0.85,
      },
    };
  }

  getMaterialInfo(materialId) {
    // Search in all item lists
    const allItems = [...Woods, ...Minerals, ...Fish];
    const item = allItems.find((i) => i.id === materialId);

    if (item) {
      return {
        name: item.name || this.formatCapitalize(item.id),
        emoji: item.emoji || "📦",
      };
    }

    // Fallback
    return {
      name: this.formatCapitalize(materialId),
      emoji: "📦",
    };
  }

  async processCrafting(client, userId, recipe, isSuccessful) {
    return await client.utils.updateUserWithRetry(userId, async (user) => {
      // Remove materials
      for (const [materialId, amount] of Object.entries(recipe.materials)) {
        const userItem = user.inventory.find((item) => item.id === materialId);
        if (userItem) {
          userItem.quantity -= amount;
          if (userItem.quantity <= 0) {
            user.inventory = user.inventory.filter(
              (item) => item.id !== materialId
            );
          }
        }
      }

      // Add result if successful
      if (isSuccessful) {
        const existingItem = user.inventory.find(
          (item) => item.id === recipe.result.id
        );
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          user.inventory.push({ id: recipe.result.id, quantity: 1 });
        }
      }
    });
  }

  formatCapitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};
