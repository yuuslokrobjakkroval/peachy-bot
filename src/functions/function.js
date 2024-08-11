const { Client, IntentsBitField, Collection, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle, AttachmentBuilder, InteractionCollector } = require('discord.js');
const { prefix } = require('../config');
const fs = require('fs');
const sym = '`';
const syms = sym;
const sym3 = '```';
const one_second = 1000;
const mongoose = require('mongoose');
const { userSchema } = require('../schemas/user');
const User = mongoose.model('User', userSchema);
const gif = require('../functions/gif');
const { createCanvas, loadImage } = require('canvas');
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
    const result = bot.commands;
    return result;
}

function formatCapitalize (val) {
    if (!!val) {
        const words = val.split('_');
        const CapitalizeWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
        return CapitalizeWords.join(' ');
    }
}

function formatUpperCase (val) {
    if (!!val) {
        const words = val.split('_');
        const UpperWords = words.map((word) => word.toUpperCase());
        return UpperWords.join(' ');
    }
}

async function getUser(id) {
    return User.findOne({userId: id});
}

function SimpleEmbed(text){
    return new EmbedBuilder()
        .setColor('Blue')
        .setDescription(text)
}
function customEmbed(){
    return new EmbedBuilder()
}
function advanceEmbed(desc, image, footer, user, color){
    return new EmbedBuilder()
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


function stateMAG(statemag, lvl) {
    const mag = ((statemag * lvl) + 100);
    return mag;
}


module.exports = { formatCapitalize, formatUpperCase, stateMAG, stateMAG, loadImage ,createCanvas ,User, fs, customEmbed, cooldown,  EmbedBuilder, getCollectionButton, oneButton, twoButton, threeButton, fourButton, fiveButton, sleep, getRandomInt, one_second, prefix, getFiles, getUser, SimpleEmbed, blackjackEmbed, gif, advanceEmbed, labelButton, emojiButton, sym, syms, sym3, ButtonStyle, AttachmentBuilder, ComponentType, createCanvas, loadImage, InteractionCollector };