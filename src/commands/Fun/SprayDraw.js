const Command = require('../../structures/Command.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

module.exports = class SprayDraw extends Command {
    constructor(client) {
        super(client, {
            name: 'spraydraw',
            description: {
                content: 'Create a spray paint style drawing with your message! (Max 10 characters)',
                examples: ['spraydraw Hello', 'spraydraw Hi'],
                usage: 'spraydraw <message>',
            },
            category: 'fun',
            aliases: ['spray', 'draw', 'd'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'AttachFiles'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'message',
                    type: 3,
                    description: 'Your message to spray paint (max 10 characters)',
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            if (ctx.isInteraction) {
                await ctx.interaction.reply("Spraying your message...");
            } else {
                await ctx.sendDeferMessage("Spraying your message...");
            }

            let message = ctx.options?.getString('message') || args.join(' ');
            if (!message) {
                return client.utils.sendErrorMessage(client, ctx, "Please provide a message to spray paint!", color, 2 * 60 * 60);
            }

            // Limit message length to 10 characters
            if (message.length > 10) {
                return client.utils.sendErrorMessage(client, ctx, "Message must be 10 characters or less!", color, 2 * 60 * 60);
            }

            // Create canvas
            const width = 256;
            const height = 128;
            const radius = 16;
            const canvas = createCanvas(width, height);
            const context = canvas.getContext('2d');

            // Draw background image with rounded corners
            const bannerImage = await loadImage('https://i.imgur.com/VTQw24C.jpg');
            context.save();
            context.beginPath();
            context.moveTo(radius, 0);
            context.arcTo(width, 0, width, height, radius);
            context.arcTo(width, height, 0, height, radius);
            context.arcTo(0, height, 0, 0, radius);
            context.arcTo(0, 0, width, 0, radius);
            context.closePath();
            context.clip();
            context.drawImage(bannerImage, 0, 0, width, height);
            context.restore();

            // Get list of registered font families
            const registeredFonts = GlobalFonts.families.map(family => family.name); // Extract font names
            if (registeredFonts.length === 0) {
                throw new Error("No fonts registered. Please register fonts using GlobalFonts.registerFromPath().");
            }

            // Spray paint effect with dynamic font and random colors
            for (let i = 0; i < 3; i++) {
                context.font = `bold italic 36px Graffierz Poison Shadow`;
                context.fillStyle = '#854836';

                // Center the text horizontally
                const textMetrics = context.measureText(message);
                const textWidth = textMetrics.width;
                const xPosition = (width - textWidth) / 2;
                const yPosition = height / 2 + 20;

                context.fillText(message, xPosition, yPosition);
            }

            // Convert to buffer
            const buffer = canvas.toBuffer('image/png');
            // Send the result
            const attachment = {
                attachment: buffer,
                name: `spraydraw-${ctx.author.id}.png`
            };

            ctx.isInteraction
                ? await ctx.interaction.editReply({ content: '', files: [attachment] })
                : await ctx.editMessage({ content: '', files: [attachment] });

        } catch (error) {
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while creating your spray drawing. Please try again later.');
            console.error(error);
        }
    }
};