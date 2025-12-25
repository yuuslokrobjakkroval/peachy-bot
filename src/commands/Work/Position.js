const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const moment = require('moment');

module.exports = class Position extends Command {
    constructor(client) {
        super(client, {
            name: 'position',
            description: {
                content: 'Check your current job position.',
                examples: ['position'],
                usage: 'position',
            },
            category: 'work',
            aliases: ['job', 'work', 'pos'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const positionMessages = language.locales.get(language.defaultLocale)?.workMessages?.positionMessages;

        try {
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            let description = '';

            if (user.job && user.job.position) {
                if (user.job.approved) {
                    description = positionMessages.applyingJob.replace('%{position}', user.job.position);
                } else {
                    description = positionMessages.applyingJob.replace('%{position}', user.job.position);
                }
            } else {
                description = positionMessages.noJob;
            }

            const positionEmbed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'POSITION')
                        .replace('%{mainRight}', emoji.mainRight) + description
                )
                .setFooter({
                    text:
                        generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                        `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [positionEmbed] });
        } catch (error) {
            console.error('Error processing position command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
