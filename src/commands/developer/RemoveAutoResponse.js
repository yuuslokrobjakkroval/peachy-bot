const { Command } = require('../../structures');
const Response = require('../../schemas/response');

module.exports = class RemoveAutoResponse extends Command {
    constructor(client) {
        super(client, {
            name: 'removeautoresponse',
            description: {
                content: "Remove an autoresponse by its ID for a specific guild.",
                examples: ['removeAutoResponse r01'],
                usage: 'removeAutoResponse <id>',
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
                    name: 'id',
                    type: 3, // String type for the ID (since it's in the format "r01")
                    description: 'The ID of the autoresponse to remove.',
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Get the ID from the options (for slash commands)
        const id = ctx.isInteraction
            ? ctx.interaction.options.getString('id')
            : args[0]; // Fallback if not a slash command

        if (!id || !/^r\d{2}$/.test(id)) {  // Validate that id is in the correct format
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

        // Find the index of the entry to remove by ID
        const entryIndex = responseDoc.autoresponse.findIndex(r => r.id === id);

        if (entryIndex === -1) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'id_not_found')),
                ],
            });
        }

        // Remove the entry from the autoresponse array
        responseDoc.autoresponse.splice(entryIndex, 1);

        // Save the updated document
        await responseDoc.save();

        // Send a success message
        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                `${emoji.tick} Successfully removed the autoresponse with ID **\`${id}\`** from this guild.`
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
