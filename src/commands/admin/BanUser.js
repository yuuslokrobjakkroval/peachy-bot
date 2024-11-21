const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class BanUser extends Command {
    constructor(client) {
        super(client, {
            name: 'banuser',
            description: {
                content: "Ban or unban a user with a reason.",
                examples: ['banuser ban @user spamming inappropriate content', 'banuser unban @user'],
                usage: 'banuser <ban|unban> <user> [reason]',
            },
            category: 'admin',
            aliases: ['ban', 'unban', 'b', 'ub'],
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
        if (args.length < 2) {
            return await ctx.sendMessage({
                embeds: [client.embed().setColor(color.danger).setDescription('Please specify whether to `ban` or `unban`, and mention a user.')],
            });
        }

        const action = args[0].toLowerCase(); // 'ban' or 'unban'
        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[1]) || args[1];

        if (!mention) return await ctx.sendMessage({
            embeds: [client.embed().setColor(color.danger).setDescription('Please mention a valid user.')],
        });

        if (mention && mention.user.bot) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.botTransfer, color);
        }

        const userId = typeof mention === 'string' ? mention : mention.id;

        let user = await Users.findOne({ userId });
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

        // Ban Action
        if (action === 'ban') {
            if (isBanned) {
                return await ctx.sendMessage({
                    embeds: [client.embed().setColor(color.danger).setDescription(`${mention} is already banned.`)],
                });
            }

            const reason = args.slice(2).join(' ') || "No reason provided";

            // Update the user's ban status
            await Users.updateOne(
                { userId: mention.id },
                { $set: { 'verification.isBanned': true, 'verification.banReason': reason } },
                { upsert: true }
            ).exec();

            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(`${emoji.tick} Banned **${mention}** for: \`${reason}\``);

            return await ctx.sendMessage({ embeds: [embed] });

            // Unban Action
        } else if (action === 'unban') {
            if (!isBanned) {
                return await ctx.sendMessage({
                    embeds: [client.embed().setColor(color.danger).setDescription(`${mention} is not banned.`)],
                });
            }

            // Update the user's ban status
            await Users.updateOne(
                { userId: mention.id },
                { $set: { 'verification.isBanned': false, 'verification.banReason': null } }
            ).exec();

            const embed = client
                .embed()
                .setColor(color.success)
                .setDescription(`${emoji.tick} Unbanned **${mention}**.`);

            return await ctx.sendMessage({ embeds: [embed] });

        } else {
            return await ctx.sendMessage({
                embeds: [client.embed().setColor(color.danger).setDescription('Invalid action. Please use `ban` or `unban`.')],
            });
        }
    }
};
