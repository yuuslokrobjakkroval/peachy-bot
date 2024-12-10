const { Command } = require("../../structures/index.js");
const MessageTrackingSchema = require("../../schemas/messageTrack");
const { createCanvas } = require('@napi-rs/canvas');
const { Chart } = require("chart.js/auto");
const { AttachmentBuilder } = require("discord.js");

module.exports = class MessageTracker extends Command {
    constructor(client) {
        super(client, {
            name: "messages",
            description: {
                content: "Displays the total number of messages sent by a user.",
                examples: ["messages"],
                usage: "messages",
            },
            category: "utility",
            aliases: ['message', 'msg'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [{
                name: 'user',
                description: 'The user to view the message count for',
                type: 6,
                required: true,
            }],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        if (ctx.isInteraction) {
            await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
        } else {
            await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
        }

        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;

        if (mention && mention?.user?.bot) {
            return await client.utils.sendErrorMessage(client, ctx, generalMessages.botMention, color);
        }

        const guildId = ctx.guild.id;
        const userId = mention.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            let guildData = await MessageTrackingSchema.findOne({ guildId });
            if (!guildData) {
                guildData = new MessageTrackingSchema({
                    guildId,
                    isActive: true,
                    messages: [],
                });
                await guildData.save();
            }

            let userData = guildData.messages.find(msg =>
                msg.userId === userId &&
                new Date(msg.date).setHours(0, 0, 0, 0) === today.getTime()
            );

            if (!userData) {
                userData = {
                    userId,
                    username: mention.username,
                    messageCount: 0,
                    date: new Date(),
                };
                guildData.messages.push(userData);
                await guildData.save();
            }

            const messageCount = userData.messageCount;
            const message = messageCount > 0
                ? `${mention.id !== ctx.author.id ? mention.displayName : '𝒀𝒐𝒖'} 𝒉𝒂𝒗𝒆 𝒔𝒆𝒏𝒕 ***${messageCount}*** 𝒎𝒆𝒔𝒔𝒂𝒈𝒆𝒔.`
                : "𝑵𝒐 𝒎𝒆𝒔𝒔𝒂𝒈𝒆𝒔 𝒕𝒓𝒂𝒄𝒌𝒆𝒅 𝒇𝒐𝒓 𝒚𝒐𝒖 𝒚𝒆𝒕.";

            const attachment = await createChartCanvas(guildData.messages, { days: 1, label: 'All Users' });

            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace("%{mainLeft}", emoji.mainLeft)
                        .replace("%{title}", "𝐌𝐄𝐒𝐒𝐀𝐆𝐄𝐒")
                        .replace("%{mainRight}", emoji.mainRight) +
                    message
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })
                .setImage('attachment://messages.png')
                .setTimestamp();

            return ctx.isInteraction
                ? await ctx.interaction.editReply({ content: "", embeds: [embed], files: [attachment] })
                : await ctx.editMessage({ content: "", embeds: [embed], files: [attachment] });
        } catch (err) {
            console.error(err);
            client.utils.sendErrorMessage(client, ctx, "An error occurred while processing the message tracking data.", color);
        }
    }
};

async function createChartCanvas(messages, period) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formattedToday = today.toISOString();

    const todayMessages = messages.filter(msg => {
        const msgDate = new Date(msg.date);
        msgDate.setHours(0, 0, 0, 0);
        return msgDate.getTime() === today.getTime();
    });

    if (todayMessages.length === 0) {
        todayMessages.push({ date: formattedToday, username: 'No Data', messageCount: 0 });
    }

    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const currentDay = dateFormatter.format(today);
    const username = todayMessages.map(msg => msg.username || 'Unknown');
    const counts = todayMessages.map(msg => msg.messageCount);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: username,
            datasets: [
                {
                    label: 'Messages',
                    data: counts,
                    borderColor: '#8BD3DD',
                    borderWidth: 2,
                    pointRadius: 2,
                    fill: true,
                    tension: 0.4
                },
                // {
                //     label: 'Trend',
                //     data: movingAverages,
                //     borderColor: '#94716B',
                //     borderWidth: 2,
                //     pointRadius: 0 ,
                //     fill: true,
                //     tension: 0.4
                // }
            ],
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: `Messages - ${period.label} for ${currentDay}`,
                    color: '#FFFFFF',
                },
                legend: {
                    labels: {
                        color: '#FFFFFF',
                    },
                },
            },
            scales: {
                x: {
                    // grid: { color: 'rgba(255, 255, 255, 0.1)'},
                    // ticks: {
                    //     color: '#FFFFFF',
                    //     maxRotation: 45,
                    //     minRotation: 45,
                    // }
                },
                y: {
                    beginAtZero: true,
                    // grid: { color: 'rgba(255, 255, 255, 0.1)'},
                    // ticks: { color: '#FFFFFF'}
                }
            },
        },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    const attachment= new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'messages.png' });
    chart.destroy();
    return attachment;
}

