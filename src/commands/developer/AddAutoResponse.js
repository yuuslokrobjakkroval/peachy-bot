const { Command } = require('../../structures');
const Response = require('../../schemas/response');

module.exports = class AddAutoResponse extends Command {
    constructor(client) {
        super(client, {
            name: 'addautoresponse',
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
        const trigger = ctx.isInteraction
            ? ctx.interaction.options.getString('trigger')
            : args[0];
        const response = ctx.isInteraction
            ? ctx.interaction.options.getString('response')
            : args.slice(1).join(' ');

        if (!trigger || !response) {
            return await ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_args')),
                ],
            });
        }

        const guildId = ctx.guild.id;

        let responseDoc = await Response.findOne({ guildId });

        if (!responseDoc) {
            responseDoc = new Response({
                guildId,
                autoresponse: [],
            });
        }

        // Calculate the next id based on the highest existing id in the autoresponse array
        const nextId = responseDoc.autoresponse.length > 0
            ? Math.max(...responseDoc.autoresponse.map(ar => ar.id)) + 1
            : 1;

        // Add the new trigger and response with the calculated id
        responseDoc.autoresponse.push({ id: nextId, trigger, response });

        await responseDoc.save();

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                `${emoji.tick} Successfully added a new autoresponse trigger **\`${trigger}\`** with response **\`${response}\`** to this guild.`
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
