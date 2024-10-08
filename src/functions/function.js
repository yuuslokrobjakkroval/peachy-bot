const { Client, IntentsBitField, Collection, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle, AttachmentBuilder, InteractionCollector } = require('discord.js');
const Users = require("../schemas/user.js");
const { prefix } = require('../config');
const fs = require('fs');
const sym = '`';
const sym3 = '```';
const one_second = 1000;
require('dotenv').config();

const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
    ]
});

async function checkCooldown(userId, command, duration) {
    const now = Date.now();

    try {
        const user = await Users.findOne({ userId: userId }).exec();
        if (user) {
            const cooldown = user.cooldowns.find(c => c.name === command);
            if (cooldown) {
                // Check if the current time minus the timestamp is greater than or equal to the provided duration
                return now - cooldown.timestamp >= duration;
            }
        }
        return true;
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return false;
    }
}

async function updateCooldown(userId, command, duration) {
    const now = Date.now();
    try {
        const user = await Users.findOne({ userId: userId }).exec();
        if (user) {
            const cooldownIndex = user.cooldowns.findIndex(c => c.name === command);
            if (cooldownIndex > -1) {
                user.cooldowns[cooldownIndex].timestamp = now;
                user.cooldowns[cooldownIndex].duration = duration;
            } else {
                user.cooldowns.push({ name: command, timestamp: now, duration: duration });
            }
            await user.save();
        }
    } catch (error) {
        console.error('Error updating cooldown:', error);
    }
}

async function getCooldown(userId, command) {
    try {
        const user = await Users.findOne({ userId: userId }).exec();
        if (user) {
            const cooldown = user.cooldowns.find(c => c.name === command);
            return cooldown ? cooldown.timestamp : 0;
        }
        return 0;
    } catch (error) {
        console.error('Error fetching cooldown:', error);
        return 0;
    }
}

function getRandomInt(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getFiles(commandFiles, dir){
    bot.commands = new Collection();
    for (const file of commandFiles) {
        const command = require(`${dir}/${file}`);
        bot.commands.set(command.name, command);
    }
    return bot.commands;
}

async function getUser(id) {
    return Users.findOne({userId: id});
}

function SimpleEmbed(text) {
    return new EmbedBuilder()
        .setColor('Blue')
        .setDescription(text)
}

function customEmbed(){
    return new EmbedBuilder()
}
function advanceEmbed(desc, image, footer, user, color){
    return new user.channel.send()
        .setAuthor({ name: `${user.displayName}`, iconURL: user.displayAvatarURL() })
        .setColor(`${color}`)
        .setDescription(`${desc}`)
        .setImage(`${image}`)
        .setFooter({ text: `${footer}` })
}

function basicEmbed(title, desc, image, footers, color){
    return new EmbedBuilder()
        .setTitle(`${title}`)
        .setColor(`${color}`)
        .setDescription(`${desc}`)
        .setImage(`${image}`)
        .setFooter({ text: `${footers}` })
        .setTimestamp()
}

function emojiButton(id, emoji, style){
    return new ButtonBuilder()
        .setCustomId(`${id}`)
        .setEmoji(`${emoji}`)
        .setStyle(style)
}

function labelButton(id, label, style){
    return new ButtonBuilder()
        .setCustomId(`${id}`)
        .setLabel(`${label}`)
        .setStyle(style)
}

function oneButton(allButton){
    return new ActionRowBuilder().addComponents(allButton);
}

function twoButton(one, two){
    return new ActionRowBuilder().addComponents(one, two);
}

function threeButton(one, two, three){
    return new ActionRowBuilder().addComponents(one, two, three);
}

function fourButton(one, two, three, four){
    return new ActionRowBuilder().addComponents(one, two, three, four);
}

function fiveButton(one, two, three, four, five){
    return new ActionRowBuilder().addComponents(one, two, three, four, five);
}

function blackjackEmbed(amount, text, body, text2, body2, result, user, color, client){
    if(typeof color == Number){
        color = 'Yellow';
    }
    return new EmbedBuilder()
        .setAuthor({ name: `${user.displayName} you bet ${amount}$ to play bear jenh`, iconURL: user.displayAvatarURL() })
        .setColor(`${color.toString()}`)
        .addFields(
            { name: `${client.user.displayName} [${text}]`, value: `${body}`, inline: true },
            { name: `${user.displayName} [${text2}]`, value: `${body2}`, inline: true },
        )
        .setFooter({ text: `${result}` })
}

function getCollectionButton(mgs, timeout){
    return mgs.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: timeout,
    });
}

function cooldown(id, timeout, cdId, cooldowntime, message, cooldowns, prem) {
    if (id == process.env.devId) {
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
                message.channel.send({ embeds: [SimpleEmbed(`<@${id}> cooldown **<t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>**`)] })
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
            message.channel.send({ embeds: [SimpleEmbed(`<@${id}> cooldown **<t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>**`)] })
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

function getZodiacSign(zodiacSign, day, month) {
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

function getLetterEmoji() {

}

function getNumberEmoji(client, rank) {
    switch (rank) {
        case 1:
            return emoji.number.one;
        case 2:
            return emoji.number.two;
        case 3:
            return emoji.number.three;
        case 4:
            return emoji.number.four;
        case 5:
            return emoji.number.five;
        case 6:
            return emoji.number.six;
        case 7:
            return emoji.number.seven;
        case 8:
            return emoji.number.eight;
        case 9:
            return emoji.number.nine;
        default:
            return null;
    }
}

module.exports = { getLetterEmoji, getNumberEmoji, getZodiacSign, checkCooldown, updateCooldown, getCooldown, fs, customEmbed, cooldown,  EmbedBuilder, getCollectionButton, oneButton, twoButton, threeButton, fourButton, fiveButton, sleep, getRandomInt, one_second, prefix, getFiles, getUser, SimpleEmbed, blackjackEmbed, advanceEmbed, labelButton, emojiButton, sym, sym3, ButtonStyle, AttachmentBuilder, ComponentType, InteractionCollector };