const Command = require('../../structures/Command.js');
const canvafy = require("canvafy");

module.exports = class Post extends Command {
    constructor(client) {
        super(client, {
            name: 'post',
            description: {
                content: 'Post any text or message!',
                examples: ['post Hello, world!'],
                usage: 'post <message>',
            },
            category: 'fun',
            aliases: ['message'],
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
                    name: 'message',
                    type: 3,
                    description: 'Your message to post.',
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const postMessages = language.locales.get(language.defaultLocale)?.funMessages?.postMessages;

        try {
            if (ctx.isInteraction) {
                await ctx.interaction.reply("Posting...");
            } else {
                await ctx.sendDeferMessage("Posting...");
            }
            const user = await client.utils.getUser(ctx.author.id);
            const message = ctx.options?.getString('message') || args.join(' ');

            if (!message) {
                return client.utils.sendErrorMessage(client, ctx, postMessages.noMessageProvided, color, 2 * 60 * 60);
            }

            const post = await new canvafy.Tweet()
                .setTheme("dim")
                .setUser({displayName: ctx.author.displayName, username: ctx.author.username})
                .setAvatar(ctx.author.displayAvatarURL())
                .setVerified(user.verification.verify.status === 'verified')
                .setComment(message)
                .build();


            ctx.isInteraction
                ? await ctx.interaction.editReply({ content: '', embeds: [], files: [{ attachment: post, name: `profile-${ctx.author.id}.png` }] })
                : await ctx.editMessage({ content: '', embeds: [], files: [{ attachment: post, name: `profile-${ctx.author.id}.png` }] });
        } catch (error) {
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while generating your profile. Please try again later.')
            console.error(error);
        }
    }
};
