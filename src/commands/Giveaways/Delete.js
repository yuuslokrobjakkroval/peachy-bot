const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");

module.exports = class DeleteGiveaway extends Command {
    constructor(client) {
        super(client, {
            name: "delete",
            description: {
                content: "Delete an active giveaway by message ID.",
                examples: ["deletegiveaway <messageid>"],
                usage: "deletegiveaway <messageid>",
            },
            category: "giveaway",
            aliases: ['d'],
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "ManageMessages"],
                user: ["ManageGuild"],
            },
            slashCommand: true,
            options: [
                {
                    name: "messageid",
                    description: "The message ID of the giveaway to delete.",
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply({ ephemeral: true });
        }

        const messageId = ctx.isInteraction
            ? ctx.interaction.options.getString("message_id")
            : args[0];

        if (!messageId) {
            return ctx.reply({
                content: "Please provide a valid message ID.",
                ephemeral: true,
            });
        }

        const giveaway = await GiveawaySchema.findOne({ messageId });
        if (!giveaway) {
            return ctx.reply({
                content: "No active giveaway found with this message ID.",
                ephemeral: true,
            });
        }

        try {
            await GiveawaySchema.deleteOne({ messageId });
            const channel = await client.channels.fetch(giveaway.channelId);
            if (channel) {
                const msg = await channel.messages.fetch(messageId).catch(() => null);
                if (msg) await msg.delete();
            }

            return ctx.reply({
                content: "Giveaway successfully deleted.",
                ephemeral: true,
            });
        } catch (error) {
            console.error(error);
            return ctx.reply({
                content: "An error occurred while deleting the giveaway.",
                ephemeral: true,
            });
        }
    }
};
