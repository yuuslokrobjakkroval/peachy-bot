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

    run(client, ctx, args, color, emoji, language) {
        const trigger = ctx.isInteraction
            ? ctx.interaction.options.getString('trigger')
            : args[0];
        const response = ctx.isInteraction
            ? ctx.interaction.options.getString('response')
            : args.slice(1).join(' ');

        if (!trigger || !response) {
            return ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_args')),
                ],
            });
        }

        const guildId = ctx.guild.id;

        Response.findOne({ guildId }).then(responseDoc => {
            if (!responseDoc) {
                responseDoc = new Response({
                    guildId,
                    autoresponse: [],
                });
            }

            const lastId = responseDoc.autoresponse.reduce((max, ar) => {
                const num = parseInt(ar.id.slice(1), 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);

            const nextId = `r${String(lastId + 1).padStart(2, '0')}`;

            responseDoc.autoresponse.push({ id: nextId, trigger, response });

            responseDoc.save()
                .then(() => {
                    const embed = client
                        .embed()
                        .setColor(color.main)
                        .setDescription(
                            `${emoji.tick} Successfully added a new autoresponse trigger **\`${trigger}\`** with response **\`${response}\`** to this guild.`
                        );

                    ctx.sendMessage({ embeds: [embed] });
                })
                .catch(err => {
                    console.error(err);
                    ctx.sendMessage({
                        embeds: [
                            client.embed().setColor(color.danger).setDescription("Failed to save the autoresponse. Please try again."),
                        ],
                    });
                });
        }).catch(err => {
            console.error(err);
            ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription("An error occurred while fetching autoresponses. Please try again."),
                ],
            });
        });
    }
};
