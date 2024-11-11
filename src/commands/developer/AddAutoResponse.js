const { Command } = require('../../structures');
const Response = require('../../schemas/response');

module.exports = class AddAutoResponse extends Command {
    constructor(client) {
        super(client, {
            name: 'addAutoResponse',
            description: {
                content: "Add an autoresponse trigger and response for a specific guild.",
                examples: ['addAutoResponse "hello" "Hi, how can I assist you?"'],
                usage: 'addAutoResponse <trigger> <response>',
            },
            category: 'developer',
            aliases: ['addar'],
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
                    description: 'The trigger to respond to.',
                    required: true,
                },
                {
                    name: 'response',
                    type: 3,
                    description: 'The response to send when the trigger is activated.',
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Get the trigger and response from the options (for slash commands)
        const trigger = ctx.isInteraction
            ? ctx.interaction.options.getString('trigger')
            : args[0]; // Fallback if not a slash command

        const response = ctx.isInteraction
            ? ctx.interaction.options.getString('response')
            : args.slice(1).join(' '); // Fallback if not a slash command

        // Validate that both trigger and response are provided
        if (!trigger || !response) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_args')),
                ],
            });
        }

        const guildId = ctx.guild.id; // Get the guild ID from the context

        // Find the response document for this guild
        let responseDoc = await Response.findOne({ guildId });

        // If the document doesn't exist, create a new one
        if (!responseDoc) {
            responseDoc = new Response({
                guildId,
                autoresponse: [],
            });
        }

        // Check if the trigger already exists in the autoresponse array
        const existingResponse = responseDoc.autoresponse.find(r => r.trigger === trigger);
        if (existingResponse) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'trigger_exists')),
                ],
            });
        }

        // Add the new trigger and response to the autoresponse array
        responseDoc.autoresponse.push({ trigger, response });

        // Save the updated document
        await responseDoc.save();

        // Send a success message
        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                `${emoji.tick} Successfully added a new autoresponse trigger **\`${trigger}\`** with response **\`${response}\`** to this guild.`
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
