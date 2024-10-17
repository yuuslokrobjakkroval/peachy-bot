const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { formatUsername, splitToSpace, formatUpperCase } = require('../../utils/Utils');
const Users = require('../../schemas/user');
const { getZodiacSign } = require('../../functions/function');
const gif = require('../../utils/Gif');
const moment = require("moment");
const configOcean = require("../../theme/OceanBreeze/config");
const emojiOcean = require("../../theme/OceanBreeze/emojis");

GlobalFonts.registerFromPath('./fonts/00357 Regular.ttf', 'Name');
GlobalFonts.registerFromPath('./fonts/EmOne-SemiBold.ttf', 'EmOne-SemiBold');
GlobalFonts.registerFromPath('./fonts/EmOne-SemiBoldItalic.ttf', 'EmOne-SemiBoldItalic');

async function backgroundImages(userId, gender) {
    switch (userId) {
        case '966688007493140591':
            return gif.ownerBackgroundImage;
        case '946079190971732041':
            return gif.babeOwnerBackgroundImage;
        case '1279092605514285157':
            return gif.adminBackgroundImage;
        case '445540206763048961':
            return gif.worstLessBackgroundImage;
        case '1221843494973341758':
            return gif.snaBackgroundImage;
        case '1109137454591660032':
            return gif.akitoBackgroundImage;
        case '1266535973810868307':
            return gif.pyyyBackgroundImage;
        default:
            return gender === 'male' ? gif.maleBackgroundImage : gif.femaleBackgroundImage;
    }
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

    async run(client, ctx, args, color, emoji, language) {
        const pfMessages = language.locales.get(language.defaultLocale)?.profileMessages?.pfMessages;

        let loadingMessage;
        try {
            const targetUser = ctx.isInteraction ? ctx.options.getUser('user') : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
            const userData = await Users.findOne({ userId: targetUser.id });

            if (!userData) {
                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(pfMessages.userNotFound);
                loadingMessage = await ctx.sendMessage({
                    embeds: [embed],
                });
            } else if (userData.profile.visibility.status && targetUser.id !== ctx.author.id) {
                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(userData.profile.visibility.message ? userData.profile.visibility.message : pfMessages.privateProfile);
                loadingMessage = await ctx.sendMessage({
                    embeds: [embed],
                });
            } else {
                let loadingScreen = [gif.peachLoadingScreen, gif.gomaLoadingScreen];
                switch (userData && userData.preferences && userData.preferences.theme) {
                    case 't01':
                        loadingScreen = [gif.sunriseLoadingScreen, gif.seaLoadingScreen];
                        break;
                    case 't02':
                        loadingScreen = [gif.pjumbenFirstLoadingScreen, gif.pjumbenSecondLoadingScreen];
                        break;
                    case 'halloween':
                    case 't03':
                        loadingScreen = [gif.halloweenLoadingScreen, gif.ghostLoadingScreen];
                        break;
                    case 'st01':
                        loadingScreen = [gif.skyLoadingScreen, gif.birdLoadingScreen];
                        break;
                    case 'st02':
                        loadingScreen = [gif.treeLoadingScreen, gif.leapLoadingScreen];
                        break;
                    default:
                        break;
                }

                const randomLoadingScreen = client.utils.getRandomElement(loadingScreen);
                const embed = client.embed()
                    .setColor(color.main)
                    .setTitle(`**${emoji.mainLeft} 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 ${emoji.mainRight}**`)
                    .setDescription(pfMessages.loadingProfile)
                    .setImage(randomLoadingScreen);
                loadingMessage = await ctx.sendDeferMessage({
                    embeds: [embed],
                });

                await new Promise(resolve => setTimeout(resolve, 2000));

                const canvas = createCanvas(720, 400);
                const context = canvas.getContext('2d');
                const backgroundImage = await loadImage(await backgroundImages(targetUser.id, userData?.profile?.gender));
                const stickerImage = await loadImage(userData?.profile?.gender === 'male' ? 'https://i.imgur.com/QVC2s9Q.png' : 'https://i.imgur.com/KGVDMub.png');
                await drawBackground(context, backgroundImage);
                await drawProfile(context, client, targetUser, userData, '', emoji, stickerImage);

                const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: `${ctx.author.displayName}.png` });

                await loadingMessage.edit({
                    content: '',
                    embeds: [],
                    files: [attachment],
                });

                const emojiOptions = [
                    emoji.social.facebook,
                    emoji.social.instagram,
                    emoji.social.tiktok,
                ];

                const emojiMap = {
                    'facebook': emojiOptions[0]?.name || emojiOptions[0],
                    'instagram': emojiOptions[1]?.name || emojiOptions[1],
                    'tiktok': emojiOptions[2]?.name || emojiOptions[2],
                };

                for (const emoji of emojiOptions) {
                    await loadingMessage.react(emoji);
                }

                const filter = (reaction, user) => {
                    const reactionEmoji = reaction.emoji.toString();
                    const validReactions = Object.values(emojiMap);
                    return validReactions.includes(reactionEmoji) && user.id === ctx.author.id;
                };

                const collector = loadingMessage.createReactionCollector({ filter });

                collector.on('collect', async (reaction) => {
                    let responseMessage = '';
                    const reactionEmoji = reaction.emoji.toString();
                    const platform = Object.keys(emojiMap).find(key => emojiMap[key] === reactionEmoji);

                    switch (platform) {
                        case 'facebook':
                            responseMessage = userData.social.facebook.name && userData.social.facebook.link
                                ? pfMessages.socialMediaLink('Facebook', userData.social.facebook.link)
                                : `${targetUser.displayName} has not set a Facebook link.`;
                            break;
                        case 'instagram':
                            responseMessage = userData.social.instagram.name && userData.social.instagram.link
                                ? pfMessages.socialMediaLink('Instagram', userData.social.instagram.link)
                                : `${targetUser.displayName} has not set an Instagram link.`;
                            break;
                        case 'tiktok':
                            responseMessage = userData.social.tiktok.name && userData.social.tiktok.link
                                ? pfMessages.socialMediaLink('TikTok', userData.social.tiktok.link)
                                : `${targetUser.displayName} has not set a TikTok link.`;
                            break;
                    }

                    if (responseMessage) {
                        const embeds = client.embed()
                            .setTitle(`${emoji.mainLeft} ${client.utils.formatCapitalize(platform)} Link for ${targetUser.displayName} ${emoji.mainRight}`)
                            .setColor(color.main)
                            .setDescription(responseMessage);
                        const message = await ctx.sendMessage({ embeds: [embeds] });

                        // Delete the message after 5 seconds
                        setTimeout(() => {
                            message.delete().catch(err => console.error('Failed to delete message:', err));
                        }, 5000); // 5000 milliseconds = 5 seconds
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        ctx.sendMessage(pfMessages.reactionSessionEnded);
                    }
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
    ctx.drawImage(bannerImage, 0, 0, 720, 400);
}

async function drawProfile(context, client, ctx, user, userAvatarFrame, emoji, sticker) {
    // User avatar
    const userAvatar = await loadImage(ctx.displayAvatarURL({ format: 'png', size: 256 }));
    const userAvatarX = 113;
    const userAvatarY = 113;
    const userAvatarSize = 128;
    context.save();
    context.beginPath();
    context.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    context.drawImage(userAvatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
    context.restore();

    // Profile details
    context.fillStyle = '#fff';
    context.font = '30px EmOne-SemiBold';
    context.fillText(user.username, 270, 140); // Username
    context.font = '24px EmOne-SemiBold';
    context.fillText(user.discriminator, 270, 170); // Discriminator

    // Bio
    const bioMessage = user?.profile?.bio || pfMessages.defaultProfileBio;
    context.fillText(`Bio: ${bioMessage}`, 270, 210);

    // Birthday
    const birthdayMessage = user?.profile?.birthday ? moment(user.profile.birthday).format('MMMM Do YYYY') : pfMessages.defaultProfileBirthday;
    context.fillText(`Birthday: ${birthdayMessage}`, 270, 240);

    // Gender
    const genderMessage = user?.profile?.gender || pfMessages.noGenderInfo;
    context.fillText(`Gender: ${genderMessage}`, 270, 270);

    // Zodiac Sign
    const zodiacSign = getZodiacSign(user?.profile?.birthday) || pfMessages.noZodiacSign;
    context.fillText(`Zodiac Sign: ${zodiacSign}`, 270, 300);

    // Sticker
    context.drawImage(sticker, 580, 60, 80, 80);
}
