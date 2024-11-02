const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Users = require('../../schemas/user.js');

module.exports = class Register extends Command {
    constructor(client) {
        super(client, {
            name: 'register',
            description: {
                content: 'Register yourself to start using bot features.',
                examples: ['register'],
                usage: 'register',
            },
            category: 'info',
            aliases: ['signup', 'join'],
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
        const registerMessages = language.locales.get(language.defaultLocale)?.informationMessages?.registerMessages;
        const user = await Users.findOne({ userId: ctx.author.id }).exec();

        if (user) {
            return await ctx.sendMessage({
                embeds: [
                    this.client.embed()
                        .setColor(color.danger)
                        .setTitle(registerMessages.titleAlreadyRegistered)
                        .setDescription(registerMessages.alreadyRegistered)
                ],
                ephemeral: true,
            });
        }

        const newUser = new Users({
            userId: ctx.author.id,
            balance: { coin: 0 },
        });
        await newUser.save();

        const embed = client.embed()
            .setColor(color.main)
            .setTitle(registerMessages.titleRegistrationSuccessful)
            .setDescription(registerMessages.registrationSuccessful.replace('{username}', ctx.author.username))
            .setFooter({ text: generalMessages.footer });

        const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support)
        const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite)
        const voteButton = client.utils.linkButton(generalMessages.voteButton, client.config.links.vote)
        const row = client.utils.createButtonRow(supportButton, inviteButton, voteButton);

        return await ctx.sendMessage({ embeds: [embed], components: [row] });
    }
};
