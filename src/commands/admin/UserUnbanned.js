const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class BanUser extends Command {
    constructor(client) {
        super(client, {
            name: 'unban',
            description: {
                content: "Unban a user.",
                examples: ['unban @user'],
                usage: 'unban <user>',
            },
            category: 'admin',
            aliases: ['ub'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['BanMembers'],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (args.length < 1) {
            return await ctx.sendMessage({
                embeds: [client.embed().setColor(color.danger).setDescription('Please specify whether to `unban`, and mention a user.')],
            });
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || args[0];

        if (!mention) {
            return client.util.sendErrorMessage(client, ctx, generalMessages.noUserMentioned, color);
        }

        const userId = typeof mention === 'string' ? mention : mention.id;
        const syncUser = await client.users.fetch(userId);
        let user = await Users.findOne({ userId: syncUser.id });
        if (!user) {
            user = new Users({
                userId: mention.id,
                verification: {
                    isBanned: false,
                    banReason: null,
                }
            });
        }

        const { isBanned } = user.verification;
        if (isBanned) {
            return await ctx.sendMessage({
                embeds: [client.embed().setColor(color.danger).setDescription(`${mention} is already banned.`)],
            });
        } else {
            await Users.updateOne(
                {userId: mention.id},
                {$set: {'verification.isBanned': false, 'verification.banReason': null}},
                {upsert: true}
            ).exec();

            const embed = client.embed()
                .setColor(color.main)
                .setDescription(`${emoji.tick} Unbanned **${mention}**.`);

            return await ctx.sendMessage({embeds: [embed]});
        }
    }
};
