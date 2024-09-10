const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const gif = require("../../utils/Gif");

module.exports = class Level extends Command {
    constructor(client) {
        super(client, {
            name: 'level',
            description: {
                content: 'Displays your level and XP progress.',
                examples: ['level'],
                usage: 'level',
            },
            category: 'profile',
            aliases: ['lvl', 'xp'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AttachFiles'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, language) {
        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.');
            }

            // Extract XP, level, and level experience
            const { xp = 0, level = 1, levelExp = 1000 } = user.profile;
            const xpProgress = Math.min((xp / levelExp) * 100, 100);

            // Generate the level image using Canvas
            const canvas = createCanvas(700, 250);
            const ctxCanvas = canvas.getContext('2d');

            // Background image
            const background = await loadImage(gif.welcomeThree);
            ctxCanvas.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Function to draw a rounded rectangle
            function drawRoundedRect(ctx, x, y, width, height, radius) {
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
            }

            // Draw rounded avatar
            const avatar = await loadImage(ctx.author.displayAvatarURL({ format: 'png' }));
            ctxCanvas.save();
            ctxCanvas.beginPath();
            ctxCanvas.arc(60 + 128 / 2, 60 + 128 / 2, 128 / 2, 0, Math.PI * 2, true); // x, y are the center of the circle, and 128 is the radius
            ctxCanvas.closePath();
            ctxCanvas.clip();
            ctxCanvas.drawImage(avatar, 60, 60, 128, 128); // Draw avatar with 256px width and height
            ctxCanvas.restore();

            // Add level text
            ctxCanvas.font = '40px sans-serif';
            ctxCanvas.fillStyle = '#F582AE';
            ctxCanvas.fillText(`Level: ${level}`, 250, 60);

            // Add XP progress text
            ctxCanvas.font = '30px sans-serif';
            ctxCanvas.fillStyle = '#F582AE';
            ctxCanvas.fillText(`XP: ${xp} / ${levelExp}`, 250, 120);

            // Draw rounded progress bar background
            ctxCanvas.fillStyle = '#AC7D67'; // Background color for the progress bar
            drawRoundedRect(ctxCanvas, 250, 150, 400, 30, 14); // Rounded rectangle for the progress bar
            ctxCanvas.fill();

            // Draw rounded progress bar foreground (filled part)
            ctxCanvas.fillStyle = '#8BD3DD'; // Foreground color (progress fill)
            ctxCanvas.save();
            drawRoundedRect(ctxCanvas, 250, 150, (xpProgress / 100) * 400, 30, 14); // Rounded rectangle for the filled part
            ctxCanvas.clip();
            ctxCanvas.fillRect(250, 150, (xpProgress / 100) * 400, 30);
            ctxCanvas.restore();

            // Convert to an attachment
            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'level-image.png' });

            // Send the embed with the image
            const embed = client.embed()
                .setTitle(`${client.emoji.mainLeft} ${ctx.author.displayName}'s Level ${client.emoji.mainRight}`)
                .setColor(client.color.main)
                .setDescription(`**Level:** ${level}\n**XP:** ${xp} / ${levelExp}\n**Progress:** ${xpProgress.toFixed(2)}%`)
                .setImage('attachment://level-image.png');

            await ctx.message.channel.send({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error('Error in Level command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching your level.');
        }
    }
};
