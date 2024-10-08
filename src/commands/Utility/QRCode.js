const { Command } = require("../../structures/index.js");
const gif = require("../../utils/Gif.js");

module.exports = class QRCode extends Command {
    constructor(client) {
        super(client, {
            name: "qr",
            description: {
                content: "Display the QR code for KH or USD",
                examples: ["qr kh", "qr usd"],
                usage: "qr <kh|usd>",
            },
            category: "utility",
            aliases: ["qrcode"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages"],
                user: ["SendMessages"],
            },
            slashCommand: true,
            options: [
                {
                    name: "currency",
                    description: "Choose the currency for the QR code (kh/usd)",
                    type: 3,
                    required: true,
                    choices: [
                        { name: "KH", value: "kh" },
                        { name: "USD", value: "usd" }
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const currency = ctx.isInteraction
            ? ctx.interaction.options.getString('currency')
            : args[0].toLowerCase();

        let qrCodeUrl;
        if (currency === 'kh') {
            qrCodeUrl = gif.qrKH;
        } else if (currency === 'usd') {
            qrCodeUrl = gif.qrUSD;
        } else {
            return ctx.sendMessage({ content: "Invalid option! Please use 'kh' or 'usd'.", ephemeral: true });
        }

        const embed = client.embed()
            .setColor(color.main)
            .setTitle(`QR Code for ${currency.toUpperCase()}`)
            .setDescription(`Here is the QR code for ${currency.toUpperCase()}:`)
            .setImage(qrCodeUrl);

        // Send the embed containing the QR code
        await ctx.sendMessage({ embeds: [embed] });
    }
};
