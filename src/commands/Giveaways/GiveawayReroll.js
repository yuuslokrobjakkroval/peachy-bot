const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem.js");
const Users = require("../../schemas/user.js");
const importantItems = require("../../assets/inventory/ImportantItems.js");
const shopItems = require("../../assets/inventory/ShopItems.js");
const items = shopItems.flatMap((shop) => shop.inventory);

module.exports = class Reroll extends Command {
  constructor(client) {
    super(client, {
      name: "greroll",
      description: {
        content: "Reroll a giveaway to select new winners.",
        examples: [
          "reroll 123456789012345678",
          "reroll item 123456789012345678",
        ],
        usage: "reroll [item] <messageId>",
      },
      category: "giveaway",
      aliases: ["gr", "reroll"],
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
          description: "The type of giveaway to reroll (coin or item).",
          type: 3,
          required: true,
          choices: [
            { name: "Coin Giveaway", value: "coin" },
            { name: "Item Giveaway", value: "item" },
          ],
        },
        {
          name: "messageid",
          description: "The message ID of the giveaway to reroll.",
          type: 3,
          required: true,
        },
        {
          name: "winners",
          description:
            "Number of winners to reroll (defaults to original count).",
          type: 4,
          required: false,
        },
        {
          name: "autopay",
          description: "Automatically pay the winners (Owner Only).",
          type: 3,
          required: false,
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
    const newWinnerCount = ctx.isInteraction
      ? ctx.interaction.options.getInteger("winners")
      : null;
    const autoPay = ctx.isInteraction
      ? ctx.interaction.options.getString("autopay")
      : null;

    // Check if messageId is provided
    if (!messageId) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("Please provide a valid message ID to reroll."),
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

      // Check if giveaway has ended
      if (!giveaway.ended) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "This giveaway hasn't ended yet. You can only reroll ended giveaways."
              ),
          ],
        });
      }

      // Check if there are any participants
      if (giveaway.entered.length === 0) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription(
                "No one entered this giveaway, so there's no one to reroll."
              ),
          ],
        });
      }

      // Determine number of winners to select
      const winnersToSelect = newWinnerCount || giveaway.winners;

      // Select new winners
      function getMultipleRandom(arr, number) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, number);
      }

      // Filter out previous winners if possible
      const eligibleParticipants = giveaway.entered.filter(
        (id) => !giveaway.winnerId.includes(id)
      );

      // If no eligible participants (all have won already), use all participants
      const selectionPool =
        eligibleParticipants.length > 0
          ? eligibleParticipants
          : giveaway.entered;

      // Select new winners
      const newWinners = getMultipleRandom(
        selectionPool,
        Math.min(winnersToSelect, selectionPool.length)
      );

      // Update giveaway in database
      giveaway.rerollCount = (giveaway.rerollCount || 0) + 1;
      giveaway.rerolledWinners = [
        ...(giveaway.rerolledWinners || []),
        ...giveaway.winnerId,
      ];
      giveaway.winnerId = newWinners;
      await giveaway.save();

      // Prepare announcement message
      let winnerAnnouncement;

      if (isItemGiveaway) {
        // Get item details for item giveaway
        const category = items
          .concat(importantItems)
          .filter((c) => c.type === giveaway.type);
        const item = category.find(
          (i) => i.id.toLowerCase() === giveaway.itemId.toLowerCase()
        );

        winnerAnnouncement = newWinners.length
          ? `Reroll #${giveaway.rerollCount} - New winners: ${newWinners
              .map((id) => `<@${id}>`)
              .join(", ")}!\n` +
            `You've won **${item ? item.name : giveaway.itemId}** x${
              giveaway.amount
            }!`
          : "No eligible winners found for the reroll.";

        // Handle auto-add if enabled
        if (
          autoPay === "true" &&
          newWinners.length > 0 &&
          this.hasOwnerPermission(ctx.author.id)
        ) {
          for (const winner of newWinners) {
            try {
              const user = await Users.findOne({ userId: winner });
              if (user && item) {
                const itemIndex = user.inventory.findIndex(
                  (i) => i.id === item.id
                );
                if (itemIndex > -1) {
                  user.inventory[itemIndex].quantity += giveaway.amount;
                } else {
                  user.inventory.push({
                    id: item.id,
                    name: item.name,
                    quantity: giveaway.amount,
                  });
                }
                await user.save();

                await ctx.channel.send({
                  embeds: [
                    client
                      .embed()
                      .setColor(color.success)
                      .setDescription(
                        `Added **${item.name}** x${giveaway.amount} to <@${winner}>'s inventory.`
                      ),
                  ],
                });
              }
            } catch (err) {
              console.error(`Error adding item to user <@${winner}>:`, err);
            }
          }
        }
      } else {
        // Coin giveaway
        winnerAnnouncement = newWinners.length
          ? `Reroll #${giveaway.rerollCount} - New winners: ${newWinners
              .map((id) => `<@${id}>`)
              .join(", ")}!\n` +
            `You've won **${client.utils.formatNumber(giveaway.prize)}** ${
              emoji.coin
            }!`
          : "No eligible winners found for the reroll.";

        // Handle autopay if enabled
        if (
          autoPay === "true" &&
          newWinners.length > 0 &&
          this.hasOwnerPermission(ctx.author.id)
        ) {
          for (const winner of newWinners) {
            try {
              await client.utils.addCoinsToUser(winner, giveaway.prize);

              await ctx.channel.send({
                embeds: [
                  client
                    .embed()
                    .setColor(color.success)
                    .setDescription(
                      `Added **${client.utils.formatNumber(giveaway.prize)}** ${
                        emoji.coin
                      } to <@${winner}>'s balance.`
                    ),
                ],
              });
            } catch (err) {
              console.error(`Error adding coins to user <@${winner}>:`, err);
            }
          }
        }
      }

      // Send announcement
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.main)
            .setTitle(`🎉 Giveaway Rerolled!`)
            .setDescription(winnerAnnouncement)
            .setFooter({ text: `Giveaway ID: ${messageId}` }),
        ],
      });
    } catch (error) {
      console.error("Error rerolling giveaway:", error);
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "An error occurred while rerolling the giveaway. Please try again."
            ),
        ],
      });
    }
  }

  hasOwnerPermission(userId) {
    return require("../../utils/Config").owners.includes(userId);
  }
};
