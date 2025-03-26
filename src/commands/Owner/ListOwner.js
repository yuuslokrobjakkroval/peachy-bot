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
                dev: true, // Restricts to developers
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
            if (owners.length === 0) {
                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription("No owners found.");
                return await ctx.sendMessage({ embeds: [embed] });
            }

            // Map owners to a formatted string
            const ownerList = owners.map(
                (owner) => `Username: **${owner.username}**\nID: **${owner.id}**`
            );

            // Split into chunks of 10 for pagination
            let chunks = client.utils.chunk(ownerList, 10);
            const pages = [];

            // Create embed pages
            for (let i = 0; i < chunks.length; i++) {
                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(chunks[i].join("\n\n"))
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
                pages.push(embed);
            }

            // Send paginated response
            return await client.utils.reactionPaginate(ctx, pages);
        } catch (error) {
            console.error("Error listing owners:", error);
            return client.sendErrorMessage(client, ctx, "Failed to list owners. Check logs for details.", color);
        }
    }
};