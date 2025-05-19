const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");
const GiveawayShopItemSchema = require("../../schemas/giveawayShopItem.js");

module.exports = class GiveawayList extends Command {
  constructor(client) {
    super(client, {
      name: "glist",
      description: {
        content: "List all active giveaways in the server.",
        examples: ["glist", "glist all"],
        usage: "glist [all]",
      },
      category: "giveaway",
      aliases: ["giveawaylist", "listgiveaways"],
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "scope",
          description: "Show all giveaways or only active ones.",
          type: 3,
          required: false,
          choices: [
            { name: "Active Only", value: "active" },
            { name: "All Giveaways", value: "all" },
          ],
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
    const scope = ctx.isInteraction
      ? ctx.interaction.options.getString("scope") || "active"
      : args[0] === "all"
      ? "all"
      : "active";

    try {
      // Find giveaways in the database
      const query =
        scope === "all"
          ? { guildId: ctx.guild.id }
          : { guildId: ctx.guild.id, ended: false };

      const coinGiveaways = await GiveawaySchema.find(query).sort({
        endTime: 1,
      });
      const itemGiveaways = await GiveawayShopItemSchema.find(query).sort({
        endTime: 1,
      });

      // Check if there are any giveaways
      if (coinGiveaways.length === 0 && itemGiveaways.length === 0) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription(
                `No ${
                  scope === "active" ? "active " : ""
                }giveaways found in this server.`
              ),
          ],
        });
      }

      // Create embeds for coin giveaways
      const coinEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji.coin} Coin Giveaways`);

      if (coinGiveaways.length > 0) {
        let coinDescription = "";
        for (const giveaway of coinGiveaways) {
          const status = giveaway.ended
            ? "Ended"
            : giveaway.paused
            ? "Paused"
            : `Ends <t:${Math.floor(giveaway.endTime / 1000)}:R>`;

          coinDescription += `**ID:** \`${giveaway.messageId}\`\n`;
          coinDescription += `**Prize:** ${client.utils.formatNumber(
            giveaway.prize
          )} ${emoji.coin}\n`;
          coinDescription += `**Winners:** ${giveaway.winners}\n`;
          coinDescription += `**Entries:** ${giveaway.entered.length}\n`;
          coinDescription += `**Status:** ${status}\n`;
          coinDescription += `**Channel:** <#${giveaway.channelId}>\n\n`;
        }
        coinEmbed.setDescription(coinDescription);
      } else {
        coinEmbed.setDescription("No coin giveaways found.");
      }

      // Create embeds for item giveaways
      const itemEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`🎁 Item Giveaways`);

      if (itemGiveaways.length > 0) {
        let itemDescription = "";
        for (const giveaway of itemGiveaways) {
          const status = giveaway.ended
            ? "Ended"
            : giveaway.paused
            ? "Paused"
            : `Ends <t:${Math.floor(giveaway.endTime / 1000)}:R>`;

          itemDescription += `**ID:** \`${giveaway.messageId}\`\n`;
          itemDescription += `**Item:** ${giveaway.itemId} (${giveaway.type}) x${giveaway.amount}\n`;
          itemDescription += `**Winners:** ${giveaway.winners}\n`;
          itemDescription += `**Entries:** ${giveaway.entered.length}\n`;
          itemDescription += `**Status:** ${status}\n`;
          itemDescription += `**Channel:** <#${giveaway.channelId}>\n\n`;
        }
        itemEmbed.setDescription(itemDescription);
      } else {
        itemEmbed.setDescription("No item giveaways found.");
      }

      // Send embeds
      const embeds = [coinEmbed, itemEmbed];
      await client.utils.paginate(ctx, embeds);
    } catch (error) {
      console.error("Error listing giveaways:", error);
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "An error occurred while listing giveaways. Please try again."
            ),
        ],
      });
    }
  }
};
