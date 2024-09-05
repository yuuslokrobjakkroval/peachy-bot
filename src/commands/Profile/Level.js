const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

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
            const canvas = Canvas.createCanvas(700, 250);
            const ctxCanvas = canvas.getContext('2d');

            // Background image
            const background = await Canvas.loadImage('https://i.imgur.com/psYsnxb.png');
            ctxCanvas.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Add user avatar
            const avatar = await Canvas.loadImage(ctx.author.displayAvatarURL({ format: 'png' }));
            ctxCanvas.drawImage(avatar, 25, 25, 200, 200);

            // Add level text
            ctxCanvas.font = '40px sans-serif';
            ctxCanvas.fillStyle = '#ffffff';
            ctxCanvas.fillText(`Level: ${level}`, 250, 60);

            // Add XP progress text
            ctxCanvas.font = '30px sans-serif';
            ctxCanvas.fillStyle = '#ffffff';
            ctxCanvas.fillText(`XP: ${xp} / ${levelExp}`, 250, 120);

            // Add progress bar
            ctxCanvas.fillStyle = '#ffffff';
            ctxCanvas.fillRect(250, 150, 400, 30);
            ctxCanvas.fillStyle = '#00ff00'; // Green color for the filled part
            ctxCanvas.fillRect(250, 150, (xpProgress / 100) * 400, 30);

            // Convert to an attachment
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'level-image.png' });

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
