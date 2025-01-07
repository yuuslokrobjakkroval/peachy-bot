const { Command } = require("../../structures");

module.exports = class Clear extends Command {
    constructor(client) {
        super(client, {
            name: "clear",
            description: {
                content: "𝑪𝒍𝒆𝒂𝒓 𝒂 𝒔𝒑𝒆𝒄𝒊𝒇𝒊𝒆𝒅 𝒏𝒖𝒎𝒃𝒆𝒓 𝒐𝒇 𝒎𝒆𝒔𝒔𝒂𝒈𝒆𝒔",
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

        // Defer the interaction to prevent timeout
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply({ ephemeral: true }).catch(err => console.error(err));
        }

        let messagesDeleted = 0;

        // Function to delete in chunks of 100
        async function deleteBatch(limit) {
            const deletedMessages = await ctx.channel.bulkDelete(limit, true);
            messagesDeleted += deletedMessages.size;
            return deletedMessages.size;
        }

        // Loop through until all messages are deleted
        while (numberMessageDelete > 0) {
            const deleteAmount = numberMessageDelete > 100 ? 100 : numberMessageDelete; // Determine if we should delete 100 or less
            const deletedCount = await deleteBatch(deleteAmount);

            if (deletedCount === 0) break; // Break if there are no more messages to delete

            numberMessageDelete -= deleteAmount; // Reduce the number of messages left to delete
        }

        // Edit the deferred reply with the final count
        if (ctx.isInteraction) {
            await ctx.interaction.editReply({ content: `Deleted ${messagesDeleted} messages.` });
        } else {
            ctx.sendMessage({ content: `Deleted ${messagesDeleted} messages.`, ephemeral: true });
        }
    }
};
