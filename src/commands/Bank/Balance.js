const { Command } = require('../../structures');
const globalGif = require('../../utils/Gif');

module.exports = class Balance extends Command {
    constructor(client) {
        super(client, {
            name: 'balance',
            description: {
                content: '𝑫𝒊𝒔𝒑𝒍𝒂𝒚𝒔 𝒚𝒐𝒖𝒓 𝒃𝒂𝒍𝒂𝒏𝒄𝒆',
                examples: ['𝒃𝒂𝒍𝒂𝒏𝒄𝒆'],
                usage: '𝒃𝒂𝒍𝒂𝒏𝒄𝒆',
            },
            category: 'bank',
            aliases: ['bal', 'money', 'cash'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;

            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const { coin = 0, bank = 0 } = user.balance;

            const embed = client.embed()
                .setColor(color.main)
                .setThumbnail(globalGif.balanceThumbnail ? globalGif.balanceThumbnail : client.utils.emojiToImage(emoji.main))
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐁𝐀𝐋𝐀𝐍𝐂𝐄")
                        .replace('%{mainRight}', emoji.mainRight) +
                    balanceMessages.description
                        .replace('%{coinEmote}', emoji.coin)
                        .replace('%{coin}', client.utils.formatNumber(coin))
                        .replace('%{bankEmote}', emoji.bank)
                        .replace('%{bank}', client.utils.formatNumber(bank))
                )
                .setImage(globalGif.balanceBanner)
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Balance command:', error);
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
            return client.utils.sendErrorMessage(client, ctx, balanceMessages.errors.fetchFail, color);
        }
    }
};
