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
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
        }

        const users = await Users.find();
        const guildCount = client.guilds.cache.size;
        const userCount = users ? users.length : client.users.cache.size;
        const channelCount = client.channels.cache.size;
        const uptime = Math.floor(client.uptime / 1000 / 60);

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
                { name: statsMessages.fields.uptime.replace('{arrow}', globalEmoji.arrow).replace('{uptime}', uptime), value: '\u200b', inline: false }
            ])
            .setFooter({ text: statsMessages.footer });

        const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support)
        const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite)
        // const voteButton = client.utils.linkButton(generalMessages.voteButton, client.config.links.vote)
        const row = client.utils.createButtonRow(supportButton, inviteButton);

        return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed], components: [row] }) : await ctx.editMessage({ content: "", embeds: [embed], components: [row] });

    }
};
