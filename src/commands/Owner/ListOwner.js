const { Command } = require("../../structures/index.js");
const Owners = require("../../schemas/owner");

module.exports = class ListOwners extends Command {
  constructor(client) {
    super(client, {
      name: "listowners",
      description: {
        content: "List all owners of the bot",
        examples: ["listowners"],
        usage: "listowners",
      },
      category: "owner",
      aliases: ["lo"],
      cooldown: 3,
      args: false,
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
    try {
      const owners = await Owners.find({});
      if (!owners || owners.length === 0) {
        const embed = client
          .embed()
          .setColor(color.main)
          .setDescription("No owners found.");
        return await ctx.sendMessage({ embeds: [embed] });
      }

      // Fetch user info for all owners
      const ownerList = await Promise.all(
        owners.map(async (owner) => {
          try {
            const user = await client.users.fetch(owner.ownerId);
            return {
              id: user.id,
              name: user.displayName || user.username,
            };
          } catch (fetchError) {
            return {
              id: owner.ownerId,
              name: "Unknown User",
            };
          }
        })
      );

      // Format the list
      const formattedList = ownerList.map(
        (owner) => `ID: **${owner.id}**\nName: **${owner.name}**`
      );

      // Split into chunks of 10 for pagination
      const chunks = client.utils.chunk(formattedList, 10);
      const pages = chunks.map((chunk, index) =>
        client
          .embed()
          .setColor(color.main)
          .setDescription(chunk.join("\n\n"))
          .setFooter({ text: `Page ${index + 1} of ${chunks.length}` })
      );

      // Send paginated response
      return await client.utils.reactionPaginate(ctx, pages);
    } catch (error) {
      console.error("Error listing owners:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to list owners. Check logs for details.",
        color
      );
    }
  }
};
