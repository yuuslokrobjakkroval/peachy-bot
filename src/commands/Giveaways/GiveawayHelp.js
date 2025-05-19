const { Command } = require("../../structures/index.js");

module.exports = class GiveawayHelp extends Command {
  constructor(client) {
    super(client, {
      name: "giveawayhelp",
      description: {
        content: "Get help with giveaway commands.",
        examples: ["giveawayhelp"],
        usage: "giveawayhelp",
      },
      category: "giveaway",
      aliases: ["ghelp"],
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
    // Defer reply
    if (ctx.isInteraction) {
      await ctx.interaction.deferReply();
    } else {
      await ctx.sendDeferMessage(`${client.user.username} is thinking...`);
    }

    const prefix = client.prefix;

    const embed = client
      .embed()
      .setColor(color.main)
      .setTitle("Giveaway Commands Help")
      .setDescription(
        "Here's how to use the giveaway commands with the new parameter order:"
      )
      .addFields(
        {
          name: `${prefix}giveaway`,
          value: `\`${prefix}giveaway <description> <prize> <duration> <winners> [image] [thumbnail] [autopay]\`\n\nExample:\n\`${prefix}giveaway "Win amazing coins!" 1000 1h 2\``,
        },
        {
          name: `${prefix}giveawayshopitem`,
          value: `\`${prefix}giveawayshopitem <description> <type> <itemID> <amount> <duration> <winners> [image] [thumbnail] [autoadd]\`\n\nExample:\n\`${prefix}giveawayshopitem "Special food giveaway!" food f01 5 1h 1\``,
        },
        {
          name: `${prefix}giveawayinfo`,
          value: `\`${prefix}giveawayinfo <type> <messageId>\`\n\nExample:\n\`${prefix}giveawayinfo coin 123456789012345678\``,
        },
        {
          name: "Parameter Explanation",
          value: `
• **description** - Custom text describing the giveaway
• **prize** - Amount of coins for coin giveaways
• **type** - Item type for item giveaways (food, drink, theme, etc.)
• **itemID** - ID of the item from the shop
• **amount** - Number of items to give away
• **duration** - How long the giveaway lasts (1h, 1d, 1w)
• **winners** - Number of winners (1-20)
• **image** - Main image for the giveaway (attachment)
• **thumbnail** - Small thumbnail image (attachment)
• **autopay/autoadd** - Automatically give prizes to winners (true/false)`,
        }
      )
      .setFooter({
        text: "Note: Parameters in [brackets] are optional",
      });

    // Send response
    return ctx.isInteraction
      ? ctx.interaction.editReply({ embeds: [embed] })
      : ctx.editMessage({ embeds: [embed] });
  }
};
