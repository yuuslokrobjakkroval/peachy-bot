const Command = require('../../structures/Command.js');
const canvafy = require("canvafy");

module.exports = class Post extends Command {
    constructor(client) {
        super(client, {
            name: 'status',
            description: {
                content: 'Check the user status',
                examples: ['status @user'],
                usage: 'status <user>',
            },
            category: 'fun',
            aliases: [],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'The user to check status',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            if (ctx.isInteraction) {
                await ctx.interaction.reply("Checking...");
            } else {
                await ctx.sendDeferMessage("Checking...");
            }

            const targetUser = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

            const security = await new canvafy.Security()
                .setAvatar(targetUser.displayAvatarURL({ extension:"png", forceStatic:true }))
                .setBackground("image", "https://i.imgur.com/WRQ9JgJ.jpg")
                .setCreatedTimestamp(targetUser.createdTimestamp)
                .setSuspectTimestamp(604800000) // 1 week millisecond
                .setBorder("#FFCFCF")
                .setLocale("en")
                .setAvatarBorder("#FFCFCF")
                .setOverlayOpacity(0.9)
                .build();


            ctx.isInteraction
                ? await ctx.interaction.editReply({ content: '', embeds: [], files: [{ attachment: security, name: `profile-${ctx.author.id}.png` }] })
                : await ctx.editMessage({ content: '', embeds: [], files: [{ attachment: security, name: `profile-${ctx.author.id}.png` }] });
        } catch (error) {
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while generating your profile. Please try again later.')
            console.error(error);
        }
    }
};
