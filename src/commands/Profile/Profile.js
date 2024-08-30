const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const GIFEncoder = require('gif-encoder-2');
const { formatUsername } = require('../../utils/Utils');
const Users = require('../../schemas/User');
const gif = require("../../utils/Gif");

// Define the external GIF link
const profileGifUrl = 'https://i.imgur.com/qIGIKt4.gif';

GlobalFonts.registerFromPath('./fonts/00357 Regular.ttf', 'Name');
GlobalFonts.registerFromPath('./fonts/00216 Regular.ttf', 'Text');

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
        let loadingMessage = null;
        try {
            const targetUser = ctx.isInteraction ? ctx.options.getUser('user') : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
            const userData = await Users.findOne({ userId: targetUser.id });

            const loadingScreen = [gif.loadingSleep, gif.loadingShower];
            const randomLoadingScreen = client.utils.getRandomElement(loadingScreen);
            const embed = client.embed()
                .setColor(client.color.main)
                .setDescription('**Generating your profile...**')
                .setImage(randomLoadingScreen);
            loadingMessage = await ctx.sendDeferMessage({
                embeds: [embed],
            });

            const width = 1080;
            const height = 720;
            const encoder = new GIFEncoder(width, height);
            const buffer = [];

            encoder.createReadStream().on('data', (chunk) => buffer.push(chunk));

            encoder.start();
            encoder.setRepeat(0);
            encoder.setDelay(500);
            encoder.setQuality(10); // Optional: adjust the quality

            const user = await client.users.fetch(userData.userId);
            const frames = 10;

            for (let i = 0; i < frames; i++) {
                const canvas = createCanvas(width, height);
                const context = canvas.getContext('2d');

                // Use the external GIF as background
                const background = await loadImage(profileGifUrl);
                drawBackground(context, background);

                if (userData.marriage.status === 'single') {
                    await drawSingle(context, '#000000', user, userData, i);
                }
                encoder.addFrame(context);
            }
            encoder.finish();

            const gifBuffer = Buffer.concat(buffer);
            const attachment = new AttachmentBuilder(gifBuffer, { name: `${ctx.author.displayName}.gif` });

            if (loadingMessage) {
                await loadingMessage.edit({
                    content: '',
                    files: [attachment],
                });
            }
        } catch (error) {
            if (loadingMessage) {
                await loadingMessage.edit({
                    content: 'An error occurred while generating your profile. Please try again later.',
                });
            } else {
                await ctx.sendMessage({
                    content: 'An error occurred while generating your profile. Please try again later.',
                });
            }
            console.error(error);
        }
    }
};

function drawBackground(ctx, background) {
    ctx.drawImage(background, 0, 0, 1080, 720);
}

async function drawSingle(ctx, color, user) {
    ctx.fillStyle = color;
    const userAvatar = await loadImage(user.displayAvatarURL({ format: 'png', size: 512 }));
    const userAvatarX = 30;
    const userAvatarY = 330;
    const userAvatarSize = 245;

    ctx.save();
    ctx.beginPath();
    ctx.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userAvatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
    ctx.restore();

    // User Name
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.font = '96px Name, sans-serif';
    ctx.fillText(formatUsername(user.username), 588, 455, 280);

    // Bio
    ctx.font = '24px Name, sans-serif';
    ctx.fillText(`${user?.profile?.bio ? `" ${user?.profile?.bio} "` : 'Not Set'}`, 612, 510, 280);

    // Instagram
    ctx.font = '24px Name, sans-serif';
    ctx.fillText(`${user?.profile?.instagram?.name ?? 'Not Set'}`, 742, 605, 280);

    // Facebook
    ctx.font = '24px Name, sans-serif';
    ctx.fillText(`${user?.profile?.facebook?.name ?? 'Not Set'}`, 742, 683, 280);
}
