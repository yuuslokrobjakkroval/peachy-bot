const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const inventory = ShopItems.flatMap((shop) => shop.inventory);
const Items = inventory
  .filter((value) => value.price.buy !== 0)
  .sort((a, b) => a.price.buy - b.price.buy);

module.exports = class UserInventory extends Command {
  constructor(client) {
    super(client, {
      name: "userinventory",
      description: {
        content: "Shows the user inventory.",
        examples: ["userinventory @user"],
        usage: "userinventory <user>",
      },
      cooldown: 5,
      category: "developer",
      aliases: ["ui"],
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const giveItemMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.giveItemMessages;
    const invMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.invMessages;
    try {
      const mention =
        ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];
      const userId = typeof mention === "string" ? mention : mention.id;
      const syncUser = await client.users.fetch(userId);

      const user = await Users.findOne({ userId: syncUser.id });
      if (!user || !user.inventory) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          invMessages.noInventory || "No inventory data found for this user.",
          color
        );
      }

      const itemList = {};
      let totalWorth = 0;
      user.inventory.forEach((item) => {
        if (item.quantity > 0) {
          const itemInfo = Items.concat(ImportantItems).find(
            ({ id }) => id === item.id
          );

          if (itemInfo) {
            const type = itemInfo.type;
            itemList[type] = itemList[type] || [];
            itemList[type].push(
              `\`${itemInfo.id}\` ${itemInfo.emoji} ****${item.quantity}**** ${
                itemInfo.name
                  ? itemInfo.name
                  : client.utils.toNameCase(itemInfo.id)
              }`
            );
            if (itemInfo.type === "milk") {
              totalWorth += itemInfo.price.sell * item.quantity;
            }
          }
        }
      });

      const fields = [];
      const inventoryTypes = [
        "milk",
        "food",
        "drink",
        "cake",
        "ring",
        "color",
        "theme",
        "special theme",
        "wallpaper",
      ];

      inventoryTypes.forEach((type) => {
        const items = itemList[type]; // Extract the items of this type
        if (items && items.length > 0) {
          let chunk = [];
          let chunkLength = 0;
          // const isInline = type !== 'milk';  // Inline true only for 'tool'

          items.forEach((item) => {
            if (chunkLength + item.length + 1 > 1024) {
              fields.push({
                name: client.utils.formatCapitalize(type),
                value: chunk.join("\n"),
                inline: false,
              });
              chunk = [];
              chunkLength = 0;
            }
            chunk.push(item);
            chunkLength += item.length + 1;
          });

          if (chunk.length > 0) {
            fields.push({
              name: client.utils.formatCapitalize(type),
              value: chunk.join("\n"),
              inline: false,
            });
          }
        }
      });

      const embedFields = [
        {
          name: invMessages.inventoryNet || "Inventory Net",
          value: `****\`${client.utils.formatNumber(totalWorth)}\`**** ${
            emoji.coin
          }`,
          inline: false,
        },
        ...(fields.length
          ? fields
          : [
              {
                name: invMessages.emptyInventoryFieldName || "Inventory",
                value:
                  invMessages.emptyInventoryFieldValue ||
                  "Your inventory is currently empty.",
              },
            ]),
      ];

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          `## ${emoji.mainLeft} ${
            invMessages.inventoryTitle || "𝐈𝐍𝐕𝐄𝐍𝐓𝐎𝐑𝐘"
          } ${emoji.mainRight}`
        )
        .setThumbnail(client.utils.emojiToImage(emoji.main))
        .addFields(embedFields)
        .setFooter({
          text:
            invMessages.footerText?.replace("{user}", ctx.author.displayName) ||
            `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error in Inventory command:", error);
      await client.utils.sendErrorMessage(
        client,
        ctx,
        invMessages.error ||
          "An error occurred while retrieving your inventory.",
        color
      );
    }
  }
};
