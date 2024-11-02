const { Command } = require('../../structures/index.js');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

const balanceImagePath = path.join(__dirname, '../../data/images/Global/MITAOSWEET.png');

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
                const { coin = 0, bank = 0 } = user.balance;

                // Create the attachment
                const attachment = new AttachmentBuilder(balanceImagePath, { name: 'balance-image.png' });

                // Create the embed and reference the attached image
                const embed = client.embed()
                    .setColor(color.main)
                    .setThumbnail(client.utils.emojiToImage(emoji.main))
                    .setDescription(
                        balanceMessages.description
                            .replace('%{title}', 'BALANCE')
                            .replace('%{mainLeft}', emoji.mainLeft)
                            .replace('%{mainRight}', emoji.mainRight)
                            .replace('%{coinEmote}', emoji.coin)
                            .replace('%{coin}', client.utils.formatNumber(coin))
                            .replace('%{bankEmote}', emoji.bank)
                            .replace('%{bank}', client.utils.formatNumber(bank))
                    )
                    .setImage('attachment://balance-image.png')  // Reference the attachment here
                    .setFooter({
                        text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                return ctx.sendMessage({ embeds: [embed], files: [attachment] });
            });
        } catch (error) {
            console.error('Error in Balance command:', error);
            const balanceMessages = language.locales.get(language.defaultLocale)?.economyMessages?.balanceMessages;
            return client.utils.sendErrorMessage(client, ctx, balanceMessages.errors.fetchFail, color);
        }
    }
};
