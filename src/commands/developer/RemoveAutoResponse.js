const { Command } = require('../../structures');
const Response = require('../../schemas/response');

module.exports = class RemoveAutoResponse extends Command {
    constructor(client) {
        super(client, {
            name: 'removeautoresponse',
            description: {
                content: "Remove an autoresponse trigger from a specific guild.",
                examples: ['removeAutoResponse "hello"'],
                usage: 'removeAutoResponse <trigger>',
            },
            category: 'developer',
            aliases: ['removear'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'trigger',
                    type: 3,
                    description: 'The trigger to remove from autoresponse.',
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Get the trigger from the options (for slash commands)
        const trigger = ctx.isInteraction
            ? ctx.interaction.options.getString('trigger')
            : args[0]; // Fallback if not a slash command

        if (!trigger) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_args')),
                ],
            });
        }

        const guildId = ctx.guild.id; // Get the guild ID from the context

        // Find the response document for this guild
        let responseDoc = await Response.findOne({ guildId });

        if (!responseDoc) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'no_response_found')),
                ],
            });
        }

        // Find the index of the trigger to remove
        const triggerIndex = responseDoc.autoresponse.findIndex(r => r.trigger === trigger);

        if (triggerIndex === -1) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'trigger_not_found')),
                ],
            });
        }

        // Remove the trigger from the autoresponse array
        responseDoc.autoresponse.splice(triggerIndex, 1);

        // Save the updated document
        await responseDoc.save();

        // Send a success message
        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                `${emoji.tick} Successfully removed the autoresponse trigger **\`${trigger}\`** from this guild.`
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
