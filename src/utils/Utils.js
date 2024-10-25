const { ActionRowBuilder, ButtonBuilder, CommandInteraction, EmbedBuilder } = require('discord.js');
const Users = require('../schemas/user');
const GiveawaySchema = require('../schemas/giveaway');

module.exports = class Utils {
    static getUser(userId) {
        return Users.findOne({ userId }).then(user => { return user; }).catch(error => { console.log(`Error fetching user data: ${error}`); return null });
    }

    static toSmall(count) {
        const numbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
        let digits = Math.trunc(Math.log10(count) + 1);
        let result = '';
        if (!digits) digits = count.toString().length;
        for (let i = 0; i < digits; i++) {
            let digit = count % 10;
            count = Math.trunc(count / 10);
            result = numbers[digit] + result;
        }
        return result;
    }

    static formatCoin(coin) {
        if(isNaN(coin) || coin <= 0 || coin.toString().includes('.') || coin.toString().includes(',')) {
            return coin.toLocaleString();
        }
    }

    static formatUsername(name) {
        if (typeof name !== 'string') {
            return '';
        }

        let formattedName = name.replace(/[^a-zA-Z0-9]+/g, ' ');
        return formattedName.toUpperCase();
    }


    static splitToSpace(text) {
        return text.replace(/[^a-zA-Z0-9]+/g, ' ');
    }

    static formatCapitalize(val) {
        const words = val.split('_');
        const CapitalizeWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
        return CapitalizeWords.join(' ');
    }

    static formatUpperCase(val) {
        const words = val.split('_');
        const UpperWords = words.map((word) => word.toUpperCase());
        return UpperWords.join(' ');
    }

    static getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static toNameCase(args) {
        return args
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    static toTitleCase(args) {
        return args.charAt(0).toUpperCase() + args.slice(1);
    }

    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static chunk(array, size) {
        const chunked_arr = [];
        let index = 0;
        while (index < array.length) {
            chunked_arr.push(array.slice(index, size + index));
            index += size;
        }
        return chunked_arr;
    }

    static formatTime(string) {
        const hours = Math.floor(string / 3600);
        const minutes = Math.floor((string % 3600) / 60);
        const remainingSeconds = string % 60;
        const parts = [];

        if (hours > 0) {
            parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        }
        if (minutes > 0 || (hours > 0 && remainingSeconds > 0)) {
            parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
        }
        if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
            parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`);
        }

        return parts.join(' ');
    }

    static formatNumber(number) {
        return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }

    static generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static formatString(number, decimals = 2) {
        if (number === 0) return '0';
        const k = 1000;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['', 'K', 'M', 'B', 'T', 'Q'];
        const i = Math.floor(Math.log(number) / Math.log(k));
        const formattedNumber = parseFloat((number / Math.pow(k, i)).toFixed(dm));
        return dm === 0 ? formattedNumber.toFixed(0) : formattedNumber + sizes[i];
    }

    static formatResults(current, total, size) {
        const empty = { begin: '<:PB1E:1277709213753409587>', middle: '<:PB2E:1277709239942381701>', end: '<:PB3E:1277709259039178835>' };
        const full = {
            begin: '<:PB1CB:1277709205377122415>',
            middle: '<:PB2CB:1277709231704903730>',
            end: '<:PB3FB:1277709268203737121>',
        };
        const change = { begin: '<:PB1FB:1277709222913769562>', middle: '<:PB2FB:1277709250423951480>' };

        const filledBar = Math.ceil((current / total) * size) || 0;
        let emptyBar = size - filledBar || 0;

        if (filledBar === 0) emptyBar = size;

        const firstBar = filledBar ? (filledBar === 1 ? change.begin : full.begin) : empty.begin;
        const middleBar = filledBar
            ? filledBar === size
                ? full.middle.repeat(filledBar - 1)
                : full.middle.repeat(filledBar - 1) + empty.middle.repeat(size - filledBar)
            : empty.middle.repeat(size - 1);
        const endBar = filledBar === size ? full.end : empty.end;

        return firstBar + middleBar + endBar;
    }

    static parseTime(string) {
        const time = string.match(/([0-9]+[d,h,m,s])/g);
        if (!time) return 0;
        let ms = 0;
        for (const t of time) {
            const unit = t[t.length - 1];
            const amount = Number(t.slice(0, -1));
            if (unit === 'd') ms += amount * 24 * 60 * 60 * 1000;
            else if (unit === 'h') ms += amount * 60 * 60 * 1000;
            else if (unit === 'm') ms += amount * 60 * 1000;
            else if (unit === 's') ms += amount * 1000;
        }
        return ms;
    }

    static progressBar(current, total, size = 20) {
        const percent = Math.round((current / total) * 100);
        const filledSize = Math.round((size * current) / total);
        const emptySize = size - filledSize;
        const filledBar = '▓'.repeat(filledSize);
        const emptyBar = '░'.repeat(emptySize);
        return `${filledBar}${emptyBar} ${percent}%`;
    }

    static percentage(percent, total) {
        return Math.floor((100 * percent) / total).toFixed(1);
    }

    static emojiToImage(emoji) {
        const emojiRegex = /<(a)?:[a-zA-Z0-9_]+:(\d+)>/;
        const match = emoji.match(emojiRegex);
        if (match) {
            const emojiId = match[2];
            const isAnimated = match[1] === 'a';
            return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
        } else {
            return null;
        }
    }

    static shuffle(array) {
        const arr = array.slice(0);
        for (let i = arr.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }

    static async reactionPaginate(ctx, embed) {
        const author = ctx instanceof CommandInteraction ? ctx.user : ctx.author;
        const isInteraction = ctx.isInteraction;

        if (embed.length < 2) {
            const msgOptions = { embeds: embed };
            await (isInteraction
                ? ctx.deferred
                    ? ctx.interaction.followUp(msgOptions)
                    : ctx.interaction.reply(msgOptions)
                : ctx.channel.send(msgOptions));
            return;
        }

        let page = 0;

        const getPageContent = (page) => {
            return { embeds: [embed[page]] };
        };

        const msgOptions = getPageContent(0);
        const msg = await (isInteraction
            ? ctx.deferred
                ? ctx.interaction.followUp({ ...msgOptions, fetchReply: true })
                : ctx.interaction.reply({ ...msgOptions, fetchReply: true })
            : ctx.channel.send({ ...msgOptions, fetchReply: true }));

        const reactions = ['⏪', '◀️', '▶️', '⏩'];
        for (const emoji of reactions) {
            await msg.react(emoji);
        }

        const filter = (reaction, user) => reactions.includes(reaction.emoji.name) && user.id === author.id;

        const collector = msg.createReactionCollector({ filter, time: 60000 });

        collector.on('collect', (reaction, user) => {
            if (user.id !== author.id) return;

            reaction.users.remove(user);

            switch (reaction.emoji.name) {
                case '⏪':
                    page = 0;
                    break;
                case '◀️':
                    if (page > 0) page--;
                    break;
                case '▶️':
                    if (page < embed.length - 1) page++;
                    break;
                case '⏩':
                    page = embed.length - 1;
                    break;
                default:
                    break;
            }

            msg.edit(getPageContent(page));
        });

        collector.on('end', () => {
            msg.reactions.removeAll();
        });
    }

    static async paginate(ctx, embed) {
        const author = ctx instanceof CommandInteraction ? ctx.user : ctx.author;
        const isInteraction = ctx.isInteraction;

        if (embed.length < 2) {
            const msgOptions = { embeds: embed };
            await (isInteraction
                ? ctx.deferred
                    ? ctx.interaction.followUp(msgOptions)
                    : ctx.interaction.reply(msgOptions)
                : ctx.channel.send(msgOptions));
            return;
        }

        let page = 0;
        const getButton = page => {
            const firstEmbed = page === 0;
            const lastEmbed = page === embed.length - 1;
            const pageEmbed = embed[page];
            const buttons = [
                { id: 'fast', label: '<<', emoji: '⏪', disabled: firstEmbed },
                { id: 'back', label: '<', emoji: '◀️', disabled: firstEmbed },
                { id: 'next', label: '>', emoji: '▶️', disabled: lastEmbed },
                { id: 'last', label: '>>', emoji: '⏩', disabled: lastEmbed },
            ];
            const components = new ActionRowBuilder();
            buttons.forEach(button =>
                components.addComponents(
                    new ButtonBuilder().setCustomId(button.id).setLabel(button.label).setStyle(2).setDisabled(button.disabled)
                )
            );
            return { embeds: [pageEmbed], components: [components] };
        };

        const msgOptions = getButton(0);
        const msg = await (isInteraction
            ? ctx.deferred
                ? ctx.interaction.followUp({ ...msgOptions, fetchReply: true })
                : ctx.interaction.reply({ ...msgOptions, fetchReply: true })
            : ctx.channel.send({ ...msgOptions, fetchReply: true }));

        const filter = int => int.user.id === author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('end', async () => await msg.edit({ embeds: [embed[page]], components: [] }));
        collector.on('collect', async interaction => {
            if (interaction.user.id !== author.id)
                return await interaction.reply({ content: "You can't use this button", ephemeral: true });

            await interaction.deferUpdate();

            const customId = interaction.customId;
            if (customId === 'fast' || customId === 'last') page = customId === 'fast' ? 0 : embed.length - 1;
            else page += customId === 'back' ? -1 : 1;

            return await interaction.editReply(getButton(page));
        });
    }

    static async buttonReply(int, args, color) {
        const embed = new EmbedBuilder();
        const msg = int.replied
            ? await int.editReply({ embeds: [embed.setColor(color).setDescription(args)] }).catch(() => {})
            : await int.followUp({ embeds: [embed.setColor(color).setDescription(args)] }).catch(() => {});
        setTimeout(async () => {
            if (int && !int.ephemeral) {
                await msg?.delete().catch(() => {});
            }
        }, 10000);
    }

    static async oops(client, ctx, args, color, time) {
        const embed = client.embed()
            .setColor(color.red)
            .setDescription(args)
        return await ctx.sendMessage({ embeds: [embed] }).then(async msg => {
            setTimeout(async () => await msg.delete().catch(() => {}), time ? time : 10000);
        });
    }

    static async sendSuccessMessage(client, ctx, args, color, time) {
        const embed = client.embed()
            .setColor(color.main)
            .setDescription(args)
        return await ctx.sendMessage({ embeds: [embed] }).then(async msg => {
            setTimeout(async () => await msg.delete().catch(() => {}), time ? time : 10000);
        });
    }

    static async sendErrorMessage(client, ctx, args, color, time) {
        const embed = client.embed()
            .setColor(color.red)
            .setDescription(args)
        await ctx.sendMessage({ embeds: [embed] }).then(async msg => {
            setTimeout(async () => await msg.delete().catch(() => {}), time ? time : 10000);
        });
    }

    static async selectWinners(participants, numWinners) {
        let winners = [];
        while (winners.length < numWinners) {
            const randomIndex = Math.floor(Math.random() * participants.length);
            const selected = participants[randomIndex];
            if (!winners.includes(selected)) {
                winners.push(selected);
            }
        }
        return winners;
    }

    static async addCoinsToUser(userId, amount) {
        try {
            let user = await Users.findOne({ userId });
            if (!user) {
                user = new Users({
                    userId,
                    balance: {
                        coin: amount,
                        bank: 0,
                    },
                });
                await user.save();
            } else {
                await Users.updateOne(
                    { userId },
                    { $inc: { 'balance.coin': amount } }
                );
            }
        } catch (error) {
            console.error(`Failed to update balance for user ${userId}:`, error);
        }
    }

    static async endGiveaway(client, color, emoji, message, autopay) {
        if (!message.guild) return;
        if (!client.guilds.cache.get(message.guild.id)) return;

        const data = await GiveawaySchema.findOne({
            guildId: message.guildId,
            messageId: message.id,
        });

        if (!data) return;
        if (data.ended) return;
        if (data.paused) return;

        function getMultipleRandom(arr, number) {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, number);
        }

        let winnerIdArray = [];
        if (data.entered.length >= data.winners) {
            winnerIdArray = getMultipleRandom(data.entered, data.winners);
        } else {
            winnerIdArray = data.entered;
        }

        const disableButton = ActionRowBuilder.from(message.components[0]).setComponents(
            ButtonBuilder.from(message.components[0].components[0]).setLabel(`${data.entered.length}`).setDisabled(true),
            ButtonBuilder.from(message.components[0].components[1]).setDisabled(true)
        );

        const endGiveawayEmbed = EmbedBuilder.from(message.embeds[0])
            .setColor(color.main)
            .setDescription(`Winners: ${data.winners}\nHosted by: <@${data.hostedBy}>`);

        await message.edit({ embeds: [endGiveawayEmbed], components: [disableButton] }).then(async (msg) => {
            await GiveawaySchema.findOneAndUpdate(
                { guildId: data.guildId, channelId: data.channelId, messageId: msg.id },
                { ended: true, winnerId: winnerIdArray }
            );
        });

        // Announce the winners
        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(color.main)
                    .setTitle(`${emoji.mainLeft} Congratulations ${emoji.congratulation} ${emoji.mainRight}`)
                    .setDescription(
                        winnerIdArray.length
                            ? `${winnerIdArray.map(user => `<@${user}>`).join(', ')}! You have won **${client.utils.formatNumber(data.prize)}** ${emoji.coin}`
                            : `No one entered the giveaway for **\`${client.utils.formatNumber(data.prize)}\`**!`
                    ),
            ],
        });
        if (autopay) {
            for (const winner of winnerIdArray) {
                try {

                    await Utils.addCoinsToUser(winner, data.prize);
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(color.main)
                                .setDescription(`**${client.user.username}** has awarded **\`${client.utils.formatNumber(data.prize)}\`** ${emoji.coin} to <@${winner}>.`),
                        ],
                    });
                } catch (err) {
                    console.error(`Error awarding prize to user <@${winner}>:`, err);

                    data.retryAutopay = true;
                    await data.save();
                }
            }
        }
    }
};
