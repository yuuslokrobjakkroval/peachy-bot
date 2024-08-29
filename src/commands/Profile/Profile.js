const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const moment = require('moment');
const { formatUsername, splitToSpace, formatCapitalize } = require('../../utils/Utils');
const Users = require('../../schemas/User');
const gif = require('../../utils/Gif');
const ShopItems = require('../../assets/inventory/ShopItems');
const AvatarItems = ShopItems.flatMap(shop => shop.inventory).filter(value => value.type === 'avatar');
const RingItems = ShopItems.flatMap(shop => shop.inventory).filter(value => value.type === 'ring');
const wallpaperItems = ShopItems.flatMap(shop => shop.inventory).filter(value => value.type === 'wallpaper');

GlobalFonts.registerFromPath('./fonts/00357 Regular.ttf', 'Name');
GlobalFonts.registerFromPath('./fonts/00216 Regular.ttf', 'Text');

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

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

                const loadingScreen = [gif.system_loading_screen, gif.text_loading_screen, gif.cat_loading_screen, gif.clock_loading_screen, gif.duration_loading_screen];
                const randomLoadingScreen = getRandomElement(loadingScreen);
                const embed = client.embed()
                    .setColor(client.color.main)
                    .setDescription('**Generating your profile...**')
                    .setImage(randomLoadingScreen);
                loadingMessage = await ctx.sendDeferMessage({
                    embeds: [embed],
                });

                const bannerItem = userData.equip.find(e => e.item.startsWith('pf'));
                const decorationItem = userData.equip.find(e => e.item.startsWith('d'));
                const image = wallpaperItems.find(w => w.id === bannerItem?.item);
                const avatarDecoration = AvatarItems.find(w => w.id === decorationItem?.item);
                const canvas = createCanvas(1080, 720);
                const context = canvas.getContext('2d');
                const color = '#000000';

                if (userData.marriage.status === 'single') {
                    const avatarFrame = avatarDecoration ? await loadImage(avatarDecoration.image) : null;
                    const profileImg = image?.able?.relationship?.includes('single') ? image?.bgImage : gif.defaultProfile
                    const background = await loadImage(profileImg);
                    const user = await client.users.fetch(userData.userId);
                    drawBackground(context, background);
                    await drawSingle(context, color, user, userData, avatarFrame);
                } else {
                    const user = await client.users.fetch(userData.userId);
                    const partner = await client.users.fetch(userData.marriage.marriedTo);
                    const profileImg = image?.able?.relationship?.includes('married') ? image?.bgImage : gif.defaultMarryProfile
                    const background = await loadImage(profileImg);
                    drawBackground(context, background);
                    await drawRelationship(context, color, client, ctx, user, userData, partner);
                }

                const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: `${ctx.author.displayName}.png` });

                await loadingMessage.edit({
                    content: '',
                    embeds: [],
                    files: [attachment],
                });
            }
        } catch (error) {
            await loadingMessage.edit({
                content: 'An error occurred while generating your profile. Please try again later.',
                files: [],
            });
            console.error(error);
        }

    }
};

function drawBackground(ctx, background) {
    ctx.drawImage(background, 0, 0, 1080, 720);
}

async function drawSingle(canvas, color, ctx, user) {
    canvas.fillStyle = color;

    // Load User Avatar
    const userAvatar = await loadImage(ctx.displayAvatarURL({ format: 'png', size: 512 }));
    const userAvatarX = 30;
    const userAvatarY = 330;
    const userAvatarSize = 245;

    const avatarFrame = await loadImage(gif.chongyun);
    const ddMasterLeft = await loadImage(gif.ddMasterLeft);
    const ddMasterRight = await loadImage(gif.ddMasterRight);

    // Draw Circular Avatar
    canvas.save();
    canvas.beginPath();
    canvas.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2, 0, Math.PI * 2, true);
    canvas.closePath();
    canvas.clip();
    canvas.drawImage(userAvatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
    canvas.restore();

    // Add Avatar Decoration
    canvas.drawImage(avatarFrame, 25, 323, 256, 256);

    // User Name
    canvas.textAlign = 'center';
    canvas.lineWidth = 6;
    canvas.font = '96px Name, sans-serif';
    canvas.fillText(formatUsername(ctx.username), 588, 455, 280);

    // Bio
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`${user?.profile?.bio ? `" ${user?.profile?.bio} "` : 'Not Set'}`, 612, 510, 280);

    // Instagram
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`${user?.profile?.instagram?.name ?? 'Not Set'}`, 742, 605, 280);

    // Facebook
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`${user?.profile?.facebook?.name ?? 'Not Set'}`, 742, 683, 280);

    // DD Master Left and Right
    canvas.drawImage(ddMasterLeft, 388, 571, 128, 128);
    canvas.drawImage(ddMasterRight, 916, 571, 128, 128);

    // Relationship
    canvas.textAlign = 'left';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`This user is currently ${formatCapitalize(user?.marriage?.status) ?? ''}`, 20, 618, 280);

    // Birthday
    canvas.textAlign = 'center';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`${splitToSpace(user?.profile?.birthday ?? 'Not Set')}`, 170, 675, 280);
}

async function drawRelationship(canvas, color, client, ctx, user, userData, partner) {
    canvas.fillStyle = color;
    canvas.font = '36px Name, sans-serif';

    const userAvatar = await loadImage(user.displayAvatarURL({ format: 'png', size: 512 }));
    const userAvatarX = 40;
    const userAvatarY = 340;
    const userAvatarSize = 168;

    const partnerAvatar = await loadImage(partner.displayAvatarURL({ format: 'png', size: 512 }));
    const partnerAvatarX = 290;
    const partnerAvatarY = 340;
    const partnerAvatarSize = 168;

    const ring = RingItems.find(({ id }) => id === userData.marriage.item);
    const ringAvatar = await loadImage(userData.marriage.item ? client.utils.emojiToImage(ring.emoji) : 'https://imgur.com/71QbroB.png');
    const daysMarriedString = moment().diff(userData.marriage.dateOfRelationship, 'days');

    const emoji = await loadImage(gif.emojiMarryProfile);

    // User Avatar
    canvas.save();
    canvas.beginPath();
    canvas.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2, 0, Math.PI * 2, true);
    canvas.closePath();
    canvas.clip();
    canvas.drawImage(userAvatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
    canvas.restore();

    // User Avatar Decoration
    canvas.beginPath();
    canvas.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2 + 2, 0, Math.PI * 2, true); // Slightly larger circle
    canvas.lineWidth = 4;
    canvas.strokeStyle = color.main;
    canvas.stroke();

    // User Name
    canvas.textAlign = 'center';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(formatUsername(user.username ?? 'Not Set'), 115, 550, 280);

    // User Bio
    canvas.textAlign = 'center';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`${user?.profile?.bio ? `" ${user?.profile?.bio} "` : 'Not Set'}`, 751, 648, 280);

    // Partner Avatar
    canvas.save();
    canvas.beginPath();
    canvas.arc(partnerAvatarX + partnerAvatarSize / 2, partnerAvatarY + partnerAvatarSize / 2, partnerAvatarSize / 2, 0, Math.PI * 2, true);
    canvas.closePath();
    canvas.clip();
    canvas.drawImage(partnerAvatar, partnerAvatarX, partnerAvatarY, partnerAvatarSize, partnerAvatarSize);
    canvas.restore();

    // Partner Avatar Decoration
    canvas.beginPath();
    canvas.arc(partnerAvatarX + partnerAvatarSize / 2, partnerAvatarY + partnerAvatarSize / 2, partnerAvatarSize / 2 + 2, 0, Math.PI * 2, true); // Slightly larger circle
    canvas.lineWidth = 4;
    canvas.strokeStyle = color.main;
    canvas.stroke();

    // Partner Name
    canvas.textAlign = 'left';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(formatUsername(partner.username), 295, 550, 280);

    // DD Master Emoji
    canvas.drawImage(emoji, 672, 359, 168, 168);

    // Relationship
    canvas.textAlign = 'center';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(formatCapitalize(userData?.marriage?.status !== 'single' ? 'In a relationship' : 'Single'), 658, 573, 280);

    // Relationship Date
    canvas.textAlign = 'center';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(moment(userData?.marriage?.dateOfRelationship).format('DD MMM YYYY') || 'Not Set', 894, 573, 280)

    // Ring
    canvas.drawImage(ringAvatar, 182, 553, 128, 128);

    // Day Of Relationship
    canvas.textAlign = 'center';
    canvas.font = '24px Name, sans-serif';
    canvas.fillText(`${formatCapitalize(userData?.marriage?.status ?? 'Not Set')} ${daysMarriedString > 1 ? `${daysMarriedString} Days` : `${daysMarriedString} Day`}`, 245, 705, 280);
}
