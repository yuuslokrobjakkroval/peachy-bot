const { ActionRowBuilder, ButtonBuilder, CommandInteraction, EmbedBuilder, PermissionsBitField} = require('discord.js');
const Users = require('../schemas/user');
const GiveawaySchema = require('../schemas/giveaway');
const GiveawayShopItemSchema = require('../schemas/giveawayShopItem');
const importantItems = require('../assets/inventory/ImportantItems.js');
const shopItems = require('../assets/inventory/ShopItems.js');
const canvafy = require("canvafy");
const globalConfig = require("./Config");
const gif = require("./Gif");
const emoji = require("./Emoji");
const moment = require("moment");
const items = shopItems.flatMap(shop => shop.inventory);

module.exports = class Utils {

    static getUser(userId) {
        return Users.findOne({ userId }).then(user => { return user; }).catch(error => { console.log(`Error fetching user data: ${error}`); return null });
    }

    static getWelcomeMessage(client, member) {
        const memberCount = member.guild.memberCount;
        const guildName = member.guild.name;

        return client.embed()
            .setColor(client.color.main)
            .setDescription(`# **WELCOME TO ${guildName}** ${emoji.main.signature}\n\n${emoji.border.topLeft}   ${client.utils.getLoopElement(emoji.border.bottomMiddle, 12)}   ${emoji.border.topRight}
            
            > **${emoji.channel.announce}** : <#${globalConfig.channel.announcement}>
            > **${emoji.channel.rule}** : <#${globalConfig.channel.rule}>
            > **${emoji.channel.role}** : <#${globalConfig.channel.role}>
            > **${emoji.channel.booster}** : <#${globalConfig.channel.booster}>
            > **${emoji.channel.giveaway}** : <#${globalConfig.channel.giveaways}>
            
            ${emoji.border.bottomLeft}   ${client.utils.getLoopElement(emoji.border.bottomMiddle, 12)}   ${emoji.border.bottomRight}\n\n**USER INFO** <@${member.id}>\n\n**NOW WE HAVE ${memberCount} MEMBERS**
        `)
            .setImage('https://i.imgur.com/MTOqT51.jpg')
            .setFooter({text: 'We hope you enjoy your stay!'})
            .setTimestamp();
    }

    static getInviteMessage(client, member, invite, inviter) {
        const memberCount = member.guild.memberCount;
        const accountCreationDate = moment(member.user.createdAt).fromNow();

        return client.embed()
            .setColor(client.color.main)
            .setThumbnail('https://i.imgur.com/jRjHmwW.gif')
            .setDescription(`## **Heyoo <@${member.user.id}>** ${emoji.main.signature}\nYou has joined the server ${emoji.congratulation}`)
            .addFields([
                { name: `${emoji.inviteTracker.inviteBy} 𝑰𝒏𝒗𝒊𝒕𝒆 𝑩𝒚`, value: `<@${inviter.id}>`, inline: false },
                { name: `${emoji.inviteTracker.inviteCode} 𝑰𝒏𝒗𝒊𝒕𝒆 𝑪𝒐𝒅𝒆`, value: `**https://discord.gg/${invite.code}**`, inline: false },
                { name: `${emoji.inviteTracker.inviteStats} 𝑰𝒏𝒗𝒊𝒕𝒆𝒅 𝑴𝒆𝒎𝒃𝒆𝒓`, value: `${invite.uses} 𝑴𝒆𝒎𝒃𝒆𝒓𝒔`, inline: false },
                { name: `${emoji.inviteTracker.memberCreated} 𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝑫𝒂𝒕𝒆`, value: `${accountCreationDate}`, inline: false },
                { name: `${emoji.inviteTracker.inviteMember} 𝑴𝒆𝒎𝒃𝒆𝒓𝒔`, value: `${memberCount} 𝑴𝒆𝒎𝒃𝒆𝒓𝒔`, inline: false }
            ])
            .setImage('https://i.imgur.com/XiZrSty.gif')
            .setFooter({
                text: `Invite Tracker | Powered by ${client.user.displayName}`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();
    }

    static getGoodbyeMessage(client, member) {
        const memberCount = member.guild.memberCount;
        const guildName = member.guild.name;

        return client.embed()
            .setColor(client.color.danger)
            .setDescription(`# **Goodbye from ${guildName}** ${emoji.main.signature}\n\nWe're sad to see you go, <@${member.id}> ${emoji.channel.poof}\n\n**NOW WE HAVE ${memberCount} MEMBERS LEFT**`)
            .setImage('https://i.imgur.com/t2s3fNF.jpg')
            .setFooter({text: 'Goodbye! We hope to see you again soon.'})
            .setTimestamp();
    }

    static calculateNextLevelXpBonus(level) {
        const base = 1000;
        const scalingFactor = 1.5;
        return Math.floor(base * Math.pow(scalingFactor, level - 1));
    }

    static getCheckingUser(client, message, user, color, emoji,  prefix) {
        const congratulations = [emoji.congratulation, emoji.peachCongratulation, emoji.gomaCongratulation];

        if (user?.verification?.isBanned) {
            return;
        }

        const now = new Date();
        if (user?.verification?.timeout?.expiresAt && user.verification.timeout.expiresAt > now) {
            const remainingTime = user.verification.timeout.expiresAt - now; // Remaining time in milliseconds

            // Calculate hours, minutes, and seconds
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            // Construct the remaining time string
            let timeString = '';
            if (hours > 0) {
                timeString += `${hours} hr${hours > 1 ? 's' : ''}`;
            }
            if (minutes > 0) {
                if (timeString) timeString += ', ';
                timeString += `${minutes} min${minutes > 1 ? 's' : ''}`;
            }
            if (seconds > 0 || timeString === '') {
                if (timeString) timeString += ', ';
                timeString += `${seconds} sec${seconds > 1 ? 's' : ''}`;
            }

            const embed = client.embed()
                .setColor(color.danger)
                .setDescription(`You are in timeout for: \`${user.verification.timeout.reason || 'No reason provided'}\`.\nTimeout ends in **${timeString}**.`)

            return message.channel.send({ embeds: [embed] });
        }

        if (user) {
            const now = Date.now();
            const xpCooldown = 30000; // 30 seconds cooldown

            // Check if XP can be gained
            if (!user.profile.lastXpGain || now - user.profile.lastXpGain >= xpCooldown) {
                let xpGained = message.content.startsWith(prefix) || message.content.startsWith(prefix.toLowerCase())
                    ? client.utils.getRandomNumber(20, 25)
                    : client.utils.getRandomNumber(10, 15);

                // Update user profile with gained XP
                user.profile.xp += xpGained;
                user.profile.lastXpGain = now;

                const nextLevelXp = client.utils.calculateNextLevelXpBonus(user.profile.level);

                // Check if the user has leveled up
                if (user.profile.xp >= nextLevelXp) {
                    user.profile.xp -= nextLevelXp;
                    user.profile.level += 1;
                    user.profile.levelXp = client.utils.calculateNextLevelXpBonus(user.profile.level);
                    const celebrationCoin = user.profile.level * 250000;

                    // Update user's balance
                    user.balance.coin += celebrationCoin;

                    const levelUp = new canvafy.LevelUp()
                        .setAvatar(message.author.displayAvatarURL({format: 'png', size: 512}))
                        .setUsername(`${message.author.username}`, '#000000')
                        .setBorder('#8BD3DD')
                        .setBackground("image", gif.backgroundLevel)
                        .setLevels(user.profile.level - 1, user.profile.level)
                        .build();

                    levelUp.then(levelUpImage => {
                        const levelImage = {
                            attachment: levelUpImage,
                            name: 'level-up.png',
                        };

                        const embed = client.embed()
                            .setColor(color.main)
                            .setTitle(`${message.author.displayName} - 𝐋𝐄𝐕𝐄𝐋 𝐔𝐏 !`)
                            .setDescription(`Congratulations ${client.utils.getRandomElement(congratulations)} !!!\nYou leveled up to level ${user.profile.level}!\nYou have been awarded ${client.utils.formatNumber(celebrationCoin)} ${emoji.coin}.`)
                            .setThumbnail(message.author.displayAvatarURL({format: 'png', size: 512}))
                            .setImage('attachment://level-up.png');

                        message.channel.send({
                            embeds: [embed],
                            files: [levelImage],
                        }).catch(error => {
                            console.error("Error sending level up message:", error);
                        });
                    }).catch(error => {
                        console.error("Error creating level up image:", error);
                        message.channel.send("You leveled up, but there was an error creating the level-up image!");
                    });
                }

                user.save().catch(err => {
                    console.error("Error saving user data:", err);
                });
            }
        }
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

    static getCheckPermission(ctx, userId, permission) {
        try {
            ctx.guild.members.fetch(userId).then(member => {
                return member.permissions.has(PermissionsBitField.Flags[permission]);
            })
        } catch (error) {
            console.error('Error fetching member:', error);
            return false; // Return false or handle error appropriately
        }
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
            })
            .catch(error => {
                console.error('Error fetching cooldown:', error);
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
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        } else {
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        }
    }

    static formatColor(hex) {
        if (typeof hex !== 'number') {
            throw new Error('Input must be a number');
        }
        const hexString = hex.toString(16).toUpperCase();
        const paddedHexString = hexString.padStart(6, '0');
        return `#${paddedHexString}`;
    }

    static getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getLoopElement(item, repeatCount) {
        let result = "";

        for (let i = 0; i < repeatCount; i++) {
            result += item;
        }

        return result;
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

    static linkButton(label, link){
        return new ButtonBuilder()
            .setLabel(`${label}`)
            .setStyle(5)
            .setURL(`${link}`)
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

    static fullOptionButton(id, emoji, label, style, disabled = false) {
        const button = new ButtonBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(style)
            .setDisabled(disabled);

        if (emoji) {
            button.setEmoji(emoji);
        }

        return button;
    }

    static createButtonRow(...buttons) {
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(buttons);
        return actionRow;
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

    static getAvatarDecoration(useId) {
        switch (useId) {
            case '966688007493140591': // KYUU
                return 'https://i.imgur.com/b0fG2wu.png'
            case '946079190971732041': // KEO
                return 'https://i.imgur.com/Hggcevl.png'
            case '1259714830483329065': // KOL
                return 'https://i.imgur.com/11JtCud.png'
            default:
                return;
        }
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

        collector.on('end', async () => {
            const botPermissions = msg.channel.permissionsFor(msg.guild.me);

            if (!botPermissions || !botPermissions.has('ManageMessages')) {
                return;
            }

            try {
                await msg.reactions.removeAll();
            } catch (error) {
                console.error('Failed to remove reactions:', error);
            }
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

    static stickerToImage(sticker) {
        const stickerRegex = /<:[a-zA-Z0-9_]+:(\d+)>|<a:[a-zA-Z0-9_]+:(\d+)>/;
        const match = sticker.match(stickerRegex);
        if (match) {
            const stickerId = match[1] || match[2];
            return `https://cdn.discordapp.com/stickers/${stickerId}.png`;
        } else {
            // Fallback to null if no valid sticker ID is found
            return null;
        }
    }

    static getDelayUntil7PM() {
        const now = new Date();
        const sevenPM = new Date();
        sevenPM.setHours(19, 0, 0, 0); // 7:00 PM today
        if (now > sevenPM) {
            sevenPM.setDate(sevenPM.getDate() + 1);
        }

        return sevenPM - now;
    }

    static async checkBirthdays(client) {
        console.log('Check Birthday Start');
        try {
            // Get today's date in the format DD MMM
            const today = new Date();
            const todayDate = `${today.getDate().toString().padStart(2, '0')} ${today.toLocaleString('en-US', { month: 'short' })}`;

            // Find users whose birthdays match today's date and are not yet acknowledged
            const usersWithBirthdayToday = await Users.find({
                'profile.birthday': todayDate,
                'profile.birthdayAcknowledged': false,
            });

            console.log('Users with birthdays today:', usersWithBirthdayToday);

            // Fetch the birthday channel
            const birthdayChannel = await client.channels.fetch('1272074580797952116').catch(err => {
                console.error('[Birthday] Error fetching birthday channel:', err.message);
            });

            if (!birthdayChannel) {
                console.error(`[Birthday] Birthday channel not found or inaccessible.`);
                return;
            }

            // Process each user with a birthday today
            for (const user of usersWithBirthdayToday) {
                try {
                    // Calculate random gift balance and XP
                    const giftBalance = Math.floor(Math.random() * (1000000 - 500000 + 1)) + 500000;
                    const [day, month, year] = user.profile.birthday.split('-');
                    const xp = parseInt(day) + (new Date(Date.parse(`${month} 1, 2020`)).getMonth() + 1) + parseInt(year.slice(-2));

                    // Create the birthday embed
                    const birthdayEmbed = client.embed()
                        .setColor(client.color.main)
                        .setTitle(`🎉 Happy Birthday, ${user.profile.username || user.username}! 🎂`)
                        .setDescription(`On this special day, we celebrate you and all the joy you bring into our lives!`)
                        .addFields([
                            { name: '🎁 Your Birthday Gift:', value: `${giftBalance} coins`, inline: true },
                            { name: '✨ Your Birthday XP:', value: `${xp} XP`, inline: true }
                        ])
                        .setFooter({ text: 'Have an amazing birthday filled with love and happiness!' })
                        .setTimestamp();

                    console.log('Constructed Birthday Embed:', birthdayEmbed);

                    // Update user profile: mark birthday acknowledged and add rewards
                    user.profile.birthdayAcknowledged = true;
                    user.balance.coin += giftBalance;
                    user.profile.xp += xp;

                    await user.save();
                    console.log(`User ${user.profile.username || user.username} updated successfully.`);

                    // Send the birthday message to the channel
                    await birthdayChannel.send({ embeds: [birthdayEmbed] });
                    console.log('Birthday message sent successfully.');
                } catch (userError) {
                    console.error(`[Birthday] Error processing user ${user._id}: ${userError.message}`);
                }
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
                            ? `# Congratulations ${emoji.congratulation}\n${winnerIdArray.map(user => `<@${user}>`).join(', ')}! You have won **${client.utils.formatNumber(data.prize)}** ${emoji.coin} ${autopay ? `` : `\n\nto reroll the giveaway, please use\n\`${globalConfig.prefix.toLowerCase()}reroll ${message.id}\``}`
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
                                .setDescription(`**${client.user.username}** has awarded **${client.utils.formatNumber(data.prize)}** ${emoji.coin} to <@${winner}>.`),
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

        await message.edit({embeds: [endGiveawayEmbed], components: [disableButton]}).then(async (msg) => {
            await GiveawayShopItemSchema.findOneAndUpdate(
                {guildId: data.guildId, channelId: data.channelId, messageId: msg.id},
                {ended: true, winnerId: winnerIdArray}
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
                            (autoAdd ? `` : `\n\nto reroll the giveaway, please use\n\`${globalConfig.prefix.toLowerCase()}reroll item ${message.id}\``)
                            : `No one entered the giveaway for ${itemInfo.name} **\`${client.utils.formatNumber(data.amount)}\`** ${itemInfo.emoji}!`
                    )
                    .setFooter({text: 'Better luck next time!', iconURL: client.user.displayAvatarURL()})
            ],
        });

        if (autoAdd) {
            for (const winner of winnerIdArray) {
                try {
                    const user = await Users.findOne({userId: winner});
                    if (user) {
                        const itemIndex = user.inventory.findIndex(item => item.id === itemInfo.id);
                        if (itemIndex > -1) {
                            user.inventory[itemIndex].quantity += data.amount;
                        } else {
                            user.inventory.push({id: itemInfo.id, name: itemInfo.name, quantity: data.amount});
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
