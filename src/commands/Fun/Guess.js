const Command = require('../../structures/Command.js');
const canvafy = require("canvafy");

module.exports = class Post extends Command {
    constructor(client) {
        super(client, {
            name: 'guess',
            description: {
                content: 'Guess the relationship between user.',
                examples: ['guess @user'],
                usage: 'guess <user>',
            },
            category: 'fun',
            aliases: [],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'The user to guess relationship',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            if (ctx.isInteraction) {
                await ctx.interaction.reply("Thinking...");
            } else {
                await ctx.sendDeferMessage("Thinking...");
            }

            const targetUser = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

            if (targetUser.id === ctx.author.id) {
                ctx.isInteraction
                    ? await ctx.interaction.editReply({ content: '', embeds: [], files: [] })
                    : await ctx.editMessage({ content: '', embeds: [], files: [] });
                return client.utils.sendErrorMessage(client, ctx, '𝒀𝒐𝒖 𝒄𝒂𝒏𝒏𝒐𝒕 𝒈𝒖𝒆𝒔𝒔 𝒘𝒊𝒕𝒉 𝒚𝒐𝒖𝒓𝒔𝒆𝒍𝒇.', color)
            }

            const ship = await new canvafy.Ship()
                .setAvatars(ctx.author.displayAvatarURL({ forceStatic: true, extension: "png" }), targetUser.displayAvatarURL({ forceStatic: true, extension: "png" }))
                .setBackground("image", "https://i.imgur.com/WRQ9JgJ.jpg")
                .setBorder("#FFCFCF")
                .setOverlayOpacity(0.7)
                .build();


            ctx.isInteraction
                ? await ctx.interaction.editReply({ content: '', embeds: [], files: [{ attachment: ship, name: `profile-${ctx.author.id}.png` }] })
                : await ctx.editMessage({ content: '', embeds: [], files: [{ attachment: ship, name: `profile-${ctx.author.id}.png` }] });
        } catch (error) {
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while generating your profile. Please try again later.')
            console.error(error);
        }
    }
};
