const Command = require('../../structures/Command.js');
const Users = require('../../schemas/user');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Stats extends Command {
    constructor(client) {
        super(client, {
            name: 'stats',
            description: {
                content: '𝑫𝒊𝒔𝒑𝒍𝒂𝒚𝒔 𝒔𝒕𝒂𝒕𝒊𝒔𝒕𝒊𝒄𝒔 𝒂𝒃𝒐𝒖𝒕 𝒕𝒉𝒆 𝒃𝒐𝒕.',
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
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        const users = await Users.find();
        const guildCount = client.guilds.cache.size;
        const userCount = users ? users.length : client.users.cache.size;
        const channelCount = client.channels.cache.size;

        // Calculate uptime in days, hours, and minutes
        const totalSeconds = Math.floor(client.uptime / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        // Replace placeholders in the uptime string
        const uptimeString = statsMessages.fields.uptime
            .replace('{arrow}', globalEmoji.arrow)
            .replace('{days}', days)
            .replace('{hours}', hours)
            .replace('{minutes}', minutes);

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', statsMessages.title)
                    .replace('%{mainRight}', emoji.mainRight) +
                statsMessages.description)
            .addFields([
                { name: statsMessages.fields.servers.replace('{arrow}', globalEmoji.arrow).replace('{guildCount}', guildCount), value: '\u200b', inline: false },
                { name: statsMessages.fields.users.replace('{arrow}', globalEmoji.arrow).replace('{userCount}', userCount), value: '\u200b', inline: false },
                { name: statsMessages.fields.channels.replace('{arrow}', globalEmoji.arrow).replace('{channelCount}', channelCount), value: '\u200b', inline: false },
                { name: uptimeString, value: '\u200b', inline: false }
            ])
            .setFooter({ text: statsMessages.footer });

        const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support);
        const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite);
        const row = client.utils.createButtonRow(supportButton, inviteButton);

        return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed], components: [row] }) : await ctx.editMessage({ content: "", embeds: [embed], components: [row] });
    }
};