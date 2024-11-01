const { Command } = require('../../structures');
const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath('./fonts/Kelvinch-Roman.otf', 'Name');

module.exports = class Profile extends Command {
    constructor(client) {
        super(client, {
            name: 'profile',
            description: {
                content: 'Shows the user profile layout',
            },
            category: 'social',
            aliases: ['profile', 'pf'],
            cooldown: 5,
        });
    }

    async run(client, ctx, args) {
        const canvas = createCanvas(1183, 525);
        const context = canvas.getContext('2d');

        // Background color
        context.fillStyle = '#F7C8D2';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Profile background image
        const profileBackground = await loadImage('/mnt/data/image.png'); // Replace with a valid path to a background image if needed
        context.drawImage(profileBackground, 50, 50, 600, 300);

        // Draw profile image with circular mask
        const profileImage = await loadImage('path_to_profile_image'); // Add the correct path to the profile image
        context.save();
        context.beginPath();
        context.arc(150, 250, 60, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(profileImage, 90, 190, 120, 120);
        context.restore();

        // Username text
        context.font = 'bold 24px Name';
        context.fillStyle = '#2F3B49';
        context.fillText('ismekyuu', 80, 340);

        // Settings Panel Background
        context.fillStyle = '#FFFFFF';
        drawRoundedRect(context, 700, 50, 400, 400, 20);
        context.fill();

        // Settings Header
        context.font = 'bold 28px Name';
        context.fillStyle = '#2F3B49';
        context.fillText('Settings', 730, 100);

        // Dark Mode Text and Switch
        context.font = '16px Name';
        context.fillText('Dark Mode', 730, 150);
        context.font = '14px Name';
        context.fillText('Enables dark theme in order to protect your eyes', 730, 175);
        this.drawSwitch(context, 950, 140, false);

        // Developer Mode Text and Switch
        context.font = '16px Name';
        context.fillText('Developer Mode', 730, 220);
        context.font = '14px Name';
        context.fillText('Used for debugging and testing', 730, 245);
        this.drawSwitch(context, 950, 210, true);

        // Language Text and Dropdown
        context.font = '16px Name';
        context.fillText('Language', 730, 290);
        context.font = '14px Name';
        context.fillText('Select your language', 730, 315);
        context.strokeStyle = '#DBE3EB';
        context.lineWidth = 2;
        context.strokeRect(730, 330, 300, 40);
        context.font = '16px Name';
        context.fillStyle = '#2F3B49';
        context.fillText('English', 750, 357);

        // Logout Button
        context.fillStyle = '#EF5D5D';
        drawRoundedRect(context, 750, 400, 250, 50, 10);
        context.fill();
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 18px Name';
        context.fillText('Logout', 820, 430);

        // Convert canvas to buffer and send as attachment
        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile.png' });
        await ctx.sendMessage({ files: [attachment] });
    }

    // Helper function for drawing a switch
    drawSwitch(context, x, y, enabled) {
        context.fillStyle = enabled ? '#EF5D5D' : '#DBE3EB';
        drawRoundedRect(context, x, y, 40, 20, 10);
        context.fill();
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.arc(x + (enabled ? 30 : 10), y + 10, 8, 0, Math.PI * 2);
        context.fill();
    }
};

// Standalone function to draw a rounded rectangle
function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
}
