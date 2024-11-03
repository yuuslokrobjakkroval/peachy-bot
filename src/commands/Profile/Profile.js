const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const ShopItems = require('../../assets/inventory/ShopItems');
const moment = require("moment");
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Wallpapers = inventory.filter(value => value.type === 'wallpaper');

GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-Roman.otf', 'Kelvinch-Roman');
GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-Bold.otf', 'Kelvinch-Bold');
GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-BoldItalic.otf', 'Kelvinch-SemiBoldItalic');

module.exports = class Profile extends Command {
    constructor(client) {
        super(client, {
            name: 'profile',
            description: {
                content: 'Shows the current XP, level, rank, and other details of a user',
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
        let loadingMessage;
        try {
            const targetUser = this.getTargetUser(ctx, args);
            const user = await client.utils.getUser(targetUser.id);

            if (!user) {
                return await this.sendUserNotFoundEmbed(ctx, color);
            }

            loadingMessage = await this.sendLoadingMessage(ctx, color, emoji);

            const equippedWallpaper = user.equip.find(equippedItem => equippedItem.id.startsWith('w'));
            let bannerImage;
            if (equippedWallpaper) {
                bannerImage = Wallpapers.find(wallpaperItem => wallpaperItem.id === equippedWallpaper.id)?.image;
            } else {
                bannerImage = 'https://i.imgur.com/8rZFeWI.jpg';
            }


            const canvas = createCanvas(1180, 600);
            const context = canvas.getContext('2d');

            await this.drawProfile(client, context, targetUser, user, color, emoji, bannerImage);

            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: `${ctx.author.username}.png` });

            await loadingMessage.edit({
                content: '',
                embeds: [],
                files: [attachment],
            });
        } catch (error) {
            await this.handleError(ctx, loadingMessage);
            console.error(error);
        }
    }

    getTargetUser(ctx, args) {
        return ctx.isInteraction
            ? ctx.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
    }

    async sendUserNotFoundEmbed(ctx, color) {
        const embed = ctx.client.embed()
            .setColor(color.main)
            .setDescription('User Not Found');
        return await ctx.sendMessage({
            embeds: [embed],
        });
    }

    async sendLoadingMessage(ctx, color, emoji) {
        const embed = ctx.client.embed()
            .setColor(color.main)
            .setTitle(`**${emoji.mainLeft} 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 ${emoji.mainRight}**`)
            .setDescription('**Generating your profile...**');
        return await ctx.sendDeferMessage({
            embeds: [embed],
        });
    }

    async handleError(ctx, loadingMessage) {
        await loadingMessage?.edit({
            content: 'An error occurred while generating your profile. Please try again later.',
            files: [],
        });
    }

    drawRoundedRectangle(ctx, x, y, width, height, radius, color) {
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
        ctx.fillStyle = color;
        ctx.fill();
    }

    async drawProfile(client, context, targetUser, userInfo, color, emoji, banner) {
        const userAvatar = await loadImage(targetUser.displayAvatarURL({ format: 'png', size: 256 }));
        const userAvatarX = 45;
        const userAvatarY = 290;
        const userAvatarSize = 128;

        // Draw the background color
        context.fillStyle = client.utils.formatColor(color.main);
        context.fillRect(0, 0, 1180, 600);

        if (banner) {
            const bannerImage = await loadImage(banner);
            const x = 15;
            const y = 25;
            const width = 820;
            const height = 312;
            const radius = 32;

            // Begin a new path for the rounded rectangle
            context.save();
            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + width - radius, y);
            context.quadraticCurveTo(x + width, y, x + width, y + radius);
            context.lineTo(x + width, y + height - radius);
            context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            context.lineTo(x + radius, y + height);
            context.quadraticCurveTo(x, y + height, x, y + height - radius);
            context.lineTo(x, y + radius);
            context.quadraticCurveTo(x, y, x + radius, y);
            context.closePath();

            // Clip to the rounded rectangle path
            context.clip();

            // Draw the banner image within the clipped area
            context.drawImage(bannerImage, x, y, width, height);

            // Restore the context to remove the clipping path
            context.restore();
        }

        // Draw the rounded rectangle for the settings box
        this.drawRoundedRectangle(context, 855, 25, 300, 550, 32, client.utils.formatColor(color.light));

        // Draw the avatar as a circular image
        context.save();
        context.beginPath();
        context.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(userAvatar, userAvatarX, userAvatarY, userAvatarSize, userAvatarSize);
        context.restore();

        // Draw border around avatar
        context.beginPath();
        context.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2 + 2, 0, Math.PI * 2, true);
        context.lineWidth = 4;
        context.strokeStyle = client.utils.formatColor(color.light);
        context.stroke();

        // Draw the username below the avatar
        context.font = "bold 24px Kelvinch-Bold Arial";
        context.fillStyle = client.utils.formatColor(color.dark);
        context.fillText(targetUser.username, userAvatarX + 5, userAvatarY + userAvatarSize + 30);

        // Draw "Settings" title
        context.font = "bold 28px Kelvinch-Bold Arial";
        context.fillText("User Information", 880, 80);

        // Draw each setting item text and switch
        const userInfoDetail = [
            { label: "Gender", description: userInfo.profile && userInfo.profile.gender ? userInfo.profile.gender : 'Not Set', x: 880, y: 140 },
            { label: "Date of birth", description: userInfo.profile && userInfo.profile.birthday ? userInfo.profile.birthday : 'Not Set', x: 880, y: 220 },
            { label: "Bio", description: userInfo.profile && userInfo.profile.bio ? userInfo.profile.bio : 'Not Set', x: 880, y: 300 }
        ];

        context.font = "18px Arial";
        userInfoDetail.forEach(info => {
            context.fillStyle = client.utils.formatColor(color.dark);
            context.fillText(info.label, info.x, info.y);
            context.font = "14px Arial";
            context.fillText(info.description, info.x, info.y + 20);
        });

        // Draw Zodiac Sign
        if (userInfo.profile.gender) {
            const genderEmoji = userInfo.profile.gender === 'male' ? emoji.gender.male : emoji.gender.female;
            const genderEmojiURL = client.utils.emojiToImage(genderEmoji);

            try {
                const genderEmojiImage = await loadImage(genderEmojiURL);
                context.drawImage(genderEmojiImage, 1050, 120, 64, 64);
            } catch (error) {
                console.error('Error loading zodiac emoji image:', error);
            }
        }

        // Draw Zodiac Sign
        if(userInfo.profile.birthday) {
            const birthday = moment(userInfo.profile.birthday, 'DD-MMM');
            const day = birthday.date();
            const month = birthday.month() + 1;
            const zodiacSign = client.utils.getZodiacSign(emoji.zodiac, day, month);
            const zodiacEmojiURL = client.utils.emojiToImage(zodiacSign.emoji);

            try {
                const zodiacEmojiImage = await loadImage(zodiacEmojiURL);
                context.drawImage(zodiacEmojiImage, 1050, 200, 64, 64);
            } catch (error) {
                console.error('Error loading zodiac emoji image:', error);
            }
        }

        // Draw the logout button
        context.fillStyle = '#FF5C5C';
        this.drawRoundedRectangle(context, 915, 520, 180, 45, 20, '#FF5C5C');
        context.fillStyle = client.utils.formatColor(color.dark);
        context.textAlign = 'center';
        context.font = "18px Arial";
        context.fillText("Single", 1005, 550);
    }
};
