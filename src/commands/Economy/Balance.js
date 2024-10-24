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
            cooldown: 5,
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

            const {coin = 0, bank = 0} = user.balance;

                const embed = client
                    .embed()
                    .setTitle(`${emoji.mainLeft} ${balanceMessages.title.replace('%{displayName}', ctx.author.displayName)} ${emoji.mainRight}`)
                    .setColor(color.main)
                    .setThumbnail(ctx.author.displayAvatarURL({dynamic: true, size: 1024}))
                    .setDescription(
                        balanceMessages.description
                            .replace('%{coinEmote}', emoji.coin)
                            .replace('%{coin}', client.utils.formatNumber(coin))
                            .replace('%{bankEmote}', emoji.bank)
                            .replace('%{bank}', client.utils.formatNumber(bank))
                    )
                    .setImage(gif.balanceBanner)
                    return ctx.sendMessage({embeds: [embed]});
                })
            } catch (error) {
                console.error('Error in Balance command:', error);
                const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
                return client.utils.sendErrorMessage(client, ctx, balanceMessages.errors.fetchFail, color);
            }
    }
};
