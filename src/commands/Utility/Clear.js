const { Command } = require("../../structures");

module.exports = class Clear extends Command {
    constructor(client) {
        super(client, {
            name: "clear",
            description: {
                content: "Clear a specified number of messages",
                examples: ["clear 10", "clear 250"],
                usage: "clear <number>",
            },
            category: "utility",
            aliases: ["purge", "delete"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["ManageMessages"],
                user: ["ManageMessages"], // Default permissions for users without Admin
            },
            slashCommand: true,
            options: [
                {
                    name: "number_message_delete",
                    description: "Number of messages to delete (1-1000)",
                    type: 4, // INTEGER type for amount
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        // Check for user permissions
        const hasManageMessages = ctx.member.permissions.has("ManageMessages");
        const isAdmin = ctx.member.permissions.has("Administrator");

        if (!hasManageMessages && !isAdmin) {
            return client.utils.sendErrorMessage(
                "You need the 'Manage Messages' or 'Administrator' permission to use this command."
            );
        }

        let numberMessageDelete = ctx.isInteraction
            ? ctx.interaction.options.getInteger("number_message_delete")
            : parseInt(args[0]);

        if (isNaN(numberMessageDelete) || numberMessageDelete <= 0 || numberMessageDelete > 1000) {
            return ctx.sendMessage("Please provide a valid number between 1 and 1000.");
        }

        // Handle interaction deferral
        if (ctx.isInteraction) {
            try {
                await ctx.interaction.deferReply({ ephemeral: true }); // Use ephemeral: true instead of flags: 64 for clarity
            } catch (err) {
                console.error("Failed to defer reply:", err);
                return; // Exit if deferral fails
            }
        }

        let messagesDeleted = 0;

        // Function to delete in chunks of 100
        async function deleteBatch(limit) {
            const deletedMessages = await ctx.channel.bulkDelete(limit, true);
            messagesDeleted += deletedMessages.size;
            return deletedMessages.size;
        }

        // Loop through until all messages are deleted
        try {
            while (numberMessageDelete > 0) {
                const deleteAmount = Math.min(numberMessageDelete, 100); // Use Math.min for clarity
                const deletedCount = await deleteBatch(deleteAmount);

                if (deletedCount === 0) break; // Break if no more messages to delete

                numberMessageDelete -= deleteAmount;
            }

            // Send or edit response
            const response = `Deleted ${messagesDeleted} messages.`;
            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ content: response });
            } else {
                await ctx.sendMessage({ content: response, flags: 64 });
            }
        } catch (err) {
            console.error("Error during message deletion:", err);
            const errorResponse = "An error occurred while deleting messages.";
            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ content: errorResponse }).catch(() => {});
            } else {
                await ctx.sendMessage({ content: errorResponse, flags: 64 });
            }
        }
    }
};