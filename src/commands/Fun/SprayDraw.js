const Command = require('../../structures/Command.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = class SprayDraw extends Command {
    constructor(client) {
        super(client, {
            name: 'spraydraw',
            description: {
                content: 'Create a spray paint style drawing with your message!',
                examples: ['spraydraw Hello, world!'],
                usage: 'spraydraw <message>',
            },
            category: 'fun',
            aliases: ['spray'],
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
                    description: 'Your message to spray paint',
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

            const message = ctx.options?.getString('message') || args.join(' ');
            if (!message) {
                return client.utils.sendErrorMessage(client, ctx, "Please provide a message to spray paint!", color, 2 * 60 * 60);
            }

            // Create canvas
            const canvas = createCanvas(800, 400);
            const context = canvas.getContext('2d');

            // Dim background
            context.fillStyle = '#2b2d31';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Spray paint effect background
            context.fillStyle = 'rgba(50, 50, 50, 0.8)';
            context.beginPath();
            context.roundRect(50, 50, 700, 300, 20);
            context.fill();

            // User avatar (simplified circle)
            const avatar = await loadImage(ctx.author.displayAvatarURL());
            context.save();
            context.beginPath();
            context.arc(100, 100, 40, 0, Math.PI * 2);
            context.closePath();
            context.clip();
            context.drawImage(avatar, 60, 60, 80, 80);
            context.restore();

            // Spray paint style text
            context.font = '48px "Graffierz Poison Shadow"';

            // Spray paint effect (multiple layers for depth)
            const sprayColors = ['#ff4444', '#ff6666', '#ffffff'];
            for (let i = 0; i < sprayColors.length; i++) {
                context.fillStyle = sprayColors[i];
                context.fillText(message, 160, 220 + (i * 2));
                context.fillText(`${ctx.author.username}`, 160, 150 + (i * 2));
            }

            // Verified badge if applicable
            const user = await client.utils.getUser(ctx.author.id);
            if (user.verification.verify.status === 'verified') {
                context.fillStyle = '#ffffff';
                context.beginPath();
                context.arc(250, 130, 15, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = '#5865F2';
                context.font = '20px sans-serif';
                context.fillText('✓', 245, 138);
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