const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class ApplyJob extends Command {
    constructor(client) {
        super(client, {
            name: 'applyjob',
            description: {
                content: 'Apply for a job with one of the five available positions.',
                examples: ['applyjob Police', 'applyjob IT', 'applyjob Doctor', 'applyjob Teacher', 'applyjob Engineer'],
                usage: 'applyjob <position>',
            },
            category: 'work',
            aliases: ['aj', 'apply', 'jobapply'],
            cooldown: 10,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true, // Enabling slash command
            options: [
                {
                    name: 'position',
                    description: 'Choose your job position.',
                    type: 3, // STRING type
                    required: true,
                    choices: [
                        { name: 'Police', value: 'police' },
                        { name: 'IT', value: 'it' },
                        { name: 'Doctor', value: 'doctor' },
                        { name: 'Teacher', value: 'teacher' },
                        { name: 'Engineer', value: 'engineer' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const applyJobMessages = language.locales.get(language.defaultLocale)?.workMessages?.applyJobMessages;

        const validPositions = ['Police', 'Doctor', 'IT', 'Engineer', 'Teacher'];

        // Get the job position selected by the user
        const position = ctx.isInteraction
            ? ctx.interaction.options.getString('position')
            : args[0];

        // Check if the provided position is valid
        if (!validPositions.includes(client.utils.formatCapitalize(position))) {
            return client.utils.sendErrorMessage(client, ctx, applyJobMessages.invalidPosition, color);
        }

        // Get the user from the database
        const user = await Users.findOne({ userId: ctx.author.id });
        if (!user) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }


        if (user.work.status === 'awaiting' || user.work.status === 'approved') {
            return client.utils.sendErrorMessage(client, ctx, applyJobMessages.alreadyApplied, color);
        }

        user.work.position = position;
        user.work.status = 'awaiting';
        user.work.applyDate = Date.now();
        await user.save();

        // Return success message
        const successEmbed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐀𝐏𝐏𝐋𝐘 𝐉𝐎𝐁")
                    .replace('%{mainRight}', emoji.mainRight) +
                applyJobMessages.success
                    .replace('%{position}', client.utils.formatCapitalize(position))
                    .replace('%{applyDate}', new Date(user.work.applyDate).toLocaleDateString())
            )
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.sendMessage({ embeds: [successEmbed] });
    }
};
