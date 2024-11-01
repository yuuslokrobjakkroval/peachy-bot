const { ActionRowBuilder, ButtonBuilder, CommandInteraction, EmbedBuilder} = require('discord.js');
const Users = require('../schemas/user');
const GiveawaySchema = require('../schemas/giveaway');
const GiveawayShopItemSchema = require('../schemas/giveawayShopItem');
const importantItems = require('../assets/inventory/ImportantItems.js');
const shopItems = require('../assets/inventory/ShopItems.js');
const items = shopItems.flatMap(shop => shop.inventory);
const Fonts = require('../assets/json/fontKelvinch.json');

module.exports = class Utils {
    static getUser(userId) {
        return Users.findOne({ userId }).then(user => { return user; }).catch(error => { console.log(`Error fetching user data: ${error}`); return null });
    }

    static getGiveaway(interaction) {
        return GiveawaySchema.findOne({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: interaction.message.id,
        }).then(giveaway => { return giveaway; }).catch(error => { console.log(`Error fetching giveaway data: ${error}`); return null });
    }

    static getGiveawayShopItem(interaction) {
        return GiveawayShopItemSchema.findOne({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: interaction.message.id,
        }).then(giveaway => { return giveaway; }).catch(error => { console.log(`Error fetching giveaway data: ${error}`); return null });
    }

    static transformText(text, style) {
        let transformedText = '';
        for (let char of text) {
            if (style.toLowerCase() === 'bold') {
                transformedText += Fonts.bold[char];
            } else if (style.toLowerCase() === 'italic') {
                transformedText += Fonts.italic[char];
            } else if (style.toLowerCase() === 'number') {
                transformedText += Fonts.number[char];
            } else {
                transformedText += char;
            }
        }
        return transformedText;
    }

    static cooldown(id, timeout, cdId, cooldowntime, message, cooldowns, prem) {
        if (id === this.client.config.ownerId) {
            return false;
        }

        if (timeout.includes(id)) {
            if (cdId.includes(id)) {
                return true;
            }

            cdId.push(id);

            if (prem.includes(id)) {
                const CD = parseInt(cooldowntime / 2);

                const currentTime = new Date();
                const cooldownEnd = new Date(currentTime.getTime() + CD);
                if (currentTime < cooldownEnd) {
                    const timeLeft = Math.ceil((cooldownEnd - currentTime) / 1000) - 1;
                    message.channel.send({ embeds: [new EmbedBuilder().setColor('Blue').setDescription(`<@${id}> cooldown **<t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>**`)] })
                        .then(cooldownMessage => {
                            setTimeout(() => {
                                cooldownMessage.delete().catch(console.error);
                                cdId.shift();
                            }, timeLeft * 1000);
                        })
                        .catch(console.error);
                    return true;
                }
                return true;
            }

            const cooldownEnd = cooldowns.get(message.guild.id);
            const currentTime = new Date();
            if (currentTime < cooldownEnd) {
                const timeLeft = Math.ceil((cooldownEnd - currentTime) / 1000) - 1;
                message.channel.send({ embeds: [new EmbedBuilder().setColor('Blue').setDescription(`<@${id}> cooldown **<t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>**`)] })
                    .then(cooldownMessage => {
                        setTimeout(() => {
                            cooldownMessage.delete().catch(console.error);
                            cdId.shift();
                        }, timeLeft * 1000);
                    })
                    .catch(console.error);
                return true;
            }
            return true;

        } else {
            if(prem.includes(id)){
                const CD = parseInt(cooldowntime / 2);

                const currentTime = new Date();
                const cooldownEnd = new Date(currentTime.getTime() + CD);
                cooldowns.set(message.guild.id, cooldownEnd);
                timeout.push(id);
                setTimeout(() => {
                    timeout.shift();
                    cdId.shift();
                }, CD - 1000);
                return false;

            }else{
                const currentTime = new Date();
                const cooldownEnd = new Date(currentTime.getTime() + cooldowntime);
                cooldowns.set(message.guild.id, cooldownEnd);
                timeout.push(id);
                setTimeout(() => {
                    timeout.shift();
                    cdId.shift();
                }, cooldowntime - 1000);
                return false;
            }
        }
    }

    static getCooldown(userId, command) {
        return Users.findOne({ userId: userId }).exec()
            .then(user => {
                if (user) {
                    const cooldown = user.cooldowns.find(c => c.name === command);
                    return cooldown ? cooldown.timestamp : 0;
                }
                return 0;
            })
            .catch(error => {
                console.error('Error fetching cooldown:', error);
                return 0;
            });
    }

    static checkCooldown(userId, command, duration) {
        const now = Date.now();

        return Users.findOne({ userId: userId }).exec()
            .then(user => {
                if (user) {
                    const cooldown = user.cooldowns.find(c => c.name === command);
                    if (cooldown) {
                        // Check if the current time minus the timestamp is greater than or equal to the provided duration
                        return now - cooldown.timestamp >= duration;
                    }
                }
                return true;
            })
            .catch(error => {
                console.error('Error checking cooldown:', error);
                return false;
            });
    }

    static updateCooldown(userId, command, duration) {
        const now = Date.now();

        Users.findOne({ userId: userId }).exec()
            .then(user => {
                if (user) {
                    const cooldownIndex = user.cooldowns.findIndex(c => c.name === command);
                    if (cooldownIndex > -1) {
                        user.cooldowns[cooldownIndex].timestamp = now;
                        user.cooldowns[cooldownIndex].duration = duration;
                    } else {
                        user.cooldowns.push({ name: command, timestamp: now, duration: duration });
                    }
                    return user.save();
                }
            })
            .catch(error => {
                console.error('Error updating cooldown:', error);
            });
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

    static formatNumber(num) {
        if (isNaN(num) || num <= 0 || num.toString().includes('.') || num.toString().includes(',')) {
            return num.toLocaleString();
        } else {
            return num.toLocaleString();
        }
    }

    static getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static getRandomNumber(min, max) {
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

    static createButtonRow(...buttons) {
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(buttons);
        return actionRow;
    }

    static labelButton(id, label, style){
        return new ButtonBuilder()
            .setCustomId(`${id}`)
            .setLabel(`${label}`)
            .setStyle(style)
    }

    static emojiButton(id, emoji, style){
        return new ButtonBuilder()
            .setCustomId(`${id}`)
            .setEmoji(`${emoji}`)
            .setStyle(style)
    }

    static oops(client, ctx, args, color, time) {
        const embed = client.embed()
            .setColor(color.danger)
            .setDescription(args);
        return ctx.sendMessage({ embeds: [embed] })
            .then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, time ? time : 10000);
            })
            .catch(error => {
                console.error('Error sending oops message:', error);
            });
    }

    static sendSuccessMessage(client, ctx, args, color, time) {
        const embed = client.embed()
            .setColor(color.main)
            .setDescription(args);
        return ctx.sendMessage({ embeds: [embed] })
            .then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, time ? time : 10000);
            })
            .catch(error => {
                console.error('Error sending success message:', error);
            });
    }

    static sendErrorMessage(client, ctx, args, color, time) {
        const embed = client.embed()
            .setColor(color.danger)
            .setDescription(args);

        return ctx.sendMessage({ embeds: [embed] })
            .then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, time ? time : 10000);
            })
            .catch(error => {
                console.error('Error sending error message:', error);
            });
    }

    static getZodiacSign(zodiacSign, day, month) {
        const zodiacSigns = [
            { sign: 'capricorn', start: [12, 22], end: [1, 19] },
            { sign: 'aquarius', start: [1, 20], end: [2, 18] },
            { sign: 'pisces', start: [2, 19], end: [3, 20] },
            { sign: 'aries', start: [3, 21], end: [4, 19] },
            { sign: 'taurus', start: [4, 20], end: [5, 20] },
            { sign: 'gemini', start: [5, 21], end: [6, 20] },
            { sign: 'cancer', start: [6, 21], end: [7, 22] },
            { sign: 'leo', start: [7, 23], end: [8, 22] },
            { sign: 'virgo', start: [8, 23], end: [9, 22] },
            { sign: 'libra', start: [9, 23], end: [10, 22] },
            { sign: 'scorpio', start: [10, 23], end: [11, 21] },
            { sign: 'sagittarius', start: [11, 22], end: [12, 21] }
        ];

        for (const zodiac of zodiacSigns) {
            const [startMonth, startDay] = zodiac.start;
            const [endMonth, endDay] = zodiac.end;

            if (
                (month === startMonth && day >= startDay) ||
                (month === endMonth && day <= endDay) ||
                (startMonth > endMonth && (month === startMonth || month === endMonth))
            ) {
                return { sign: zodiac.sign, emoji: zodiacSign[zodiac.sign] };
            }
        }
        return null;
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

    static async checkBirthdays(client) {
        console.log('Check Birthday Start');
        try {
            const today = new Date();

            const options = { day: '2-digit', month: 'short' };
            const todayDate = today.toLocaleDateString('en-GB', options).replace('.', '');

            const usersWithBirthdayToday = await Users.find({
                'profile.birthday': todayDate,
                'profile.birthdayAcknowledged': false,
            });

            const birthdayChannel = client.channels.cache.get('1272074580797952116');

            if (!birthdayChannel) {
                console.error(`[Birthday] Birthday channel not found.`);
                return;
            }

            for (const user of usersWithBirthdayToday) {
                const giftBalance = Math.floor(Math.random() * (1000000 - 500000 + 1)) + 500000;
                const [day, month, year] = user.profile.birthday.split('-');
                const xp = parseInt(day) + (new Date(Date.parse(`${month} 1, 2020`)).getMonth() + 1) + parseInt(year.slice(-2));

                const birthdayEmbed = client.embed()
                    .setColor('Green')
                    .setTitle(`🎉 Happy Birthday, ${user.profile.username || user.username}! 🎂`)
                    .setDescription(`On this special day, we celebrate you and all the joy you bring into our lives! May your year ahead be filled with exciting adventures, unforgettable moments, and everything you've ever wished for. Remember, you are loved and cherished by all of us! 🎈`)
                    .addFields(
                        {name: '🎁 Your Birthday Gift:', value: `${giftBalance} coins`, inline: true},
                        {name: '✨ Your Birthday XP:', value:  `${xp} XP`, inline: true}
                    )
                    .setFooter('Have an amazing birthday filled with love and happiness!')
                    .setTimestamp();

                await birthdayChannel.send({ embeds: [birthdayEmbed] });

                user.profile.birthdayAcknowledged = true;
                user.balance.coin += giftBalance;
                user.profile.xp += xp;
                await user.save();
            }
            console.log('Check Birthday Ended');
        } catch (err) {
            console.error(`[Birthday] Error fetching birthdays: ${err.message}`);
        }
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
                client.embed()
                    .setColor(color.main)
                    .setDescription(
                        winnerIdArray.length
                            ? `# Congratulations ${emoji.congratulation}` +
                            `${winnerIdArray.map(user => `<@${user}>`).join(', ')}! You have won **${client.utils.formatNumber(data.prize)}** ${emoji.coin}` +
                            (autopay ? `` : `\n\nto reroll the giveaway, please use\n\`${client.config.prefix.toLowerCase()}reroll ${message.id}\``)
                            : `No one entered the giveaway for **\`${client.utils.formatNumber(data.prize)}\`**!`
                    )
                    .setFooter({ text: 'Better luck next time!', iconURL: client.user.displayAvatarURL() })
            ],
        });
        if (autopay) {
            for (const winner of winnerIdArray) {
                try {

                    await Utils.addCoinsToUser(winner, data.prize);
                    await message.reply({
                        embeds: [
                            client.embed()
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

    static async endGiveawayShopItem(client, color, emoji, message, autoAdd) {

        if (!message.guild) return;
        if (!client.guilds.cache.get(message.guild.id)) return;

        const data = await GiveawayShopItemSchema.findOne({
            guildId: message.guildId,
            messageId: message.id,
        });

        if (!data) return;
        if (data.ended) return;
        if (data.paused) return;

        // Find the item in the inventory based on the itemId
        const category = items.concat(importantItems).filter(c => c.type === data.type); // Adjusted to use data.type
        if (!category) {
            console.error(`Invalid item type specified for winner <@${winner}>.`);
            return;
        }

        const itemInfo = category.find(i => i.id.toLowerCase() === data.itemId.toLowerCase());
        if (!itemInfo) {
            console.error(`No item found with ID ${data.itemId} in category ${data.type} for winner <@${winner}>.`);
            return;
        }

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
            .setThumbnail(client.utils.emojiToImage(itemInfo.emoji))
            .setDescription(`Winners: ${data.winners}\nHosted by: <@${data.hostedBy}>`);

        await message.edit({ embeds: [endGiveawayEmbed], components: [disableButton] }).then(async (msg) => {
            await GiveawayShopItemSchema.findOneAndUpdate(
                { guildId: data.guildId, channelId: data.channelId, messageId: msg.id },
                { ended: true, winnerId: winnerIdArray }
            );
        });

        await message.reply({
            embeds: [
                client.embed()
                    .setColor(color.main)
                    .setThumbnail(client.utils.emojiToImage(itemInfo.emoji))
                    .setDescription(
                        winnerIdArray.length
                            ? `# Congratulations ${emoji.congratulation}` +
                            `${winnerIdArray.map(user => `<@${user}>`).join(', ')}! You have won **${itemInfo.name} \`${client.utils.formatNumber(data.amount)}\`**` +
                            (autoAdd ? `` : `\n\nto reroll the giveaway, please use\n\`${client.config.prefix.toLowerCase()}reroll item ${message.id}\``)
                            : `No one entered the giveaway for ${itemInfo.name} **\`${client.utils.formatNumber(data.amount)}\`** ${itemInfo.emoji}!`
                    )
                    .setFooter({ text: 'Better luck next time!', iconURL: client.user.displayAvatarURL() })
            ],
        });

        if (autoAdd) {
            for (const winner of winnerIdArray) {
                try {
                    const user = await Users.findOne({ userId: winner });
                    if (user) {
                        const itemIndex = user.inventory.findIndex(item => item.id === itemInfo.id);
                        if (itemIndex > -1) {
                            user.inventory[itemIndex].quantity += data.amount;
                        } else {
                            user.inventory.push({ id: itemInfo.id, name: itemInfo.name, quantity: data.amount });
                        }
                        await user.save();

                        await message.reply({
                            embeds: [
                                client.embed()
                                    .setColor(color.main)
                                    .setDescription(`**${client.user.displayName}** has added **${itemInfo.name} ${itemInfo.emoji} \`${data.amount}\`** to <@${winner}>'s inventory.`),
                            ],
                        });
                    }
                } catch (err) {
                    console.error(`Error adding item to user <@${winner}>:`, err);
                    data.retryAutopay = true;
                    await data.save();
                }
            }
        }
    }

};
