const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');
const GiveawaySchema = require('../../schemas/giveaway.js');

module.exports = class Start extends Command {
    constructor(client) {
        super(client, {
            name: 'giveaway',
            description: {
                content: 'Start a giveaway with a specified duration, number of winners, and prize.',
                examples: ['giveaway 1h 2 1000 true'],
                usage: 'giveaway <duration> <winners> <prize> <autopay> <image> <thumbnail>',
            },
            category: 'giveaway',
            aliases: [],
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'duration',
                    description: 'The duration of the giveaway.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'winners',
                    description: 'The number of winners for the giveaway.',
                    type: 4,
                    required: true,
                },
                {
                    name: 'prize',
                    description: 'The prize of the giveaway.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'image',
                    description: 'Attach an image for the giveaway.',
                    type: 11,
                    required: false,
                },
                {
                    name: 'thumbnail',
                    description: 'Attach a thumbnail for the giveaway.',
                    type: 11,
                    required: false,
                },
                {
                    name: 'autopay',
                    description: 'Automatically pay the winners after the giveaway ends. (Owner/Staff Only)',
                    type: 3,
                    required: false,
                },
                {
                    name: 'host',
                    description: 'Specify the giveaway host (mention or user ID).',
                    type: 6, // User type
                    required: false,
                },
                {
                    name: 'channel',
                    description: 'Specify the channel to post the giveaway.',
                    type: 7, // Channel type
                    required: false,
                    channel_types: [0],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply({ephemeral: true});
        }

        const member = await ctx.guild.members.fetch(ctx.author.id);
        const isOwner = this.client.config.owners.includes(ctx.author.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isOwner && !isAdmin) {
            return (ctx.isInteraction
                    ? ctx.interaction.reply({
                        content: 'Only the bot owner, server owner, and administrators can use this giveaway.',
                        ephemeral: true
                    })
                    : ctx.sendMessage({
                        content: 'Only the bot owner, server owner, and administrators can use this giveaway.',
                        ephemeral: true
                    })
            );
        }

        const durationStr = ctx.isInteraction ? ctx.interaction.options.getString('duration') : args[0];
        const winnersStr = ctx.isInteraction ? ctx.interaction.options.getInteger('winners') : args[1];
        const prize = ctx.isInteraction ? ctx.interaction.options.getString('prize') : args[2];
        const image = ctx.isInteraction ? ctx.interaction.options.getAttachment('image') : args[3];
        const thumbnail = ctx.isInteraction ? ctx.interaction.options.getAttachment('thumbnail') : args[4];
        const autoPay = ctx.isInteraction ? ctx.interaction.options.getString('autopay') : args[5];

        if (autoPay && !isOwner) {
            return (ctx.isInteraction
                    ? ctx.interaction.reply({
                        content: 'Only the bot owner can enable autopay for giveaways.',
                        ephemeral: true
                    })
                    : ctx.sendMessage({
                        content: 'Only the bot owner can enable autopay for giveaways.',
                        ephemeral: true
                    })
            );
        }

        const host = ctx.isInteraction ? ctx.interaction.options.getUser('host') : args[6];
        const channel = ctx.isInteraction ? ctx.interaction.options.getChannel('channel') : args[7];

        const duration = ms(durationStr);
        const winners = parseInt(winnersStr, 10);

        if (!duration || isNaN(winners) || winners <= 0 || !prize) {
            const replyMessage = {
                embeds: [
                    client.embed()
                        .setAuthor({ name: client.user.displayName, iconURL: client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('Invalid input. Please ensure the duration, number of winners, and prize are correctly provided.'),
                ],
            };
            if (ctx.isInteraction) {
                await ctx.interaction.reply(replyMessage);
            } else {
                await ctx.sendMessage(replyMessage);
            }
            return;
        }

        const endTime = Date.now() + duration;
        const formattedDuration = parseInt(endTime / 1000, 10);

        const giveawayEmbed = client.embed()
            .setColor(color.main)
            .setTitle(`**${client.utils.formatNumber(prize)}** ${emoji.coin}`)
            .setDescription(
                `Click ${emoji.main} button to enter!\nWinners: ${winners}\nHosted by: ${host ? host.displayName : ctx.author.displayName}\nEnds: <t:${formattedDuration}:R>`
            );

        if (image) giveawayEmbed.setImage(image.url);
        if (thumbnail) giveawayEmbed.setThumbnail(thumbnail.url);

        const joinButton = new ButtonBuilder()
            .setCustomId('giveaway-join')
            .setEmoji(`${emoji.main}`)
            .setLabel('0')
            .setStyle(1)
            .setDisabled(false);

        const participantsButton = new ButtonBuilder()
            .setCustomId('giveaway-participants')
            .setLabel('Participants')
            .setStyle(2)
            .setDisabled(false);

        const buttonRow = new ActionRowBuilder().addComponents(joinButton, participantsButton);

        let giveawayMessage;
        try {
            giveawayMessage = await (channel || ctx.channel).send({
                embeds: [giveawayEmbed],
                components: [buttonRow],
                fetchReply: true,
            });
        } catch (err) {
            console.error(err);
            const response = 'There was an error sending the giveaway message.';
            return ctx.isInteraction
                ? ctx.editReply({ content: response })
                : ctx.sendMessage({ content: response });
        }

        let cleanedPrize = prize.replace(/[^0-9,]/g, '');
        let prizeAmountStr = cleanedPrize.replace(/,/g, '');
        let prizeAmount = parseFloat(prizeAmountStr) || 0;
        if (prize.match(/[kmbtq]/i)) {
            const multipliers = { k: 1000, m: 1000000, b: 1000000000, t: 1000000000000, q: 1000000000000000 };
            const unit = prize.slice(-1).toLowerCase();
            prizeAmount *= multipliers[unit];
        }

        if (ctx.isInteraction) {
            await ctx.interaction.editReply({ content: 'Giveaway successfully created!' });
        } else {
            ctx.sendMessage({ content: 'Giveaway successfully created!', ephemeral: true });
        }

        await GiveawaySchema.create({
            guildId: ctx.guild.id,
            channelId: channel ? channel.id : ctx.channel.id,
            messageId: giveawayMessage.id,
            hostedBy: host ? host.id : ctx.author.id,
            winners: winners,
            prize: prizeAmount,
            endTime: Date.now() + duration,
            paused: false,
            ended: false,
            entered: [],
            autopay: !!autoPay,
            retryAutopay: false,
            winnerId: [],
            rerollOptions: [],
        });
    }
};
