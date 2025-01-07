const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class ApplyJob extends Command {
    constructor(client) {
        super(client, {
            name: 'applyjob',
            description: {
                content: '𝑨𝒑𝒑𝒍𝒚 𝒇𝒐𝒓 𝒂 𝒋𝒐𝒃 𝒘𝒊𝒕𝒉 𝒐𝒏𝒆 𝒐𝒇 𝒕𝒉𝒆 𝒇𝒊𝒗𝒆 𝒂𝒗𝒂𝒊𝒍𝒂𝒃𝒍𝒆 𝒑𝒐𝒔𝒊𝒕𝒊𝒐𝒏𝒔.',
                examples: ['applyjob Police', 'applyjob IT', 'applyjob Doctor', 'applyjob Teacher', 'applyjob Engineer'],
                usage: 'applyjob <position>',
            },
            category: 'work',
            aliases: ['apply', 'jobapply'],
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
                        { name: 'police', value: 'police' },
                        { name: 'it', value: 'it' },
                        { name: 'doctor', value: 'doctor' },
                        { name: 'teacher', value: 'teacher' },
                        { name: 'engineer', value: 'engineer' },
                        { name: 'student', value: 'student' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const applyJobMessages = language.locales.get(language.defaultLocale)?.workMessages?.applyJobMessages;

        const validPositions = ['police', 'doctor', 'it', 'engineer', 'teacher', 'student'];

        // Normalize position input
        const normalizePosition = (input) => input?.toLowerCase().trim();
        const position = ctx.isInteraction
            ? normalizePosition(ctx.interaction.options.getString('position'))
            : normalizePosition(args[0]);

        // Validate position
        if (!validPositions.includes(position)) {
            return client.utils.sendErrorMessage(client, ctx, applyJobMessages.invalidPosition, color);
        }

        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            // Prevent duplicate applications
            if (['awaiting', 'approved'].includes(user.work.status)) {
                return client.utils.sendErrorMessage(client, ctx, applyJobMessages.alreadyApplied, color);
            }

            // Set work details
            user.work.position = position;
            user.work.applyDate = Date.now();

            if (position === 'student') {
                user.work.status = 'approved';
                user.work.approvedDate = Date.now();
            } else {
                user.work.status = 'awaiting';
            }

            await user.save();

            // Success embed
            const successEmbed = client.embed()
                .setColor(color.main)
                .setThumbnail(client.utils.emojiToImage(client.utils.emojiPosition(position)))
                .setDescription(
                    `${generalMessages.title.replace('%{mainLeft}', emoji.mainLeft).replace('%{title}', '𝐀𝐏𝐏𝐋𝐘 𝐉𝐎𝐁').replace('%{mainRight}', emoji.mainRight)}
                ${position === 'student'
                        ? applyJobMessages.autoApproved
                            .replace('%{position}', client.utils.formatCapitalize('Student'))
                            .replace('%{approvedDate}', new Date(user.work.approvedDate).toLocaleDateString())
                        : applyJobMessages.success
                            .replace('%{position}', client.utils.formatCapitalize(position === 'it' ? 'IT' : position))
                            .replace('%{applyDate}', new Date(user.work.applyDate).toLocaleDateString())
                    }`
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.internalError, color);
        }
    }
};
