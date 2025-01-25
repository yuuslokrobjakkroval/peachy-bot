const { Command } = require("../../structures/index.js");
const { formatString } = require("../../utils/Utils.js");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const AllItems = ShopItems.flatMap((shop) => shop.inventory).concat(
  ImportantItems
);

module.exports = class ShopInfo extends Command {
  constructor(client) {
    super(client, {
      name: "shopinfo",
      description: {
        content:
          "𝑫𝒊𝒔𝒑𝒍𝒂𝒚 𝒅𝒆𝒕𝒂𝒊𝒍𝒆𝒅 𝒊𝒏𝒇𝒐𝒓𝒎𝒂𝒕𝒊𝒐𝒏 𝒂𝒃𝒐𝒖𝒕 𝒂 𝒔𝒉𝒐𝒑 𝒊𝒕𝒆𝒎 𝒐𝒓 𝒍𝒊𝒔𝒕 𝒂𝒍𝒍 𝒊𝒕𝒆𝒎𝒔 𝒔𝒐𝒓𝒕𝒆𝒅 𝒃𝒚 𝒕𝒚𝒑𝒆.",
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
          description:
            'The ID of the item you want to see details for or "list" to see all items sorted by type.',
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const shopInfoMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.shopInfoMessages;

    const itemId = args[0];

    if (itemId === "list") {
      return this.listAllItems(client, ctx, color, emoji, shopInfoMessages);
    }

    const item = AllItems.find((i) => i.id === itemId);

    if (!item) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        shopInfoMessages.itemNotFound.replace("{id}", itemId),
        color
      ); // Use localized message
    }

    const embed = this.createItemEmbed(
      client,
      ctx,
      item,
      color,
      emoji,
      shopInfoMessages
    ); // Pass messages to embed creation
    await ctx.channel.send({ embeds: [embed] });
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
          categorizedItems.Food.push(
            `****ID:**** \`${item.id}\`\n****Name:**** ${item.name} ${item.emoji}`
          );
          break;
        case "drink":
          categorizedItems.Drink.push(
            `****ID:**** \`${item.id}\`\n****Name:**** ${item.name} ${item.emoji}`
          );
          break;
        case "theme":
          categorizedItems.Theme.push(
            `****ID:**** \`${item.id}\`\n****Name:**** ${item.name} ${item.emoji}`
          );
          break;
        case "milk":
          categorizedItems.Milk.push(
            `****ID:**** \`${item.id}\`\n****Name:**** ${item.name} ${item.emoji}`
          );
          break;
        default:
          break; // Optionally handle unknown item types
      }
    }

    const itemList = [
      ...categorizedItems.Food,
      ...categorizedItems.Drink,
      ...categorizedItems.Theme,
      ...categorizedItems.Milk,
    ];

    if (itemList.length === 0) {
      return ctx.reply(shopInfoMessages.noItemsAvailable); // Use localized message
    }

    let chunks = client.utils.chunk(itemList, 10);
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
        helpCommand = `${item.description}\n****・**** \`pbuy ${item.id}\`\n****・**** \`peat ${item.id}\``;
        break;
      case "drink":
        helpCommand = `${item.description}\n****・**** \`pbuy ${item.id}\`\n****・**** \`pdrink ${item.id}\``;
        break;
      case "theme":
        helpCommand = `${item.description}\n****・**** \`pbuy ${item.id}\`\n****・**** \`puse ${item.id}\``;
        break;
      case "milk":
        helpCommand = `${item.description}\n****・**** \`pbuy ${item.id}\`\n****・**** \`psell ${item.id}\``;
        break;
      default:
        helpCommand = shopInfoMessages.noAdditionalCommands; // Fallback for unrecognized types
        break;
    }

    return client
      .embed()
      .setColor(color.main)
      .setThumbnail(client.utils.emojiToImage(item.emoji))
      .setDescription(
        `# ${emoji.shop.mainLeft} 𝐈𝐓𝐄𝐌 𝐃𝐄𝐓𝐀𝐈𝐋 ${emoji.shop.mainRight}\n${helpCommand}`
      )
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
