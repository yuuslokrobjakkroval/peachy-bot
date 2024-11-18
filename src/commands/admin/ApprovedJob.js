const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class ApprovedJob extends Command {
    constructor(client) {
        super(client, {
            name: 'approvedjob',
            description: {
                content: 'Approve or reject a user\'s job application.',
                examples: ['approvedjob <userId> approved', 'approvedjob <userId> rejected <reason>'],
                usage: 'approvedjob <userId> <approved|rejected> [reason]',
            },
            category: 'developer',
            aliases: ['aj'],
            args: true,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'userid',
                    description: 'The Discord user ID of the user to approve or reject.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'status',
                    description: 'The status of the job application, either "approved" or "rejected".',
                    type: 3,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for rejection (required if status is "rejected").',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const user = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || args[0];

        const userId = typeof user === 'string' ? user : user.id;
        const status = ctx.isInteraction ? ctx.interaction.options.getString('status') : args[1];
        const reason = ctx.isInteraction ? ctx.interaction.options.getString('reason') : args[2];

        if (!userId || !status || !['approved', 'rejected'].includes(status.toLowerCase())) {
            return client.utils.sendErrorMessage(client, ctx, 'Please provide a valid user ID and status ("approved" or "rejected").', color);
        }

        if (status.toLowerCase() === 'rejected' && !reason) {
            return client.utils.sendErrorMessage(client, ctx, 'Please provide a reason for rejecting the job application.', color);
        }

        try {
            const user = await Users.findOne({ userId });
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, `No user found with ID: ${userId}`, color);
            }

            // Check if the user has already applied for a job
            if (!user.work || user.work.status === 'not yet applied') {
                return client.utils.sendErrorMessage(client, ctx, 'This user has not applied for a job yet.', color);
            }

            const salary = client.utils.getSalary(user.work.position);

            if (status.toLowerCase() === 'approved') {
                user.work.salary = salary;
                user.work.status = 'approved';
                user.work.approvedDate = new Date();
                await user.save();

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐓𝐀𝐒𝐊𝐒")
                        .replace('%{mainRight}', emoji.mainRight) +
                        `Successfully approved the job application for user <@${userId}>.`
                    )
                    .setFooter({
                        text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                        iconURL: ctx.author.displayAvatarURL(),
                    });
                return ctx.sendMessage({ embed: [embed] });
            }

            if (status.toLowerCase() === 'rejected') {
                user.work.status = 'rejected';
                user.work.rejectionReason = reason;
                user.work.rejections += 1;
                await user.save();

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        generalMessages.title
                            .replace('%{mainLeft}', emoji.mainLeft)
                            .replace('%{title}', "𝐓𝐀𝐒𝐊𝐒")
                            .replace('%{mainRight}', emoji.mainRight) +
                        `Successfully approved the job application for user <@${userId}>.`
                    )
                    .setFooter({
                        text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                        iconURL: ctx.author.displayAvatarURL(),
                    });
                return ctx.sendMessage({ embed: [embed] });
            }
        } catch (err) {
            console.error(err);
            return client.utils.sendErrorMessage(client, ctx,`An error occurred while processing the job application status.`, color);
        }
    }
};
