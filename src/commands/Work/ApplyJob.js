const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const moment = require('moment');

module.exports = class ApplyJob extends Command {
    constructor(client) {
        super(client, {
            name: 'applyjob',
            description: {
                content: 'Apply for a job position.',
                examples: ['applyjob student', 'applyjob police'],
                usage: 'applyjob <position>',
            },
            category: 'work',
            aliases: ['apply', 'job'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'position',
                    description: 'The job position to apply for.',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const applyJobMessages = language.locales.get(language.defaultLocale)?.workMessages?.applyJobMessages;

        try {
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Get position from args or interaction
            const position = ctx.isInteraction ? ctx.interaction.options.getString('position').toLowerCase() : args[0].toLowerCase();

            // Validate position
            const validPositions = ['student', 'police'];
            if (!validPositions.includes(position)) {
                return client.utils.sendErrorMessage(client, ctx, applyJobMessages.invalidPosition, color);
            }

            // Check if user already has active job or application
            if (user.job && user.job.position) {
                return client.utils.sendErrorMessage(client, ctx, applyJobMessages.alreadyApplied, color);
            }

            const applyDate = moment().format('YYYY-MM-DD HH:mm:ss');
            const approvedDate = moment().add(1, 'minute').format('YYYY-MM-DD HH:mm:ss');

            // Auto-approve after 1 minute for demo purposes
            await Users.updateOne(
                { userId: user.userId },
                {
                    $set: {
                        'job.position': position,
                        'job.approved': true,
                        'job.appliedDate': applyDate,
                        'job.approvedDate': approvedDate,
                    },
                }
            );

            const successEmbed = client
                .embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', 'JOB APPLICATION')
                        .replace('%{mainRight}', emoji.mainRight) +
                        applyJobMessages.autoApproved
                            .replace('%{position}', position.toUpperCase())
                            .replace('%{approvedDate}', approvedDate)
                )
                .setFooter({
                    text:
                        generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) ||
                        `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error processing applyjob command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
