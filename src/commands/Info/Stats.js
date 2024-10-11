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
            category: 'info',
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

    async run(client, ctx, args, color, emoji, language) {
        const statsMessages = language.locales.get(language.defaultLocale)?.statsMessages;

        const guildCount = client.guilds.cache.size;
        const userCount = client.users.cache.size;
        const channelCount = client.channels.cache.size;
        const uptime = Math.floor(client.uptime / 1000 / 60); // Bot uptime in minutes

        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(statsMessages.title.replace('{botName}', client.user.username)) // Replace {botName} with actual bot name
            .setDescription(statsMessages.description.replace('{botName}', client.user.username)) // Replace {botName}
            .addFields([
                { name: statsMessages.fields.servers.replace('{guildCount}', guildCount), value: '\u200b', inline: false },
                { name: statsMessages.fields.users.replace('{userCount}', userCount), value: '\u200b', inline: false },
                { name: statsMessages.fields.channels.replace('{channelCount}', channelCount), value: '\u200b', inline: false },
                { name: statsMessages.fields.uptime.replace('{uptime}', uptime), value: '\u200b', inline: false }
            ])
            .setFooter({ text: statsMessages.footer });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('support-link').setLabel('Click for Support').setStyle(ButtonStyle.Primary),
            // new ButtonBuilder().setLabel('Invite Me!').setStyle(ButtonStyle.Link).setURL(client.config.links.invite),
            // new ButtonBuilder().setLabel('Vote for Me').setStyle(ButtonStyle.Link).setURL(client.config.links.vote)
        );

        return await ctx.sendMessage({ embeds: [embed], components: [row] });
    }
};
