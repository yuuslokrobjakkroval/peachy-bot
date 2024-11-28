const { Command } = require("../../structures/index.js");
const { ChannelType } = require("discord.js");

module.exports = class Announce extends Command {
    constructor(client) {
        super(client, {
            name: "announce",
            description: {
                content: "Send an announcement and mention @everyone or a specific role.",
                examples: ["announce Important update!", "announce Important update! role:@Members 🤍"],
                usage: "announce <message> [role]",
            },
            category: "dev",
            aliases: ["broadcast"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages"],
                user: ["ManageMessages"],
            },
            slashCommand: false,
            options: [
                {
                    name: "message",
                    description: "The message you want to announce",
                    type: 3,
                    required: true,
                },
                {
                    name: "channel",
                    description: "The channel to send the announcement in (optional)",
                    type: 7,
                    required: false,
                },
                {
                    name: "role",
                    description: "The role to mention (optional)",
                    type: 8, // Role type
                    required: false,
                },
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const messageContent = ctx.isInteraction
            ? ctx.interaction.options.getString('message')
            : args.join(' ');

        let targetChannel = ctx.isInteraction
            ? ctx.interaction.options.getChannel('channel')
            : ctx.channel;

        if (!targetChannel) {
            targetChannel = ctx.channel;
        }

        if (targetChannel.type !== ChannelType.GuildText) {
            return ctx.sendMessage({ content: `Please select a valid text channel for the announcement.`, ephemeral: true});
        }

        if (!messageContent || messageContent.trim().length === 0) {
            return ctx.sendMessage({ content: `Please provide a valid message to announce.`, ephemeral: true});
        }

        const roleToMention = ctx.isInteraction
            ? ctx.interaction.options.getRole('role')
            : null;

        let fullMessage;

        if (roleToMention) {
            fullMessage = `${roleToMention} ${messageContent}`;
        } else {
            fullMessage = `@everyone ${messageContent}`;
        }

        if (roleToMention || targetChannel.permissionsFor(ctx.client.user).has('MENTION_EVERYONE')) {
            targetChannel.send(fullMessage)
                .then(() => {
                    ctx.sendMessage({ content: `Announcement sent in ${targetChannel.name} ${roleToMention ? `mentioning ${roleToMention.name}` : 'mentioning @everyone'}.`, ephemeral: true });
                })
                .catch(err => {
                    console.error(err);
                    ctx.sendMessage("There was an error trying to send the announcement.");
                });
        } else {
            ctx.sendMessage("I do not have permission to mention @everyone in this channel.");
        }
    }
};
