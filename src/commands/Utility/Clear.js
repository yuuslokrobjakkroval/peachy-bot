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
                dev: false,
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
        const numberMessageDelete = ctx.isInteraction ? ctx.interaction.options.getInteger('number_message_delete') : parseInt(args[0]);

        if (isNaN(numberMessageDelete) || numberMessageDelete <= 0 || numberMessageDelete > 100) {
            return ctx.sendMessage("Please provide a valid number between 1 and 100.");
        }

        await ctx.channel.bulkDelete(numberMessageDelete, true)
            .then(deletedMessages => {
                // Send a confirmation message
                ctx.sendMessage(`Deleted ${deletedMessages.size} messages.`)
                    .then(msg => {
                        // Delete the confirmation message after 5 seconds
                        setTimeout(() => msg.delete(), 3000); // 5000ms = 5 seconds
                    });
            })
            .catch(err => {
                console.error(err);
                ctx.sendMessage("There was an error trying to delete messages in this channel.");
            });
    }
};
