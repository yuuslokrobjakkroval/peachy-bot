const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const ShopItems = require('../../assets/inventory/ShopItems');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Wallpapers = inventory.filter(value => value.type === 'wallpaper');
const Colors = inventory.filter(value => value.type === 'color');

GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-Roman.otf', 'Kelvinch-Roman');
GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-Bold.otf', 'Kelvinch-Bold');
GlobalFonts.registerFromPath('./src/data/fonts/Kelvinch-BoldItalic.otf', 'Kelvinch-SemiBoldItalic');

module.exports = class Profile extends Command {
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

    run(client, ctx, args, color, emoji, language) {
        let loadingMessage;
        try {
            const targetUser = this.getTargetUser(ctx, args);
            client.utils.getUser(targetUser.id).then(async user => {
                if (!user) {
                    return this.sendUserNotFoundEmbed(ctx, color);
                }

                try {
                    loadingMessage = await this.sendLoadingMessage(client, ctx, color, emoji);
                } catch (error) {
                    await this.handleError(ctx, loadingMessage);
                    console.error(error);
                }

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
                    backgroundColor = Colors.find(colorItem => colorItem.id === equippedColor.id)?.color;
                }

                const canvas = createCanvas(1280, 720);
                const context = canvas.getContext('2d');

                await this.drawLevel(client, context, targetUser, user, color, backgroundColor, emoji, bannerImage);

                const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: `${ctx.author.username}.png` });

                loadingMessage.edit({
                    content: '',
                    embeds: [],
                    files: [attachment],
                });
            })
        } catch (error) {
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
            .setTitle(`**${emoji.mainLeft} 𝐋𝐄𝐕𝐄𝐋 ${emoji.mainRight}**`)
            .setDescription('**Generating your level...**')
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
        const textConverted = text.toString();
        const words = textConverted.split(" ");
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

    getConsumedItems(client, userInfo) {
        if (!userInfo.consumedItems || userInfo.consumedItems.length === 0) {
            return 'None';
        }

        const categorizedItems = {};

        userInfo.consumedItems.forEach(item => {
            const itemType = item.type;
            if (!categorizedItems[itemType]) {
                categorizedItems[itemType] = [];
            }
            categorizedItems[itemType].push(`${item.name} x${item.quantity}`);
        });

        // Format the output
        let output = '';
        for (const [type, items] of Object.entries(categorizedItems)) {
            output += `${client.utils.formatCapitalize(type)}\n${items.join(', ')}\n\n`;
        }

        return output.trim(); // Trim to remove any trailing whitespace
    }

    async drawLevel(client, context, targetUser, userInfo, color, backgroundColor, emoji, banner) {
        const userAvatar = await loadImage(targetUser.displayAvatarURL({ format: 'png', size: 256 }));
        const userAvatarX = 1200;
        const userAvatarY = 34;
        const userAvatarSize = 40;

        // Draw the background color
        context.fillStyle = backgroundColor ? backgroundColor.primary : client.utils.formatColor(color.main);
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
        this.drawRoundedRectangle(context, 15, 25, 1250, 60, 12, backgroundColor ? backgroundColor.secondary : '#F7D8DF');

        // Draw "Level" title
        context.font = "28px Kelvinch-Bold, Arial";
        context.fillStyle = backgroundColor ? backgroundColor.text : client.utils.formatColor(color.dark);
        context.fillText(`Level`, 30, 65);

        // Draw the rounded rectangle for the information box
        this.drawRoundedRectangle(context, 880, 100, 385, 570, 32, backgroundColor ? backgroundColor.secondary : client.utils.formatColor(color.light));

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
        context.strokeStyle = backgroundColor ? backgroundColor.primary : client.utils.formatColor(color.light);
        context.stroke();

        // Draw user information details
        const userInfoDetail = [
            { label: "Name", description: userInfo.profile && userInfo.profile.name ? client.utils.formatCapitalize(userInfo.profile.name) : targetUser.username, x: 895, y: 140 },
            { label: "Level", description: userInfo.profile && userInfo.profile.level ? userInfo.profile.level : null, x: 895, y: 220 },
            { label: "Exp", description: userInfo.profile && userInfo.profile.xp ? `${userInfo.profile.xp} / ${userInfo.profile.levelXp}` : null, x: 895, y: 300 },
            { label: "Consumed Items", description: this.getConsumedItems(client, userInfo), x: 895, y: 380 },
        ];

        userInfoDetail.forEach(info => {
            context.fillStyle = backgroundColor ? backgroundColor.text : client.utils.formatColor(color.dark);
            context.font = "24px Kelvinch-Bold, Arial";
            context.fillText(info.label, info.x, info.y);

            const maxWidth = 500;

            if (info.label === "Consumed Items") {
                const lines = info.description.split('\n');
                context.font = "18px Kelvinch-Roman, Arial";
                lines.forEach((line, index) => {
                    context.fillText(line, info.x, info.y + 35 + (index * 24));
                });
            } else {
                const lines = this.splitText(context, info.description, maxWidth);
                context.font = "18px Kelvinch-Roman, Arial";
                lines.forEach((line, index) => {
                    context.fillText(line, info.x, info.y + 30 + (index * 24));
                });
            }
        });
    }
};
