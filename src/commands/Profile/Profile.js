const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const ShopItems = require('../../assets/inventory/ShopItems');
const moment = require("moment");
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Wallpapers = inventory.filter(value => value.type === 'wallpaper');
const Colors = inventory.filter(value => value.type === 'color');

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

            loadingMessage = await this.sendLoadingMessage(client, ctx, color, emoji);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const equippedWallpaper = user.equip.find(equippedItem => equippedItem.id.startsWith('w'));
            const equippedColor = user.equip.find(equippedItem => equippedItem.id.startsWith('p'));

            let bannerImage;
            if (equippedWallpaper) {
                bannerImage = Wallpapers.find(wallpaperItem => wallpaperItem.id === equippedWallpaper.id)?.image;
            } else {
                bannerImage = 'https://i.imgur.com/8rZFeWI.jpg';
            }

            let backgroundColor;
            if (equippedColor) {
                backgroundColor = Colors.find(colorItem => colorItem.id === equippedColor.id)?.code;
            }

            const canvas = createCanvas(1280, 720);
            const context = canvas.getContext('2d');

            await this.drawProfile(client, context, targetUser, user, color, backgroundColor, emoji, bannerImage);

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

    async sendLoadingMessage(client, ctx, color, emoji) {
        const embed = client.embed()
            .setColor(color.main)
            .setTitle(`**${emoji.mainLeft} 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 ${emoji.mainRight}**`)
            .setDescription('**Generating your profile...**')
            .setImage('https://i.imgur.com/UCsKa6Z.gif')
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

    // Function to split text into multiple lines
    splitText(context, text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    async drawProfile(client, context, targetUser, userInfo, color, backgroundColor, emoji, banner) {
        const userAvatar = await loadImage(targetUser.displayAvatarURL({ format: 'png', size: 256 }));
        const userAvatarX = 1200;
        const userAvatarY = 34;
        const userAvatarSize = 40;

        // Draw the background color
        context.fillStyle = backgroundColor ? backgroundColor : client.utils.formatColor(color.main);
        context.fillRect(0, 0, 1280, 720);

        if (banner) {
            const bannerImage = await loadImage(banner);
            const x = 15;
            const y = 100;
            const width = 850;
            const height = 460;
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

        // Draw the rounded rectangle for the title box
        this.drawRoundedRectangle(context, 15, 25, 1250, 60, 12, '#F7D8DF');

        // Draw "Settings" title
        context.font = "28px Kelvinch-Bold, Arial";
        context.fillStyle = client.utils.formatColor(color.dark);
        context.fillText(`Profile`, 30, 65);

        // Draw the rounded rectangle for the information box
        this.drawRoundedRectangle(context, 880, 100, 385, 570, 32, client.utils.formatColor(color.light));

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

        // Draw each setting item text and switch
        const userInfoDetail = [
            { label: "Name", description: userInfo.profile && userInfo.profile.name ? client.utils.formatCapitalize(userInfo.profile.name) : targetUser.username, x: 895, y: 140 },
            { label: "Gender", description: userInfo.profile && userInfo.profile.gender ? client.utils.formatCapitalize(userInfo.profile.gender) : 'Not Set', x: 895, y: 220 },
            { label: "Date of birth", description: userInfo.profile && userInfo.profile.birthday ? userInfo.profile.birthday : 'Not Set', x: 895, y: 300 },
            { label: "Bio", description: userInfo.profile && userInfo.profile.bio ? userInfo.profile.bio : 'Not Set', x: 895, y: 380 }
        ];

        userInfoDetail.forEach(info => {
            context.fillStyle = client.utils.formatColor(color.dark);
            context.font = "24px Kelvinch-Bold, Arial"
            context.fillText(info.label, info.x, info.y);
            const maxWidth = 500;
            const lines = this.splitText(context, info.description, maxWidth);
            context.font = "18px Kelvinch-Roman, Arial";
            lines.forEach((line, index) => {
                context.fillText(line, info.x, info.y + 30 + (index * 24));
            });
        });

        // Draw Zodiac Sign
        if (userInfo.profile.gender) {
            const genderEmoji = userInfo.profile.gender === 'male' ? emoji.gender.male : emoji.gender.female;
            const genderEmojiURL = client.utils.emojiToImage(genderEmoji);

            try {
                const genderEmojiImage = await loadImage(genderEmojiURL);
                context.drawImage(genderEmojiImage, 1170, 190, 64, 64);
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
                context.drawImage(zodiacEmojiImage, 1170, 280, 64, 64);
            } catch (error) {
                console.error('Error loading zodiac emoji image:', error);
            }
        }

        // Draw the logout button
        // context.fillStyle = '#F582AE';
        this.drawRoundedRectangle(context, 945, 600, 256, 50, 12, '#F7D8DF');
        context.fillStyle = client.utils.formatColor(color.dark);
        context.textAlign = 'center';
        context.font = "28px Kelvinch-SemiBoldItalic, Arial";
        context.fillText("Single", 1070, 632);
    }
};
