const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");

module.exports = class PauseGiveaway extends Command {
    constructor(client) {
        super(client, {
            name: "pause",
            description: {
                content: "Pause an active giveaway by message ID.",
                examples: ["pausegiveaway <messageid>"],
                usage: "pausegiveaway <messageid>",
            },
            category: "giveaway",
            aliases: ['pause'],
            args: true,
            permissions: {
                client: ["SendMessages", "ViewChannel", "ManageMessages"],
                user: ["ManageGuild"],
            },
            slashCommand: true,
            options: [
                {
                    name: "messageid",
                    description: "The message ID of the giveaway to pause.",
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const messageId = ctx.isInteraction
            ? ctx.interaction.options.getString("messageid")
            : args[0];

        const giveaway = await GiveawaySchema.findOne({ messageId });
        if (!giveaway || giveaway.ended) {
            return ctx.reply({ content: "No active giveaway found with this message ID.", ephemeral: true });
        }

        giveaway.paused = true;
        await giveaway.save();

        return ctx.reply({ content: "Giveaway has been paused.", ephemeral: true });
    }
}