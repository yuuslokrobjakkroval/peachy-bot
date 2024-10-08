const { Command } = require("../../structures/index.js");
const { ChannelType } = require("discord.js");

module.exports = class Text extends Command {
    constructor(client) {
        super(client, {
            name: "text",
            description: {
                content: "Send a regular message without @everyone mention",
                examples: ["text Just a regular update"],
                usage: "text <message>",
            },
            category: "utility",
            aliases: ["sendtext"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages"],
                user: ["ManageMessages"],
            },
            slashCommand: true,
            options: [
                {
                    name: "message",
                    description: "The message you want to send",
                    type: 3,
                    required: true,
                },
                {
                    name: "channel",
                    description: "The channel to send the message in (optional)",
                    type: 7,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const messageContent = ctx.isInteraction
            ? ctx.interaction.options.getString('message')
            : args.join(' ');

        let targetChannel = ctx.isInteraction
            ? ctx.interaction.options.getChannel('channel')
            : ctx.channel;

        if (targetChannel && targetChannel.type !== ChannelType.GuildText) {
            return ctx.sendMessage({ content: `Please select a valid text channel for the announcement.`, ephemeral: true});
        }

        if (!messageContent || messageContent.trim().length === 0) {
            return ctx.sendMessage({ content: `Please provide a valid message to announce.`, ephemeral: true});
        }

        await targetChannel.send(messageContent)
            .then(() => {
                ctx.sendMessage({ content: `Message sent in ${messageContent}.`, ephemeral: true });
            })
            .catch(err => {
                console.error(err);
                ctx.sendMessage("There was an error trying to send the message.");
            });
    }
};
