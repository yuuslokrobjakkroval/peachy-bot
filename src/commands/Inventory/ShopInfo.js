const { Command } = require("../../structures/index.js");
const { formatString } = require("../../utils/Utils.js");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const AllItems = ShopItems.flatMap((shop) => shop.inventory).concat(ImportantItems);

module.exports = class ShopInfo extends Command {
  constructor(client) {
    super(client, {
      name: "shopinfo",
      description: {
        content: "Display detailed information about a shop item or list all items sorted by type.",
        examples: ["shopinfo <id>", "shopinfo list"],
        usage: "shopinfo <id | list>",
      },
      cooldown: 5,
      category: "inventory",
      aliases: ["iteminfo"],
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "id",
          type: 3,
          description: 'The ID of the item you want to see details for or "list" to see all items sorted by type.',
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const shopInfoMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.shopInfoMessages;

    try {
      const itemId = args[0];

      if (itemId === "list") {
        return await this.listAllItems(client, ctx, color, emoji, shopInfoMessages);
      }

      const item = AllItems.find((i) => i.id === itemId);

      if (!item) {
        return await client.utils.sendErrorMessage(
            client,
            ctx,
            shopInfoMessages.itemNotFound.replace("{id}", itemId),
            color
        );
      }

      const embed = this.createItemEmbed(client, ctx, item, color, emoji, shopInfoMessages);
      return await ctx.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in ShopInfo command:', error);
      return await client.utils.sendErrorMessage(
          client,
          ctx,
          shopInfoMessages.error || "An error occurred while retrieving shop information.",
          color
      );
    }
  }

  async listAllItems(client, ctx, color, emoji, shopInfoMessages) {
    const categorizedItems = {
      Food: [],
      Drink: [],
      Theme: [],
      Milk: [],
    };

    for (const item of AllItems) {
      switch (item.type) {
        case "food":
          categorizedItems.Food.push(`**ID:** \`${item.id}\`\n**Name:** ${item.name} ${item.emoji}`);
          break;
        case "drink":
          categorizedItems.Drink.push(`**ID:** \`${item.id}\`\n**Name:** ${item.name} ${item.emoji}`);
          break;
        case "theme":
          categorizedItems.Theme.push(`**ID:** \`${item.id}\`\n**Name:** ${item.name} ${item.emoji}`);
          break;
        case "milk":
          categorizedItems.Milk.push(`**ID:** \`${item.id}\`\n**Name:** ${item.name} ${item.emoji}`);
          break;
        default:
          break;
      }
    }

    const itemList = [
      ...categorizedItems.Food,
      ...categorizedItems.Drink,
      ...categorizedItems.Theme,
      ...categorizedItems.Milk,
    ];

    if (itemList.length === 0) {
      return await ctx.reply(shopInfoMessages.noItemsAvailable);
    }

    const chunks = client.utils.chunk(itemList, 10);
    const pages = chunks.map((chunk, index) => {
      return client
          .embed()
          .setColor(color.main)
          .setDescription(chunk.join("\n\n"))
          .setFooter({ text: `Page ${index + 1} of ${chunks.length}` });
    });

    return await client.utils.reactionPaginate(ctx, pages);
  }

  createItemEmbed(client, ctx, item, color, emoji, shopInfoMessages) {
    let helpCommand;
    switch (item.type) {
      case "food":
        helpCommand = `${item.description}\n**・** \`pbuy ${item.id}\`\n**・** \`peat ${item.id}\``;
        break;
      case "drink":
        helpCommand = `${item.description}\n**・** \`pbuy ${item.id}\`\n**・** \`pdrink ${item.id}\``;
        break;
      case "theme":
        helpCommand = `${item.description}\n**・** \`pbuy ${item.id}\`\n**・** \`puse ${item.id}\``;
        break;
      case "milk":
        helpCommand = `${item.description}\n**・** \`pbuy ${item.id}\`\n**・** \`psell ${item.id}\``;
        break;
      default:
        helpCommand = shopInfoMessages.noAdditionalCommands;
        break;
    }

    return client.embed()
        .setColor(color.main)
        .setThumbnail(client.utils.emojiToImage(item.emoji))
        .setDescription(`# ${emoji.mainLeft} ITEM DETAIL ${emoji.mainRight}\n${helpCommand}`)
        .addFields(
            { name: "ID", value: item.id || "Unknown", inline: true },
            { name: "Name", value: item.name || "Unnamed", inline: true },
            {
              name: "Limit",
              value: item.limit ? item.limit.toString() : "No limit",
              inline: true,
            },
            {
              name: "Price",
              value: `${formatString(item.price.buy)} ${emoji.coin}`,
              inline: true,
            },
            {
              name: "Sell Price",
              value: `${formatString(item.price.sell)} ${emoji.coin}`,
              inline: true,
            }
        )
        .setFooter({
          text: `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });
  }
};