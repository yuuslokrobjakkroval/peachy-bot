const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = class Stats extends Command {
    constructor(client) {
        super(client, {
            name: 'stats',
            description: {
                content: 'Displays statistics about the bot.',
                examples: ['stats'],
                usage: 'stats',
            },
            category: 'information',
            aliases: ['botstats', 'statistics'],
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
        const guildCount = client.guilds.cache.size;
        const userCount = client.users.cache.size;
        const channelCount = client.channels.cache.size;
        const uptime = Math.floor(client.uptime / 1000 / 60); // Bot uptime in minutes

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`${client.user.username}'s Statistics`)
            .setDescription(
                `Here are some statistics about ${client.user.username}:\n\n` +
                `**Servers:** ${guildCount}\n` +
                `**Users:** ${userCount}\n` +
                `**Channels:** ${channelCount}\n` +
                `**Uptime:** ${uptime} minutes`
            )
            .setFooter({ text: 'For more information, click the buttons below.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('support-link').setLabel('Click for Support').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel('Invite Me!').setStyle(ButtonStyle.Link).setURL(client.config.links.invite),
            new ButtonBuilder().setLabel('Vote for Me').setStyle(ButtonStyle.Link).setURL(client.config.links.vote)
        );

        return await ctx.sendMessage({ embeds: [embed], components: [row] });
    }
};