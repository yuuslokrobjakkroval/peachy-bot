const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Users = require('../../schemas/User.js');

module.exports = class Register extends Command {
    constructor(client) {
        super(client, {
            name: 'register',
            description: {
                content: 'Register yourself to start using bot features.',
                examples: ['register'],
                usage: 'register',
            },
            category: 'user',
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

    async run(client, ctx) {
        const user = await Users.findOne({ userId: ctx.author.id }).exec();
        if (user) {
            return await ctx.sendMessage({
                embeds: [
                    this.client.embed()
                        .setColor(this.client.color.red)
                        .setTitle('Already Registered')
                        .setDescription('You are already registered. If you need assistance, please contact an admin.')
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
            .setColor(this.client.color.main)
            .setTitle('Registration Successful')
            .setDescription(`You have been successfully registered, ${ctx.author.username}! You can now start using all features of the bot.`)
            .setFooter({ text: 'If you need help or have questions, use the commands below.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('support-link').setLabel('Click for Support').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel('Invite Me!').setStyle(ButtonStyle.Link).setURL(client.config.links.invite),
            new ButtonBuilder().setLabel('Vote for Me').setStyle(ButtonStyle.Link).setURL(client.config.links.vote)
        );

        return await ctx.sendMessage({ embeds: [embed], components: [row] });
    }
};
