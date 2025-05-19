const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem.js");
const importantItems = require("../../assets/inventory/ImportantItems.js");
const shopItems = require("../../assets/inventory/ShopItems.js");
const items = shopItems.flatMap((shop) => shop.inventory);

module.exports = class GiveawayInfo extends Command {
  constructor(client) {
    super(client, {
      name: "ginfo",
      description: {
        content: "Get detailed information about a giveaway.",
        examples: [
          "giveawayinfo coin 123456789012345678",
          "giveawayinfo item 123456789012345678",
        ],
        usage: "giveawayinfo <type> <messageId>",
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
          name: "type",
          description: "The type of giveaway (coin or item).",
          type: 3,
          required: true,
          choices: [
            { name: "Coin Giveaway", value: "coin" },
            { name: "Item Giveaway", value: "item" },
          ],
        },
        {
          name: "messageid",
          description: "The message ID of the giveaway.",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    // Defer reply
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
    }

    // Parse arguments
    const type = ctx.isInteraction
      ? ctx.interaction.options.getString("type")
      : args[0]?.toLowerCase();
    const messageId = ctx.isInteraction
      ? ctx.interaction.options.getString("messageid")
      : args[1];

    // Validate arguments
    if (!type || !["coin", "item"].includes(type)) {
      return ctx.isInteraction
        ? ctx.interaction.editReply({
            content: "Please specify a valid giveaway type: `coin` or `item`.",
          })
        : ctx.editMessage({
            content: "Please specify a valid giveaway type: `coin` or `item`.",
          });
    }

    if (!messageId || !/^\d+$/.test(messageId)) {
      return ctx.isInteraction
        ? ctx.interaction.editReply({
            content: "Please provide a valid message ID for the giveaway.",
          })
        : ctx.editMessage({
            content: "Please provide a valid message ID for the giveaway.",
          });
    }

    try {
      // Fetch giveaway data
      let giveaway;
      let itemDetails = null;

      if (type === "coin") {
        giveaway = await GiveawaySchema.findOne({ messageId });
      } else {
        giveaway = await GiveawayShopItemSchema.findOne({ messageId });

        if (giveaway) {
          const category = items
            .concat(importantItems)
            .filter((c) => c.type === giveaway.type);
          itemDetails = category.find((i) => i.id === giveaway.itemId);
        }
      }

      if (!giveaway) {
        return ctx.isInteraction
          ? ctx.interaction.editReply({
              content: `No ${type} giveaway found with message ID: ${messageId}`,
            })
          : ctx.editMessage({
              content: `No ${type} giveaway found with message ID: ${messageId}`,
            });
      }

      // Create embed
      const embed = client.embed().setColor(color.main);

      if (type === "coin") {
        embed.setTitle(
          `Coin Giveaway Info: ${client.utils.formatNumber(giveaway.prize)} ${
            emoji.coin
          }`
        );
      } else {
        embed.setTitle(
          `Item Giveaway Info: ${
            itemDetails ? itemDetails.name : giveaway.itemId
          } (x${giveaway.amount})`
        );
        if (itemDetails) {
          embed.setThumbnail(client.utils.emojiToImage(itemDetails.emoji));
        }
      }

      // Add description if available
      if (giveaway.description) {
        embed.addFields({ name: "Description", value: giveaway.description });
      }

      // Add general info
      embed.addFields(
        {
          name: "Status",
          value: giveaway.ended ? "Ended" : "Active",
          inline: true,
        },
        { name: "Winners", value: giveaway.winners.toString(), inline: true },
        {
          name: "Time Remaining",
          value: giveaway.ended
            ? "Ended"
            : `<t:${Math.floor(giveaway.endTime / 1000)}:R>`,
          inline: true,
        },
        {
          name: "Created",
          value: `<t:${Math.floor(giveaway.createdAt.getTime() / 1000)}:R>`,
          inline: true,
        },
        {
          name: "Entries",
          value: giveaway.entered.length.toString(),
          inline: true,
        },
        {
          name: "Host",
          value: `<@${giveaway.hostedBy}>`,
          inline: true,
        }
      );

      // Add winners if ended
      if (giveaway.ended && giveaway.winnerId.length > 0) {
        const winnersList = giveaway.winnerId
          .map((id) => `<@${id}>`)
          .join(", ");
        embed.addFields({ name: "Winners", value: winnersList });
      }

      // Add link to giveaway
      embed.addFields({
        name: "Giveaway Link",
        value: `[Jump to Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})`,
      });

      // Send response
      return ctx.isInteraction
        ? ctx.interaction.editReply({ embeds: [embed] })
        : ctx.editMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching giveaway info:", error);
      return ctx.isInteraction
        ? ctx.interaction.editReply({
            content:
              "There was an error fetching the giveaway information. Please try again.",
          })
        : ctx.editMessage({
            content:
              "There was an error fetching the giveaway information. Please try again.",
          });
    }
  }
};
