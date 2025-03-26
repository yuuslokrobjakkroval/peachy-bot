const { Command } = require('../../structures');
const axios = require('axios');
const globalConfig = require('../../utils/Config');

module.exports = class AddEmoji extends Command {
    constructor(client) {
        super(client, {
            name: 'addemoji',
            description: {
                content: "Add emoji to bot.",
                examples: ['addemoji'],
                usage: 'addemoji',
            },
            category: 'developer',
            aliases: ['ae'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "emoji",
                    description: "Attach an image for upload.",
                    type: 11,
                    required: false,
                },
                {
                    name: "name",
                    description:
                        "set name for that emoji",
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply();
        } else {
            await ctx.sendDeferMessage(`${client.user.username} is Thinking...`);
        }

        try {
            const emoji = ctx.isInteraction ? ctx.interaction.options.getAttachment("emoji") : args[0];
            const name = ctx.isInteraction ? ctx.interaction.options.getString("name") : args[1];

            const res = await axios.get(emoji.url, { responseType: "arraybuffer" });
            const buffer = Buffer.from(res.data, `binary`);
            const base64Image = buffer.toString('base64');

            const body = {
                name: name,
                emoji: `data:image/jpeg;base64,${base64Image}`,
            }
            const response = await axios.post(`https://discord.com/api/v10/application/${globalConfig.clientId}/emoji`, {
                name: body.name,
                image: body.emoji,
            }, {
                headers: {
                    'Authorization': `Bearer ${globalConfig.token}`,
                    'content-type': 'application/json',
                }
            }).catch((err) => {});

            if (response.status === 200) {
                ctx.isInteraction
                    ? await ctx.interaction.editReply({
                        content: `<:${response.data.name}:${response.data.id}> I have create a brand new app emoji.\nCopy \`<:${response.data.name}:${response.data.id}>\` into your code to use it`,
                        fetchReply: true,
                    })
                    : await ctx.editMessage({
                        content: `<:${response.data.name}:${response.data.id}> I have create a brand new app emoji.\nCopy \`<:${response.data.name}:${response.data.id}>\` into your code to use it`,
                        fetchReply: true,
                    });
            } else {
                ctx.isInteraction
                    ? await ctx.interaction.editReply({
                        content: `Looks like there was an issue!`,
                        fetchReply: true,
                    })
                    : await ctx.editMessage({
                        content: `Looks like there was an issue!`,
                        fetchReply: true,
                    });
            }
        } catch (error) {
            console.error(error);
        }
    }
};
