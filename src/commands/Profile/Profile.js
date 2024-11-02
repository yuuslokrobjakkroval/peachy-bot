const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { formatUsername, splitToSpace, formatUpperCase } = require('../../utils/Utils');
const Users = require('../../schemas/user');
const moment = require("moment");

GlobalFonts.registerFromPath('./fonts/Kelvinch-Roman.otf', 'Name');
GlobalFonts.registerFromPath('./fonts/Kelvinch-Bold.otf', 'EmOne-SemiBold');
GlobalFonts.registerFromPath('./fonts/Kelvinch-BoldItalic.otf', 'EmOne-SemiBoldItalic');

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
            const userData = await Users.findOne({ userId: targetUser.id });

            if (!userData) {
                return await this.sendUserNotFoundEmbed(ctx, color);
            }

            loadingMessage = await this.sendLoadingMessage(ctx, color, emoji);

            await new Promise(resolve => setTimeout(resolve, 2000));

            const canvas = createCanvas(720, 400);
            const context = canvas.getContext('2d');

            // Try loading the background image; if unavailable, use a random color
            let backgroundImage;
            // try {
            //     backgroundImage = await loadImage(await backgroundImages(targetUser.id, userData?.profile?.gender));
            // } catch (error) {
            //     console.log("No background image found; using a random background color.");
            // }
            this.drawBackground(context, backgroundImage);

            await this.drawProfile(context, targetUser, userData, emoji);

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

    // Helper function to generate a random color
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    drawBackground(ctx, backgroundImage) {
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, 720, 400);
        } else {
            ctx.fillStyle = this.getRandomColor();
            ctx.fillRect(0, 0, 720, 400);
        }
    }

    async drawProfile(context, targetUser, userData, emoji) {
        const userAvatar = await loadImage(targetUser.displayAvatarURL({ format: 'png', size: 256 }));
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

        // Draw border around avatar
        context.beginPath();
        context.arc(userAvatarX + userAvatarSize / 2, userAvatarY + userAvatarSize / 2, userAvatarSize / 2 + 2, 0, Math.PI * 2, true);
        context.lineWidth = 4;
        context.strokeStyle = '#FFFFFF';
        context.stroke();
    }
};
