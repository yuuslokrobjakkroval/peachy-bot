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

    run(client, ctx, args, color, emoji, language) {
        const id = ctx.isInteraction
            ? ctx.interaction.options.getString('id')
            : args[0];

        if (!id || !/^r\d{2}$/.test(id)) {
            return ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_args')),
                ],
            });
        }

        const guildId = ctx.guild.id;

        Response.findOne({ guildId }).then(responseDoc => {
            if (!responseDoc) {
                return ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'no_response_found')),
                    ],
                });
            }

            const entryIndex = responseDoc.autoresponse.findIndex(r => r.id === id);

            if (entryIndex === -1) {
                return ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(client.i18n.get(language, 'commands', 'id_not_found')),
                    ],
                });
            }

            responseDoc.autoresponse.splice(entryIndex, 1);

            responseDoc.save()
                .then(() => {
                    const embed = client
                        .embed()
                        .setColor(color.main)
                        .setDescription(
                            `${emoji.tick} Successfully removed the autoresponse with ID **\`${id}\`** from this guild.`
                        );

                    ctx.sendMessage({ embeds: [embed] });
                })
                .catch(err => {
                    console.error(err);
                    ctx.sendMessage({
                        embeds: [
                            client.embed().setColor(color.danger).setDescription("Failed to remove the autoresponse. Please try again."),
                        ],
                    });
                });
        }).catch(err => {
            console.error(err);
            ctx.sendMessage({
                embeds: [
                    client.embed().setColor(color.danger).setDescription("An error occurred while accessing autoresponses. Please try again."),
                ],
            });
        });
    }
};
