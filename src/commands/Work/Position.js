const { Command } = require('../../structures');
const Users = require('../../schemas/user');

module.exports = class Position extends Command {
    constructor(client) {
        super(client, {
            name: 'position',
            description: {
                content: 'Check your current work position.',
                examples: ['position'],
                usage: 'position',
            },
            category: 'economy',
            aliases: ['p', 'jobinfo', 'checkposition'],
            cooldown: 60, // 1 minute cooldown
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

        // Get the user from the database
        const user = await Users.findOne({ userId: ctx.author.id });
        if (!user) {
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
        }

        // Check the user's work position
        const { position, status } = user.work;

        if (!position || position && status === 'awaiting') {
            return client.utils.sendErrorMessage(client, ctx, positionMessages.applyingJob.replace('%{position}', client.utils.formatCapitalize(position)), color);
        }

        if (!position || position && status !== 'approved') {
            return client.utils.sendErrorMessage(client, ctx, positionMessages.noJob, color);
        }

        // Embed to show the user's position
        const positionEmbed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐏𝐎𝐒𝐈𝐓𝐈𝐎𝐍")
                    .replace('%{mainRight}', emoji.mainRight) +
                `You are currently working as a **${position}**.`)
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName),
                iconURL: ctx.author.displayAvatarURL(),
            });

        // Send the embed with the position
        return ctx.sendMessage({ embeds: [positionEmbed] });
    }
};