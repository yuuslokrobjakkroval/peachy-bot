const { Command } = require('../../structures');
const Users = require('../../schemas/user');

module.exports = class ResignJob extends Command {
    constructor(client) {
        super(client, {
            name: 'resignjob',
            description: {
                content: 'Resign from your current job position.',
                examples: ['resignjob'],
                usage: 'resignjob',
            },
            category: 'work',
            aliases: ['resign', 'quitjob', 'quit'],
            cooldown: 5,
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
        const resignJobMessages = language.locales.get(language.defaultLocale)?.workMessages?.resignJobMessages;

        try {
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Check if user has a job
            if (!user.job || !user.job.position) {
                return client.utils.sendErrorMessage(client, ctx, resignJobMessages.noJobToResign, color);
            }

            // Remove job from user
            await Users.updateOne(
                { userId: user.userId },
                {
                    $unset: {
                        'job.position': '',
                        'job.approved': '',
                        'job.appliedDate': '',
                        'job.approvedDate': '',
                    },
                }
            );

            const successEmbed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'JOB RESIGNATION')
                        .replace('%{mainRight}', emoji.mainRight) + resignJobMessages.success
                )
                .setFooter({
                    text:
                        generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                        `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error processing resignjob command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
