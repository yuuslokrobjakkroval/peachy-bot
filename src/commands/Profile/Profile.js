const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { formatUsername, splitToSpace, formatCapitalize } = require('../../utils/Utils');
const Users = require('../../schemas/user');
const gif = require('../../utils/Gif');

GlobalFonts.registerFromPath('./fonts/EmOne-SemiBold.ttf', 'EmOne-SemiBold');
GlobalFonts.registerFromPath('./fonts/EmOne-SemiBoldItalic.ttf', 'EmOne-SemiBoldItalic');

module.exports = class Profile extends Command {
    constructor(client) {
        super(client, {
            name: 'profile',
            description: {
                content: 'Shows the current xp, level, rank, and other details of a user',
                examples: ['profile @user'],
                usage: 'profile <user>',
            },
            category: 'social',
            aliases: ['profile', 'pf'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
            options: [{
                name: 'user',
                description: 'The user to view the profile of',
                type: 6,
                required: true,
            }],
        });
    }

    async run(client, ctx, args) {
        let loadingMessage;
        try {
            const targetUser = ctx.isInteraction ? ctx.options.getUser('user') : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
            const userData = await Users.findOne({ userId: targetUser.id });

            if (!userData) {
                const embed = client.embed()
                    .setColor(client.color.main)
                    .setDescription('User Not Found')
                loadingMessage = await ctx.sendMessage({
                    embeds: [embed],
                });
            } else if (userData.profile.visibility.status && targetUser.id !== ctx.author.id) {
                const embed = client.embed()
                    .setColor(client.color.main)
                    .setDescription(userData.profile.visibility.message ? userData.profile.visibility.message : 'This profile is private and cannot be viewed.')
                loadingMessage = await ctx.sendMessage({
                    embeds: [embed],
                });
            } else {
                const embed = client.embed()
                    .setColor(client.color.main)
                    .setDescription('**Generating your profile...**')
                    .setImage(gif.loadingScreen);
                loadingMessage = await ctx.sendDeferMessage({
                    embeds: [embed],
                });

                const canvas = createCanvas(1280, 720);
                const context = canvas.getContext('2d');
                // Background and gradient
                const backgroundImage = await loadImage('https://i.imgur.com/pKkVaQD.jpg');
                await drawBackground(context, backgroundImage);
                await drawSingleProfile(context, ctx, userData)

                const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: `${ctx.author.displayName}.png` });

                await loadingMessage?.edit({
                    content: '',
                    embeds: [],
                    files: [attachment],
                });
            }
        } catch (error) {
            await loadingMessage?.edit({
                content: 'An error occurred while generating your profile. Please try again later.',
                files: [],
            });
            console.error(error);
        }

    }
};

function drawBackground(ctx, bannerImage) {
    ctx.drawImage(bannerImage, 0, 0, 1280, 720);
}

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

async function drawSingleProfile(context, ctx, user) {

    const userAvatar = await loadImage(ctx.author.displayAvatarURL({ format: 'png', size: 256 }));
    const userAvatarX = 30;
    const userAvatarY = 40;
    const userAvatarSize = 168;
    context.save();
    context.beginPath();
    context.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    context.drawImage(userAvatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
    context.restore();

    const xpProgress = Math.min((user.profile.xp / user.profile.levelXp) * 100, 100);
    // User avatar

    // Draw rounded progress bar background
    context.fillStyle = '#AC7D67'; // Background color for the progress bar
    drawRoundedRect(context, 250, 150, 400, 30, 14); // Rounded rectangle for the progress bar
    context.fill();

    // Draw rounded progress bar foreground (filled part)
    context.fillStyle = '#8BD3DD';
    context.save();
    drawRoundedRect(context, 250, 150, (xpProgress / 100) * 400, 30, 14);
    context.clip();
    context.fillRect(250, 150, (xpProgress / 100) * 400, 30);
    context.restore();

    // Color
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 36px EmOne-SemiBoldItalic';
    context.fillText(formatUsername(ctx.author.username), 220, 75);

    context.font = '24px EmOne-SemiBoldItalic';
    context.fillText(formatCapitalize(user.profile.gender || 'Not Set'), 220, 125);
    context.fillText(formatCapitalize(user.profile.bio || 'Not Set'), 220, 175);
    context.fillText(formatCapitalize(splitToSpace(user.profile.birthday )|| 'Not Set'), 220, 225);

    context.font = '24px EmOne-SemiBold';
    context.fillText(`LEVEL ${user.profile.level || 1}`, 220, 250);
    context.fillText(`${user.profile.xp || 0}/${user.profile.levelXp || 1000}`, 400, 100);


    context.fillText(`ZODIAC SIGNS: ${user.zodiacSign || 'N/A'}`, 550, 50);

}


