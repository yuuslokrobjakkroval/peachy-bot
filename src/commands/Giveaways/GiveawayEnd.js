const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem.js");

module.exports = class GiveawayEnd extends Command {
  constructor(client) {
    super(client, {
      name: "gend",
      description: {
        content: "End a giveaway early.",
        examples: ["gend 123456789012345678", "gend item 123456789012345678"],
        usage: "gend [item] <messageId>",
      },
      category: "giveaway",
      aliases: ["giveawayend", "endgiveaway"],
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
          description: "The type of giveaway to end (coin or item).",
          type: 3,
          required: true,
          choices: [
            { name: "Coin Giveaway", value: "coin" },
            { name: "Item Giveaway", value: "item" },
          ],
        },
        {
          name: "messageid",
          description: "The message ID of the giveaway to end.",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    // Defer reply to give us time to process
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
    }

    // Parse command arguments
    const type = ctx.isInteraction
      ? ctx.interaction.options.getString("type")
      : args[0] === "item"
      ? "item"
      : "coin";
    const messageId = ctx.isInteraction
      ? ctx.interaction.options.getString("messageid")
      : type === "item"
      ? args[1]
      : args[0];

    // Check if messageId is provided
    if (!messageId) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "Please provide a valid message ID to end the giveaway."
            ),
        ],
      });
    }

    try {
      // Find the giveaway in the database
      let giveaway;
      let isItemGiveaway = false;

      if (type === "item") {
        giveaway = await GiveawayShopItemSchema.findOne({ messageId });
        isItemGiveaway = true;
      } else {
        giveaway = await GiveawaySchema.findOne({ messageId });
      }

      // Check if giveaway exists
      if (!giveaway) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                `No ${
                  isItemGiveaway ? "item " : ""
                }giveaway found with message ID: ${messageId}`
              ),
          ],
        });
      }

      // Check if giveaway has already ended
      if (giveaway.ended) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription("This giveaway has already ended."),
          ],
        });
      }

      // Check if user has permission to end the giveaway
      const isOwner = require("../../utils/Config").owners.includes(
        ctx.author.id
      );
      const isGiveawayHost = giveaway.hostedBy === ctx.author.id;

      if (!isOwner && !isGiveawayHost) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "You don't have permission to end this giveaway. Only the host or bot owners can end it."
              ),
          ],
        });
      }

      // Update giveaway end time to now
      giveaway.endTime = Date.now();
      await giveaway.save();

      // Try to fetch the message
      try {
        const channel = await client.channels.fetch(giveaway.channelId);
        if (channel) {
          const message = await channel.messages.fetch(giveaway.messageId);
          if (message) {
            // End the giveaway
            if (isItemGiveaway) {
              await client.utils.endGiveawayShopItem(
                client,
                color,
                emoji,
                message,
                giveaway.autoAdd
              );
            } else {
              await client.utils.endGiveaway(
                client,
                color,
                emoji,
                message,
                giveaway.autopay
              );
            }

            return ctx.sendMessage({
              embeds: [
                client
                  .embed()
                  .setColor(color.success)
                  .setDescription("Giveaway ended successfully!"),
              ],
            });
          }
        }
      } catch (error) {
        console.error("Error fetching giveaway message:", error);
      }

      // If we couldn't fetch the message, just update the database
      giveaway.ended = true;
      await giveaway.save();

      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.warning)
            .setDescription(
              "Giveaway marked as ended, but the message couldn't be updated. It may have been deleted."
            ),
        ],
      });
    } catch (error) {
      console.error("Error ending giveaway:", error);
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "An error occurred while ending the giveaway. Please try again."
            ),
        ],
      });
    }
  }
};
