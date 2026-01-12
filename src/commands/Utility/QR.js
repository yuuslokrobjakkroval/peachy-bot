const { Command } = require('../../structures/index.js');
const globalGif = require('../../utils/Gif.js');

module.exports = class QRCode extends Command {
    constructor(client) {
        super(client, {
            name: 'qr',
            description: {
                content: 'Display the QR code',
                examples: ['qr'],
                usage: 'qr',
            },
            category: 'utility',
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages'],
                user: ['SendMessages'],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const qrMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.qrMessages;

        const embed = client
            .embed()
            .setColor(color.main)
            .setTitle(qrMessages?.title || 'QR Code')
            .setDescription(qrMessages?.description || 'Select a currency to view the QR code:')
            .setImage(globalGif.qr)
            .setFooter({
                text: generalMessages?.requestedBy.replace('%{username}', ctx.author.displayName) || `Request By ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return ctx.isInteraction ? await ctx.interaction.reply({ embeds: [embed], flags: 0 }) : await ctx.reply({ embeds: [embed] });
    }
};
