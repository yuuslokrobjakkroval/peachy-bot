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
        const registerMessages = language.locales.get(language.defaultLocale)?.registerMessages;
        const user = await Users.findOne({ userId: ctx.author.id }).exec();

        if (user) {
            return await ctx.sendMessage({
                embeds: [
                    this.client.embed()
                        .setColor(color.red)
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

        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(registerMessages.titleRegistrationSuccessful)
            .setDescription(registerMessages.registrationSuccessful.replace('{username}', ctx.author.username))
            .setFooter({ text: registerMessages.footer });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('support-link').setLabel('Click for Support').setStyle(ButtonStyle.Primary),
            // Uncomment below lines if you want to add more buttons
            // new ButtonBuilder().setLabel('Invite Me!').setStyle(ButtonStyle.Link).setURL(client.config.links.invite),
            // new ButtonBuilder().setLabel('Vote for Me').setStyle(ButtonStyle.Link).setURL(client.config.links.vote)
        );

        return await ctx.sendMessage({ embeds: [embed], components: [row] });
    }
};
