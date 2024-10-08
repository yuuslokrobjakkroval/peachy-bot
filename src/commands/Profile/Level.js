const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const gif = require("../../utils/Gif");
const {formatUsername} = require("../../utils/Utils");

GlobalFonts.registerFromPath('./fonts/EmOne-SemiBold.ttf', 'EmOne-SemiBold');
GlobalFonts.registerFromPath('./fonts/EmOne-SemiBoldItalic.ttf', 'EmOne-SemiBoldItalic');

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

    async run(client, ctx, args, color, emoji, language) {
        let loadingMessage;
        try {
            const loadingScreen = [gif.peachLoadingScreen, gif.gomaLoadingScreen];
            const randomLoadingScreen = client.utils.getRandomElement(loadingScreen);
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`**${emoji.mainLeft} 𝐋𝐄𝐕𝐄𝐋 ${emoji.mainRight}**`)
                .setDescription('**Generating your level...**')
                .setImage(randomLoadingScreen);
            loadingMessage = await ctx.sendDeferMessage({
                embeds: [embed],
            });
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.', color);
            }

            // Extract XP, level, and level experience
            const { xp = 0, level = 1, levelXp = 1000 } = user.profile;
            const xpProgress = Math.min((xp / levelXp) * 100, 100);

            // Generate the level image using Canvas
            const canvas = createCanvas(720, 400);
            const ctxCanvas = canvas.getContext('2d');

            // Background image
            const background = await loadImage(gif.levelBackground);
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
            ctxCanvas.arc(60 + 196 / 2, 60 + 196 / 2, 196 / 2, 0, Math.PI * 2, true); // x, y are the center of the circle, and 128 is the radius
            ctxCanvas.closePath();
            ctxCanvas.clip();
            ctxCanvas.drawImage(avatar, 60, 60, 196, 196); // Draw avatar with 256px width and height
            ctxCanvas.restore();

            ctxCanvas.beginPath();
            ctxCanvas.arc(60 + 196 / 2, 60 + 196 / 2, 196 / 2 + 2, 0, Math.PI * 2, true); // Slightly larger circle
            ctxCanvas.lineWidth = 6;
            ctxCanvas.strokeStyle = '#AC7D67';
            ctxCanvas.stroke();

            // Add Username
            ctxCanvas.fillStyle = '#000000';
            ctxCanvas.textAlign = 'center';
            ctxCanvas.font = 'bold italic 32px EmOne-SemiBoldItalic';
            ctxCanvas.fillText(formatUsername(ctx.author.username), 158, 308);

            // Add level text
            ctxCanvas.font = 'bold italic 30px EmOne-SemiBoldItalic';
            ctxCanvas.textAlign = 'left';
            ctxCanvas.fillText(`Level: ${level}`, 280, 106);

            // Add XP progress text
            ctxCanvas.font = 'bold italic 30px EmOne-SemiBoldItalic';
            ctxCanvas.textAlign = 'left';
            ctxCanvas.fillText(`XP: ${xp} / ${levelXp}`, 280, 166);

            // Draw rounded progress bar background
            ctxCanvas.fillStyle = '#AC7D67'; // Background color for the progress bar
            drawRoundedRect(ctxCanvas, 280, 196, 400, 35, 16); // Rounded rectangle for the progress bar
            ctxCanvas.fill();

            // Draw rounded progress bar foreground (filled part)
            ctxCanvas.fillStyle = '#8BD3DD'; // Foreground color (progress fill)
            ctxCanvas.save();
            drawRoundedRect(ctxCanvas, 280, 196, (xpProgress / 100) * 400, 35, 16); // Rounded rectangle for the filled part
            ctxCanvas.clip();
            ctxCanvas.fillRect(280, 196, (xpProgress / 100) * 400, 35);
            ctxCanvas.restore();

            // Convert to an attachment
            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'level-image.png' });

            await loadingMessage.edit({
                content: '',
                embeds: [],
                files: [attachment],
            });
        } catch (error) {
            console.error('Error in Level command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching your level.', color);
        }
    }
};
