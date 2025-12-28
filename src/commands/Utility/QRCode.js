const { Command } = require('../../structures/index.js');
const globalGif = require('../../utils/Gif');
const globalEmoji = require('../../utils/Emoji');

module.exports = class QRCode extends Command {
    constructor(client) {
        super(client, {
            name: 'qr',
            description: {
                content: 'Display the QR code for KHR or USD',
                examples: ['qr khr', 'qr usd'],
                usage: 'qr <khr|usd>',
            },
            category: 'utility',
            aliases: ['qrcode'],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages'],
                user: ['SendMessages'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'currency',
                    description: 'Choose the currency for the QR code (kh/usd)',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'KH', value: 'khr' },
                        { name: 'USD', value: 'usd' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const qrMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.qrMessages; // Access qrMessages

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', globalEmoji.searching));
        }

        const currency = ctx.isInteraction ? ctx.interaction.options.getString('currency') : args[0].toLowerCase();

        let qrCodeUrl;
        if (currency === 'khr') {
            qrCodeUrl = globalGif.qrKH;
        } else if (currency === 'usd') {
            qrCodeUrl = globalGif.qrUSD;
        } else {
            return ctx.isInteraction
                ? await ctx.interaction.editReply({
                      content: qrMessages?.invalidOption || "Invalid option! Please use 'khr' or 'usd'.",
                      flags: 64,
                  })
                : await ctx.editMessage({
                      content: qrMessages?.invalidOption || "Invalid option! Please use 'khr' or 'usd'.",
                  });
        }

        const embed = client
            .embed()
            .setColor(color.main)
            .setTitle(qrMessages?.title.replace('%{currency}', currency.toUpperCase()) || `QR Code for ${currency.toUpperCase()}`)
            .setDescription(
                qrMessages?.description.replace('%{currency}', currency.toUpperCase()) ||
                    `Here is the QR code for ${currency.toUpperCase()}:`
            )
            .setImage(qrCodeUrl);

        return ctx.isInteraction
            ? await ctx.interaction.editReply({ content: '', embeds: [embed] })
            : await ctx.editMessage({ content: '', embeds: [embed] });
    }
};
