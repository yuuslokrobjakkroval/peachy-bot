const { Command } = require('../../structures/index.js');
const gif = require('../../utils/Gif.js');

module.exports = class Balance extends Command {
    constructor(client) {
        super(client, {
            name: 'balance',
            description: {
                content: 'Displays your balance and daily transfer/receive limits.',
                examples: ['balance'],
                usage: 'balance',
            },
            category: 'economy',
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

    run(client, ctx, args, color, emoji, language) {
        try {
            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
            client.utils.getUser(ctx.author.id).then(user => {
                if (!user) {
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
                }
                const { coin = 0, bank = 0 } = user.balance;

                const embed = client.embed()
                    .setColor(color.main)
                    .setThumbnail(client.utils.emojiToImage(emoji.main))
                    .setDescription(
                        balanceMessages.description
                            .replace('%{mainLeft}', emoji.mainLeft)
                            .replace('%{mainRight}', emoji.mainRight)
                            .replace('%{coinEmote}', emoji.coin)
                            .replace('%{coin}', client.utils.formatNumber(coin))
                            .replace('%{bankEmote}', emoji.bank)
                            .replace('%{bank}', client.utils.formatNumber(bank))
                    )
                    .setImage(gif.balanceBanner)
                    .setFooter({
                        text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    })
                return ctx.sendMessage({embeds: [embed]});
            })
        } catch (error) {
            console.error('Error in Balance command:', error);
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
            return client.utils.sendErrorMessage(client, ctx, balanceMessages.errors.fetchFail, color);
        }
    }
};
