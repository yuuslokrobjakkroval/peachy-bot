const Command = require('../../structures/Command.js');
const Users = require('../../schemas/user');

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
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const statsMessages = language.locales.get(language.defaultLocale)?.informationMessages?.statsMessages;

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search);
        } else {
            await ctx.sendDeferMessage(generalMessages.search);
        }

        const users = await Users.find();
        const guildCount = client.guilds.cache.size;
        const userCount = users ? users.length : client.users.cache.size;
        const channelCount = client.channels.cache.size;
        const uptime = Math.floor(client.uptime / 1000 / 60); // Bot uptime in minutes

        const embed = client.embed()
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

        const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support)
        const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite)
        // const voteButton = client.utils.linkButton(generalMessages.voteButton, client.config.links.vote)
        const row = client.utils.createButtonRow(supportButton, inviteButton);

        return ctx.isInteraction ? await ctx.interaction.editReply({ embeds: [embed], components: [row] }) : await ctx.editMessage({ embeds: [embed], components: [row] });

    }
};
