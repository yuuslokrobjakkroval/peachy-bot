const { Command } = require("../../structures/index.js");

module.exports = class Clear extends Command {
    constructor(client) {
        super(client, {
            name: "clear",
            description: {
                content: "Clear a specified number of messages",
                examples: ["clear 10"],
                usage: "clear <number>",
            },
            category: "utility",
            aliases: ["purge", "delete"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: true,
                client: ["ManageMessages"],
                user: ["ManageMessages"],
            },
            slashCommand: true,
            options: [
                {
                    name: "number_message_delete",
                    description: "Number of messages to delete",
                    type: 4, // INTEGER type for amount
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const amount = ctx.isInteraction ? ctx.interaction.options.getInteger('number_message_delete') : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0 || amount > 1000) {
            return ctx.sendMessage("Please provide a valid number between 1 and 1000.");
        }

        if (ctx.isInteraction) {
            await ctx.interaction.deferReply();
        }

        const deleteMessages = async (messagesToDelete) => {
            let deleted = 0;

            while (messagesToDelete > 0) {
                const batchSize = Math.min(messagesToDelete, 100);
                const deletedMessages = await ctx.channel.bulkDelete(batchSize, true);
                deleted += deletedMessages.size;
                messagesToDelete -= deletedMessages.size;
            }

            return deleted;
        };

        try {
            const deletedTotal = await deleteMessages(amount);
            if (ctx.isInteraction) {
                await ctx.interaction.editReply(`Successfully deleted ${deletedTotal} messages.`);
            } else {
                ctx.sendMessage(`Successfully deleted ${deletedTotal} messages.`)
                    .then(msg => {
                        setTimeout(() => msg.delete(), 100000);
                    });
            }
        } catch (err) {
            console.error(err);
            if (ctx.isInteraction) {
                await ctx.interaction.editReply("There was an error trying to delete messages in this channel.");
            } else {
                ctx.sendMessage("There was an error trying to delete messages in this channel.");
            }
        }
    }
};
