const { Command } = require("../../structures/index.js");
const GiveawaySchema = require("../../schemas/giveaway.js");

module.exports = class UnpauseGiveaway extends Command {
    constructor(client) {
        super(client, {
            name: "unpause",
            description: {
                content: "Unpause a paused giveaway by message ID.",
                examples: ["unpausegiveaway <messageid>"],
                usage: "unpausegiveaway <messageid>",
            },
            category: "giveaway",
            aliases: ['unpause'],
            args: true,
            permissions: {
                client: ["SendMessages", "ViewChannel", "ManageMessages"],
                user: ["ManageGuild"],
            },
            slashCommand: true,
            options: [
                {
                    name: "messageid",
                    description: "The message ID of the giveaway to unpause.",
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
            return ctx.reply({ content: "No paused giveaway found with this message ID.", ephemeral: true });
        }

        giveaway.paused = false;
        await giveaway.save();

        return ctx.reply({ content: "Giveaway has been unpaused.", ephemeral: true });
    }
}