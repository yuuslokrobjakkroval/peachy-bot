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

function xpToLevel(xp){
    let lvl = 1;
    let rateXp = 1001;
    while(xp >= rateXp){
        lvl += 1;
        rateXp *= 1.5;
    }
    return lvl;
}
function xpToRateXp(xp){
    let lvl = 1;
    let rateXp = 1001;
    while(xp >= rateXp){
        lvl += 1;
        rateXp *= 1.5;
    }
    const RateXP = parseInt(rateXp);
    return RateXP.toLocaleString();
}

function checkRankAnimalById(animal_id){
    const match = animal_id.match(/^(\d+)_/);
    const id = parseInt(match[1]);
    for(let i = 1; i <= 99; i++){
        if(i == id){
            return gif[`animal_rank_${i}`];
        }
    }
    return '';
}
function checkPointAnimalById(animal_id){
    const match = animal_id.match(/^(\d+)_/);
    const id = parseInt(match[1]);
    if(id == 1){
        return '1';
    }else if(id == 2){
        return '5';
    }else if(id == 3){
        return '20';
    }else if(id == 4){
        return '250';
    }else if(id == 5){
        return '3,000';
    }else if(id == 6){
        return '10,000';
    }else if(id == 7){
        return '20,000';
    }else if(id == 8){
        return '100,000';
    }else if(id == 9){
        return '500';
    }else if(id == 10){
        return '25,000';
    }else if(id == 11){
        return '500';
    }else if(id == 12){
        return '30,000';
    }else if(id == 13){
        return '200,000';
    }else if(id == 14){
        return '500,000';
    }else if(id == 15){
        return '500,000';
    }else if(id == 16){
        return '500,000';
    }else if(id == 17){
        return '500,000';
    }else if(id == 18){
        return '500,000';
    }else if(id == 19){
        return '500,000';
    }else if(id == 20){
        return '500,000';
    }else if(id == 21){
        return '500,000';
    }else if(id == 22){
        return '500,000';
    }else if(id == 23){
        return '500,000';
    }else if(id == 25){
        return '500,000';
    }else if(id == 26){
        return '10,000';
    }

    return '';
}
function checkSellAnimalById(animal_id){
    const match = animal_id.match(/^(\d+)_/);
    const id = parseInt(match[1]);
    if(id == 1){
        return '1';
    }else if(id == 2){
        return '3';
    }else if(id == 3){
        return '10';
    }else if(id == 4){
        return '250';
    }else if(id == 5){
        return '5,000';
    }else if(id == 6){
        return '15,000';
    }else if(id == 7){
        return '30,000';
    }else if(id == 8){
        return '250,000';
    }else if(id == 9){
        return '6,000';
    }else if(id == 10){
        return '50,000';
    }else if(id == 11){
        return '1,000';
    }else if(id == 12){
        return '50,000';
    }else if(id == 13){
        return '300,000';
    }else if(id == 14){
        return '1,000,000';
    }else if(id == 15){
        return '500,000';
    }else if(id == 16){
        return '500,000';
    }else if(id == 17){
        return '500,000';
    }else if(id == 18){
        return '500,000';
    }else if(id == 19){
        return '500,000';
    }else if(id == 20){
        return '500,000';
    }else if(id == 21){
        return '500,000';
    }else if(id == 22){
        return '500,000';
    }else if(id == 23){
        return '500,000';
    }else if(id == 25){
        return '500,000';
    }else if(id == 26){
        return '50,000';
    }

    return '';
}
function getAnimalNameByName(name_animal){
    for(let i = 1; i <= 99; i++){
        for(let y = 1; y <= 99; y++){
            if(gif[`rank_${i}_${y}_name`] == name_animal){
                return name_animal;
            }
        }
    }
    return '';
}
function getAnimalIdByName(name_animal){
    for(let i = 1; i <= 99; i++){
        for(let y = 1; y <= 99; y++){
            if(gif[`rank_${i}_${y}_name`] == name_animal){
                return `${i}_${y}`;
            }
        }
    }
    return '';
}
async function checkOwnAnimal(name_animal, id){
    const userData = await getUser(id);
    for(let i = 1; i <= 99; i++){
        for(let y = 1; y <= 99; y++){
            if(`${gif[`rank_${i}_${y}_name`]}` == `${name_animal}`){
                if(userData.sat[`sat_${i}_${y}_h`] > 0){
                    return true;
                }
            }
        }
    }
    return false;
}

function toSuperscript(number, maxNumber) {
    const superscriptDigits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    if (maxNumber >= 10 && maxNumber <= 99) {
        if(number >= 10) {
            const paddedNumber = `${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else{
            const paddedNumber = `0${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }
    }else if(maxNumber >= 100 && maxNumber <= 999) {
        if(number >= 100){
            const paddedNumber = `${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 10){
            const paddedNumber = `0${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else{
            const paddedNumber = `00${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }
    }else if (maxNumber >= 1000 && maxNumber <= 9999) {
        if(number >= 1000) {
            const paddedNumber = `${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 100){
            const paddedNumber = `0${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 10){
            const paddedNumber = `00${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else{
            const paddedNumber = `000${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }
    }else if (maxNumber >= 10000 && maxNumber <= 99999) {
        if(number >= 10000) {
            const paddedNumber = `${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 1000){
            const paddedNumber = `0${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 100){
            const paddedNumber = `00${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 10){
            const paddedNumber = `000${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else{
            const paddedNumber = `0000${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }
    }else if (maxNumber >= 100000 && maxNumber <= 999999) {
        if(number >= 100000) {
            const paddedNumber = `${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 10000){
            const paddedNumber = `0${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 1000){
            const paddedNumber = `00${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 100){
            const paddedNumber = `000${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else if(number >= 10){
            const paddedNumber = `0000${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }else{
            const paddedNumber = `00000${number}`;
            return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
        }
    }else{
        const paddedNumber = `${number}`;
        return paddedNumber.split('').map(digit => superscriptDigits[digit]).join('');
    }
}

function mileToHour(time){
    let hours = 0;
    let mins = 0;
    let secs = 0;

    while(time != 0){
        if(time >= 1000){
            secs += 1;
            time -= 1000;
        }
        if(secs >= 60){
            mins += 1;
            secs -= 60;
        }
        if(mins >= 60){
            hours += 1;
            mins -= 60;
        }
    }
    return hours;
}
function mileToMin(time){
    let hours = 0;
    let mins = 0;
    let secs = 0;

    while(time != 0){
        if(time >= 1000){
            secs += 1;
            time -= 1000;
        }
        if(secs >= 60){
            mins += 1;
            secs -= 60;
        }
        if(mins >= 60){
            hours += 1;
            mins -= 60;
        }
    }
    return mins;
}
function mileToSec(time){
    let hours = 0;
    let mins = 0;
    let secs = 0;

    while(time != 0){
        if(time >= 1000){
            secs += 1;
            time -= 1000;
        }
        if(secs >= 60){
            mins += 1;
            secs -= 60;
        }
        if(mins >= 60){
            hours += 1;
            mins -= 60;
        }
    }
    return secs;
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
    const result = bot.commands;
    return result;
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

async function getimageAnimal(animal_iamge, animal_level, animal_M_HP, animal_health, animal_M_SM, animal_SM, player1_name, enemy_image, enemy_level, enemy_M_HP, enemy_health, enemy_M_SM, enemy_SM, player2_name, theme){

    if(animal_health > animal_M_HP){
        animal_health = animal_M_HP
    }
    if(enemy_health > enemy_M_HP){
        enemy_health = enemy_M_HP
    }

    const animal_main_HP = animal_M_HP;
    const animal_main_SM = animal_M_SM;

    const progress_animal_HP = parseInt((animal_health/animal_main_HP)*100);
    const progress_animal_SM = parseInt((animal_SM/animal_main_SM)*100);

    const enemy_main_HP = enemy_M_HP;
    const enemy_main_SM = enemy_M_SM;

    const progress_enemy_HP = parseInt((enemy_health/enemy_main_HP)*100);
    const progress_enemy_SM = parseInt((enemy_SM/enemy_main_SM)*100);


    const width = 500;
    const height = 200;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    try{
        const background = await loadImage(theme);
        ctx.drawImage(background ,0, 0, canvas.width, canvas.height);
    }catch(error){
        console.log('dragon background image error');
    }

    //check win or lose
    if(enemy_health == 0){
        ctx.fillStyle = 'Yellow';
        ctx.font = 'bold 15px Arial';
        ctx.fillText(`WIN`, 180, 65);
    }else if(animal_health == 0){
        ctx.fillStyle = 'Yellow';
        ctx.font = 'bold 15px Arial';
        ctx.fillText(`WIN`, 292, 65);
    }

    //image animal
    const animal_width = 90;
    const animal_height = 90;

    const animal_x = 90;
    const animal_y = 70;

    try{
        const animalImage = await loadImage(animal_iamge);
        ctx.drawImage(animalImage, animal_x, animal_y, animal_width, animal_height);
    }catch(error){
        console.log('dragon animal image error');
    }

    //option progress bar animal SM
    const animal_SM_progress_width = 200;
    const animal_SM_progress_height = 20;

    const animal_SM_prosition_x = 10;
    const animal_SM_prosition_y = 30;

    // Draw frame [] animal SM
    ctx.strokeStyle = 'White';
    ctx.strokeRect(animal_SM_prosition_x, animal_SM_prosition_y, animal_SM_progress_width, animal_SM_progress_height);

    // Draw progress bar animal SM
    const animal_SM_progressBarWidth = (animal_SM_progress_width - 198.04) * progress_animal_SM;
    ctx.fillStyle = '#0151AB';
    ctx.fillRect(animal_SM_prosition_x+2, animal_SM_prosition_y+2, animal_SM_progressBarWidth, animal_SM_progress_height - 4);
    ctx.fillStyle = 'White';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${animal_SM}/${animal_M_SM}`, animal_SM_prosition_x+10, animal_SM_prosition_y+15);



    //option progress bar animal HP
    const animal_progress_width = 200;
    const animal_progress_height = 20;

    const animal_prosition_x = 10;
    const animal_prosition_y = 10;

    // Draw frame [] animal HP
    ctx.strokeStyle = 'White';
    ctx.strokeRect(animal_prosition_x, animal_prosition_y, animal_progress_width, animal_progress_height);

    // Draw progress bar animal HP
    const animal_progressBarWidth = (animal_progress_width - 198.04) * progress_animal_HP;
    ctx.fillStyle = '#BD0202';
    ctx.fillRect(animal_prosition_x+2, animal_prosition_y+2, animal_progressBarWidth, animal_progress_height - 4);
    ctx.fillStyle = 'White';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${animal_health}/${animal_M_HP}`, animal_prosition_x+10, animal_prosition_y+15);

    // Animal name
    ctx.font = 'bold 15px Arial';
    ctx.fillText(`${player1_name}`, 80, 190);

    // Frame [] state animal
    const animal_frame_progress_width = 80;
    const animal_frame_progress_height = 20;

    const animal_frame_box_pos_x = 10;
    const animal_frame_box_pos_y = 50;

    ctx.strokeStyle = 'White';
    ctx.strokeRect(animal_frame_box_pos_x, animal_frame_box_pos_y, animal_frame_progress_width, animal_frame_progress_height);

    //Text level animal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';

    ctx.fillText(`LEVEL: ${animal_level}`, animal_frame_box_pos_x+10, animal_frame_box_pos_y+15);
    //ctx.fillText(`PW: ${animal_PW}`, animal_frame_box_pos_x+150, animal_frame_box_pos_y+15);
    //ctx.fillText(`ITEM `, 115, 115);
    //ctx.fillText(`SKILL ${animal_skill}`, 115, 135);












    //image enemy
    const enemy_width = 95;
    const enemy_height = 90;

    const enemy_x = 310;
    const enemy_y = 70;

    try{
        const enemyImage = await loadImage(enemy_image);
        ctx.drawImage(enemyImage, enemy_x, enemy_y, enemy_width, enemy_height);
    }catch(error){
        console.log('dragon enemy image error');
    }

    //option progress bar enemy SM
    const enemy_SM_progress_width = 200;
    const enemy_SM_progress_height = 20;

    const enemy_SM_prosition_x = 290;
    const enemy_SM_prosition_y = 30;

    // Draw frame [] enemy SM
    ctx.strokeStyle = 'White';
    ctx.strokeRect(enemy_SM_prosition_x, enemy_SM_prosition_y, enemy_SM_progress_width, enemy_SM_progress_height);

    // Draw progress bar enemy SM
    const enemy_SM_progressBarWidth = (enemy_SM_progress_width - 198.04) * progress_enemy_SM;
    ctx.fillStyle = '#0151AB';
    ctx.fillRect(enemy_SM_prosition_x+2, enemy_SM_prosition_y+2, enemy_SM_progressBarWidth, enemy_SM_progress_height-4);
    ctx.fillStyle = 'White';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${enemy_SM}/${enemy_M_SM}`, enemy_SM_prosition_x+10, enemy_SM_prosition_y+15);



    //option progress bar enemy
    const enemy_progress_width = 200;
    const enemy_progress_height = 20;

    const enemy_prosition_x = 290;
    const enemy_prosition_y = 10;

    // Draw frame [] enemy HP
    ctx.strokeStyle = 'White';
    ctx.strokeRect(enemy_prosition_x, enemy_prosition_y, enemy_progress_width, enemy_progress_height);

    // Draw progress bar enemy HP
    const enemy_progressBarWidth = (enemy_progress_width - 198.04) * progress_enemy_HP;
    ctx.fillStyle = '#BD0202';
    ctx.fillRect(enemy_prosition_x+2, enemy_prosition_y+2, enemy_progressBarWidth, enemy_progress_height - 4);
    ctx.fillStyle = 'White';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${enemy_health}/${enemy_M_HP}`, enemy_prosition_x+10, enemy_prosition_y+15);

    // Enemy name
    ctx.font = 'bold 15px Arial';
    ctx.fillText(`${player2_name}`, 320, 190);

    // Frame [] state enemy
    const enemy_frame_progress_width = 80;
    const enemy_frame_progress_height = 20;

    const enemy_frame_box_pos_x = 410;
    const enemy_frame_box_pos_y = 50;

    ctx.strokeStyle = 'White';
    ctx.strokeRect(enemy_frame_box_pos_x, enemy_frame_box_pos_y, enemy_frame_progress_width, enemy_frame_progress_height);

    //Text level animal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';

    ctx.fillText(`LEVEL: ${enemy_level}`, enemy_frame_box_pos_x+10, enemy_frame_box_pos_y+15);
    //ctx.fillText(`PW: ${enemy_PW}`, 395, 95);
    //ctx.fillText(`ITEM `, 395, 115);
    //ctx.fillText(`SKILL ${enemy_skill}`, 395, 135);

    return canvas.toBuffer();
}

async function getSatImage(sat1, sat2, sat3, ene1, ene2, ene3, streak, ene_streak, userid, oppoid){
    if(sat1.hp < 0){
        sat1.hp = 0;
    }
    if(sat1.left_hp > sat1.main_hp){
        sat1.left_hp = sat1.main_hp;
    }
    if(sat1.wp < 0){
        sat1.wp = 0;
    }
    if(sat1.left_wp > sat1.main_wp){
        sat1.left_wp = sat1.main_wp;
    }

    if(sat2.hp < 0){
        sat2.hp = 0;
    }
    if(sat2.left_hp > sat2.main_hp){
        sat2.left_hp = sat2.main_hp;
    }
    if(sat2.wp < 0){
        sat2.wp = 0;
    }
    if(sat2.left_wp > sat2.main_wp){
        sat2.left_wp = sat2.main_wp;
    }

    if(sat3.hp < 0){
        sat3.hp = 0;
    }
    if(sat3.left_hp > sat3.main_hp){
        sat3.left_hp = sat3.main_hp;
    }
    if(sat3.wp < 0){
        sat3.wp = 0;
    }
    if(sat3.left_wp > sat3.main_wp){
        sat3.left_wp = sat3.main_wp;
    }

    if(ene1.hp < 0){
        ene1.hp = 0;
    }
    if(ene1.left_hp > ene1.main_hp){
        ene1.left_hp = ene1.main_hp;
    }
    if(ene1.wp < 0){
        ene1.wp = 0;
    }
    if(ene1.left_wp > ene1.main_wp){
        ene1.left_wp = ene1.main_wp;
    }

    if(ene2.hp < 0){
        ene2.hp = 0;
    }
    if(ene2.left_hp > ene2.main_hp){
        ene2.left_hp = ene2.main_hp;
    }
    if(ene2.wp < 0){
        ene2.wp = 0;
    }
    if(ene2.left_wp > ene2.main_wp){
        ene2.left_wp = ene2.main_wp;
    }

    if(ene3.hp < 0){
        ene3.hp = 0;
    }
    if(ene3.left_hp > ene3.main_hp){
        ene3.left_hp = ene3.main_hp;
    }
    if(ene3.wp < 0){
        ene3.wp = 0;
    }
    if(ene3.left_wp > ene3.main_wp){
        ene3.left_wp = ene3.main_wp;
    }

    let sat1_hp_increase = 0;
    let sat1_hp = sat1.hp;
    let sat1_hp_left = sat1.left_hp;
    if(sat1.hp > sat1.main_hp){
        sat1_hp_increase = sat1.hp - sat1.main_hp;
        sat1_hp = sat1.main_hp;
        sat1_hp_left = sat1.main_hp;
        if(sat1_hp_increase > sat1.main_hp){
            sat1_hp_increase = sat1.main_hp;
        }
    }
    if(sat1.wp > sat1.main_wp){
        sat1.main_wp = sat1.wp;
    }

    let sat2_hp_increase = 0;
    let sat2_hp = sat2.hp;
    let sat2_hp_left = sat2.left_hp;
    if(sat2.hp > sat2.main_hp){
        sat2_hp_increase = sat2.hp - sat2.main_hp;
        sat2_hp = sat2.main_hp;
        sat2_hp_left = sat2.main_hp;
        if(sat2_hp_increase > sat2.main_hp){
            sat2_hp_increase = sat2.main_hp;
        }
    }
    if(sat2.wp > sat2.main_wp){
        sat2.main_wp = sat2.wp;
    }

    let sat3_hp_increase = 0;
    let sat3_hp = sat3.hp;
    let sat3_hp_left = sat3.left_hp;
    if(sat3.hp > sat3.main_hp){
        sat3_hp_increase = sat3.hp - sat3.main_hp;
        sat3_hp = sat3.main_hp;
        sat3_hp_left = sat3.main_hp;
        if(sat3_hp_increase > sat3.main_hp){
            sat3_hp_increase = sat3.main_hp;
        }
    }
    if(sat3.wp > sat3.main_wp){
        sat3.main_wp = sat3.wp;
    }

    let ene1_hp_increase = 0;
    let ene1_hp = ene1.hp;
    let ene1_hp_left = ene1.left_hp;
    if(ene1.hp > ene1.main_hp){
        ene1_hp_increase = ene1.hp - ene1.main_hp;
        ene1_hp = ene1.main_hp;
        ene1_hp_left = ene1.main_hp;
        if(ene1_hp_increase > ene1.main_hp){
            ene1_hp_increase = ene1.main_hp;
        }
    }
    if(ene1.wp > ene1.main_wp){
        ene1.main_wp = ene1.wp;
    }

    let ene2_hp_increase = 0;
    let ene2_hp = ene2.hp;
    let ene2_hp_left = ene2.left_hp;
    if(ene2.hp > ene2.main_hp){
        ene2_hp_increase = ene2.hp - ene2.main_hp;
        ene2_hp = ene2.main_hp;
        ene2_hp_left = ene2.main_hp;
        if(ene2_hp_increase > ene2.main_hp){
            ene2_hp_increase = ene2.main_hp;
        }
    }
    if(ene2.wp > ene2.main_wp){
        ene2.main_wp = ene2.wp;
    }

    let ene3_hp_increase = 0;
    let ene3_hp = ene3.hp;
    let ene3_hp_left = ene3.left_hp;
    if(ene3.hp > ene3.main_hp){
        ene3_hp_increase = ene3.hp - ene3.main_hp;
        ene3_hp = ene3.main_hp;
        ene3_hp_left = ene3.main_hp;
        if(ene3_hp_increase > ene3.main_hp){
            ene3_hp_increase = ene3.main_hp;
        }
    }
    if(ene3.wp > ene3.main_wp){
        ene3.main_wp = ene3.wp;
    }

    const width = 456;
    const height = 231;
    const PG_width = 133;
    const PG_height = 14;
    const PG_color_hp = '#ae443f';
    const PG_color_hp_increase = '#5cbb62';
    const PG_color_hp_increase_left = '#7a8a53';
    const PG_color_sm = '#5b75a4';
    const PG_bar_left = '#696b6e';
    const ImageWH = 64;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let allSatColor = '#ffffff';
    let allEneColor = '#ffffff';

    ////FONT
    ctx.font = "10px Arial";
    ctx.fillStyle = '#ffffff';

    //// BACKGROUND
    let background_image = gif.frame_battle;

    const match_sat1 = sat1.rank.match(/^(\d+)_/);
    const sat1_rank_id = parseInt(match_sat1[1]);
    const match_sat2 = sat2.rank.match(/^(\d+)_/);
    const sat2_rank_id = parseInt(match_sat2[1]);
    const match_sat3 = sat3.rank.match(/^(\d+)_/);
    const sat3_rank_id = parseInt(match_sat3[1]);

    const match_ene1 = ene1.rank.match(/^(\d+)_/);
    const ene1_rank_id = parseInt(match_ene1[1]);
    const match_ene2 = ene2.rank.match(/^(\d+)_/);
    const ene2_rank_id = parseInt(match_ene2[1]);
    const match_ene3 = ene3.rank.match(/^(\d+)_/);
    const ene3_rank_id = parseInt(match_ene3[1]);

    if(sat1_rank_id == 24 || ene1_rank_id == 24){
        background_image = gif.frame_battle_kof;
    }else if(sat2_rank_id == 24 || ene2_rank_id == 24){
        background_image = gif.frame_battle_kof;
    }else if(sat3_rank_id == 24 || ene3_rank_id == 24){
        background_image = gif.frame_battle_kof;
    }

    if(streak >= 20000 || ene_streak >= 20000){
        background_image = gif.frame_battle20;
    }else if(streak >= 10000 || ene_streak >= 10000){
        background_image = gif.frame_battle10;
    }else if(streak >= 9000 || ene_streak >= 9000){
        if(streak >= 9500 || ene_streak >= 9500){
            background_image = gif.frame_battle9_2;
        }else{
            background_image = gif.frame_battle9;
        }
    }else if(streak >= 8000 || ene_streak >= 8000){
        if(streak >= 8500 || ene_streak >= 8500){
            background_image = gif.frame_battle8_2;
        }else{
            background_image = gif.frame_battle8;
        }
    }else if(streak >= 7000 || ene_streak >= 7000){
        if(streak >= 7500 || ene_streak >= 7500){
            background_image = gif.frame_battle7_2;
        }else{
            background_image = gif.frame_battle7;
        }
    }else if(streak >= 6000 || ene_streak >= 6000){
        if(streak >= 6500 || ene_streak >= 6500){
            background_image = gif.frame_battle6_2;
        }else{
            background_image = gif.frame_battle6;
        }
    }else if(streak >= 5000 || ene_streak >= 5000){
        if(streak >= 5500 || ene_streak >= 5500){
            background_image = gif.frame_battle5_2;
        }else{
            background_image = gif.frame_battle5;
        }
    }else if(streak >= 4000 || ene_streak >= 4000){
        if(streak >= 4500 || ene_streak >= 4500){
            background_image = gif.frame_battle4_2;
        }else{
            background_image = gif.frame_battle4;
        }
    }else if(streak >= 3000 || ene_streak >= 3000){
        if(streak >= 3500 || ene_streak >= 3500){
            background_image = gif.frame_battle3_2;
        }else{
            background_image = gif.frame_battle3;
        }
    }else if(streak >= 2000 || ene_streak >= 2000){
        if(streak >= 2500 || ene_streak >= 2500){
            background_image = gif.frame_battle2_2;
        }else{
            background_image = gif.frame_battle2;
        }
    }else if(streak >= 1000 || ene_streak >= 1000){
        background_image = gif.frame_battle1;
    }

    if(userid == '1208244808888487939' || oppoid == '1208244808888487939' || userid == '1136945370459553872' || oppoid == '1136945370459553872'){
        background_image = gif.frame_linn;
    }

    const background = await loadImage(background_image);
    ctx.drawImage(background ,0, 0, canvas.width, canvas.height);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// TEST
    // const aemoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
    // const aemojiID = aemoji[2];

    // const aemojiURL = `https://cdn.discordapp.com/emojis/${aemojiID}.png`;
    // const asat1_poison = await loadImage(aemojiURL);
    // ctx.drawImage(asat1_poison, 135, 40, 16, 16);

    // const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
    // const emojiID = emoji[2];

    // const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
    // const sat1_poison = await loadImage(emojiURL);
    // ctx.drawImage(sat1_poison, 151, 40, 16, 16);
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// TEST

    //// SAT
    //SAT ONE
    let a1_slash = '';
    let a1_TJ = '';
    if(sat1.bool){ a1_slash = '/'; a1_TJ = '%'; };
    if(sat1.hp == 0){ ctx.globalAlpha = 0.5; }

    try {
        const animalImage1 = await loadImage(sat1.png);
        ctx.drawImage(animalImage1, 7, 7, ImageWH, ImageWH);
    }catch(error) {
        console.log(`error image sat1 ${sat1.png}`);
    }

    //SAT ONE NAME
    ctx.fillStyle = allSatColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${sat1.name}`, 205, 40);
    ctx.textAlign = 'left';
    //SAT ONE LEVEL
    ctx.fillText(`${sat1.lvl}`, 75, 40);

    //Progress bar sat one hp left
    const sat1_hp_pg_left = parseInt((sat1_hp_left / sat1.main_hp)*100);
    const sat1_PG_HP_left = (PG_width - 131.67) * sat1_hp_pg_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(72, 7, sat1_PG_HP_left, PG_height - 4);
    //Progress bar sat one hp
    const sat1_hp_pg = parseInt((sat1_hp / sat1.main_hp)*100);
    const sat1_PG_HP = (PG_width - 131.67) * sat1_hp_pg;
    ctx.fillStyle = PG_color_hp;
    ctx.fillRect(72, 7, sat1_PG_HP, PG_height - 4);
    //Progress bar sat one hp increase
    const sat1_hp_pg_increase = parseInt((sat1_hp_increase / sat1.main_hp)*100);
    const sat1_PG_HP_increase = (PG_width - 131.67) * sat1_hp_pg_increase;
    ctx.fillStyle = PG_color_hp_increase;
    ctx.fillRect(72, 7, sat1_PG_HP_increase, PG_height - 4);
    //Progress bat sat one text hp
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat1.hp}${a1_slash}${sat1.main_hp}`, 73, 15.5);

    //Progress bar sat one sm left
    const sat1_sm_pg_left = parseInt((sat1.wp / sat1.left_wp)*100);
    const sat1_PG_sm_left = (PG_width - 131.67) * sat1_sm_pg_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(72, 18, sat1_PG_sm_left, PG_height - 4);
    //Progress bar sat one sm
    const sat1_sm_pg = parseInt((sat1.wp / sat1.main_wp)*100);
    const sat1_PG_SM = (PG_width - 131.67) * sat1_sm_pg;
    ctx.fillStyle = PG_color_sm;
    ctx.fillRect(72, 18, sat1_PG_SM, PG_height - 4);
    //Progress bat sat one text sm
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat1.wp}${a1_slash}${sat1.main_wp}`, 73, 26.5);
    //STATE
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat1.str}`, 115, 48); //STR
    ctx.fillText(`${sat1.mag}`, 115, 56); //MAG
    ctx.fillText(`${sat1.pr}${a1_TJ}`, 115, 64); //PR
    ctx.fillText(`${sat1.mr}${a1_TJ}`, 115, 72); //MR
    //WEAPON
    try {
        const sat1_weapon = await loadImage(sat1.weapon);
        ctx.drawImage(sat1_weapon, 75, 42, 32, 32);
    }catch(error) {
        console.log(`error image sat1 ${sat1.weapon}`);
    }
    //RANK
    try{
        if(sat1.rank){
            const match_sat1 = sat1.rank.match(/^(\d+)_/);
            const sat1_rank_id = parseInt(match_sat1[1]);
            if(sat1_rank_id > 14 && sat1_rank_id != 26){
                const emoji = gif[`animal_rank_${sat1_rank_id}`].match(/^<:(\w+):(\d+)>$/);
                const emojiID = emoji[2];

                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
                const sat1_rank = await loadImage(emojiURL);
                ctx.drawImage(sat1_rank, 180, 49, 25, 25);
            }
        }
    }catch(error){console.log(`error rank sat1: ${error}`);}
    //POISON
    try{
        if(sat1.poison_bool && sat1.poison_round > 0){
            const emoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const sat1_poison = await loadImage(emojiURL);
            ctx.drawImage(sat1_poison, 135, 40, 16, 16);
        }
    }catch(error){console.log(`error poison sat1: ${error}`);}
    //DEFEND UP
    try{
        if(sat1.defend_up_bool && sat1.defend_up_round > 0){
            const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const sat1_poison = await loadImage(emojiURL);
            ctx.drawImage(sat1_poison, 151, 40, 16, 16);
        }
    }catch(error){console.log(`error defend up sat1: ${error}`);}
    if(sat1.hp == 0){ ctx.globalAlpha = 1; }




    //SAT TWO
    let a2_slash = '';
    let a2_TJ = '';
    if(sat2.bool){ a2_slash = '/'; a2_TJ = '%'; };
    if(sat2.hp == 0){ ctx.globalAlpha = 0.5; }
    try {
        const animalImage2 = await loadImage(sat2.png);
        ctx.drawImage(animalImage2, 7, 84, ImageWH, ImageWH);
    }catch(error) {
        console.log(`error image sat2 ${sat2.png}`);
    }

    //SAT TWO NAME
    ctx.fillStyle = allSatColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${sat2.name}`, 205, 117);
    ctx.textAlign = 'left';
    //SAT TWO LEVEL
    ctx.fillText(`${sat2.lvl}`, 75, 117);
    //Progress bar sat two hp left
    const sat2_hp_pg_left = parseInt((sat2_hp_left / sat2.main_hp)*100);
    const sat2_PG_HP_left = (PG_width - 131.67) * sat2_hp_pg_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(72, 84, sat2_PG_HP_left, PG_height - 4);
    //Progress bar sat two hp
    const sat2_hp_pg = parseInt((sat2_hp / sat2.main_hp)*100);
    const sat2_PG_HP = (PG_width - 131.67) * sat2_hp_pg;
    ctx.fillStyle = PG_color_hp;
    ctx.fillRect(72, 84, sat2_PG_HP, PG_height - 4);
    //Progress bar sat two hp increase
    const sat2_hp_pg_increase = parseInt((sat2_hp_increase / sat2.main_hp)*100);
    const sat2_PG_HP_increase = (PG_width - 131.67) * sat2_hp_pg_increase;
    ctx.fillStyle = PG_color_hp_increase;
    ctx.fillRect(72, 84, sat2_PG_HP_increase, PG_height - 4);
    //Progress bat sat one text hp
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat2.hp}${a2_slash}${sat2.main_hp}`, 73, 92.5);

    //Progress bar sat one sm left
    const sat2_sm_pg_left = parseInt((sat2.wp / sat2.left_wp)*100);
    const sat2_PG_sm_left = (PG_width - 131.67) * sat2_sm_pg_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(72, 95, sat2_PG_sm_left, PG_height - 4);
    //Progress bar sat two sm
    const sat2_wp_pg = parseInt((sat2.wp / sat2.main_wp)*100);
    const sat2_PG_SM = (PG_width - 131.67) * sat2_wp_pg;
    ctx.fillStyle = PG_color_sm;
    ctx.fillRect(72, 95, sat2_PG_SM, PG_height - 4);
    //Progress bat sat one text sm
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat2.wp}${a2_slash}${sat2.main_wp}`, 73, 103.5);
    //STATE
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat2.str}`, 115, 125); //STR
    ctx.fillText(`${sat2.mag}`, 115, 133); //MAG
    ctx.fillText(`${sat2.pr}${a2_TJ}`, 115, 141); //PR
    ctx.fillText(`${sat2.mr}${a2_TJ}`, 115, 149); //MR
    //WEAPON
    try {
        const sat2_weapon = await loadImage(sat2.weapon);
        ctx.drawImage(sat2_weapon, 75, 119, 32, 32);
    }catch(error) {
        console.log(`error image sat2 ${sat2.weapon}`);
    }
    //RANK
    try{
        if(sat2.rank){
            const match_sat2 = sat2.rank.match(/^(\d+)_/);
            const sat2_rank_id = parseInt(match_sat2[1]);
            if(sat2_rank_id > 14 && sat2_rank_id != 26){
                const emoji = gif[`animal_rank_${sat2_rank_id}`].match(/^<:(\w+):(\d+)>$/);
                const emojiID = emoji[2];

                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
                const sat2_rank = await loadImage(emojiURL);
                ctx.drawImage(sat2_rank, 180, 126, 25, 25);
            }
        }
    }catch(error){console.log(`error rank sat2: ${error}`);}
    //POISON
    try{
        if(sat2.poison_bool && sat2.poison_round > 0){
            const emoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const sat2_poison = await loadImage(emojiURL);
            ctx.drawImage(sat2_poison, 135, 117, 16, 16);
        }
    }catch(error){console.log(`error poison sat2: ${error}`);}
    //DEFEND UP
    try{
        if(sat2.defend_up_bool && sat2.defend_up_round > 0){
            const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const sat2_poison = await loadImage(emojiURL);
            ctx.drawImage(sat2_poison, 151, 117, 16, 16);
        }
    }catch(error){console.log(`error defend up sat2: ${error}`);}
    if(sat2.hp == 0){ ctx.globalAlpha = 1; }






    //SAT THREE
    let a3_slash = '';
    let a3_TJ = '';
    if(sat3.bool){ a3_slash = '/'; a3_TJ = '%'; };
    if(sat3.hp == 0){ ctx.globalAlpha = 0.5; }
    try {
        const animalImage3 = await loadImage(sat3.png);
        ctx.drawImage(animalImage3, 7, 161, ImageWH, ImageWH);
    }catch(error) {
        console.log(`error image sat3 ${sat3.png}`);
    }

    //SAT THREE NAME
    ctx.fillStyle = allSatColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${sat3.name}`, 205, 194);
    ctx.textAlign = 'left';
    //SAT THREE LEVEL
    ctx.fillText(`${sat3.lvl}`, 75, 194);
    //Progress bar sat two hp left
    const sat3_hp_pg_left = parseInt((sat3_hp_left / sat3.main_hp)*100);
    const sat3_PG_HP_left = (PG_width - 131.67) * sat3_hp_pg_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(72, 161, sat3_PG_HP_left, PG_height - 4);
    //Progress bar sat three hp
    const sat3_hp_pg = parseInt((sat3_hp / sat3.main_hp)*100);
    const sat3_PG_HP = (PG_width - 131.67) * sat3_hp_pg;
    ctx.fillStyle = PG_color_hp;
    ctx.fillRect(72, 161, sat3_PG_HP, PG_height - 4);
    //Progress bar sat three hp increase
    const sat3_hp_pg_increase = parseInt((sat3_hp_increase / sat3.main_hp)*100);
    const sat3_PG_HP_increase = (PG_width - 131.67) * sat3_hp_pg_increase;
    ctx.fillStyle = PG_color_hp_increase;
    ctx.fillRect(72, 161, sat3_PG_HP_increase, PG_height - 4);
    //Progress bat sat one text hp
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat3.hp}${a3_slash}${sat3.main_hp}`, 73, 169.5);

    //Progress bar sat one sm left
    const sat3_sm_pg_left = parseInt((sat3.wp / sat3.left_wp)*100);
    const sat3_PG_sm_left = (PG_width - 131.67) * sat3_sm_pg_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(72, 172, sat3_PG_sm_left, PG_height - 4);
    //Progress bar sat three sm
    const sat3_wp_pg = parseInt((sat3.wp / sat3.main_wp)*100);
    const sat3_PG_SM = (PG_width - 131.67) * sat3_wp_pg;
    ctx.fillStyle = PG_color_sm;
    ctx.fillRect(72, 172, sat3_PG_SM, PG_height - 4);
    //Progress bat sat one text sm
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat3.wp}${a3_slash}${sat3.main_wp}`, 73, 180.5);
    //STATE
    ctx.fillStyle = allSatColor;
    ctx.fillText(`${sat3.str}`, 115, 202); //STR
    ctx.fillText(`${sat3.mag}`, 115, 210); //MAG
    ctx.fillText(`${sat3.pr}${a3_TJ}`, 115, 218); //PR
    ctx.fillText(`${sat3.mr}${a3_TJ}`, 115, 226); //MR
    //WEAPON
    try{
        const sat3_weapon = await loadImage(sat3.weapon);
        ctx.drawImage(sat3_weapon, 75, 196, 32, 32);
    }catch(error){
        console.log(`error image sat3 ${sat3.weapon}`);
    }
    //RANK
    try{
        if(sat3.rank){
            const match_sat3 = sat3.rank.match(/^(\d+)_/);
            const sat3_rank_id = parseInt(match_sat3[1]);
            if(sat3_rank_id > 14 && sat3_rank_id != 26){
                const emoji = gif[`animal_rank_${sat3_rank_id}`].match(/^<:(\w+):(\d+)>$/);
                const emojiID = emoji[2];

                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
                const sat3_rank = await loadImage(emojiURL);
                ctx.drawImage(sat3_rank, 180, 203, 25, 25);
            }
        }
    }catch(error){console.log(`error rank sat2: ${error}`);}
    //POISON
    try{
        if(sat3.poison_bool && sat3.poison_round > 0){
            const emoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const sat3_poison = await loadImage(emojiURL);
            ctx.drawImage(sat3_poison, 135, 194, 16, 16);
        }
    }catch(error){console.log(`error poison sat3: ${error}`);}
    //DEFEND UP
    try{
        if(sat3.defend_up_bool && sat3.defend_up_round > 0){
            const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const sat3_poison = await loadImage(emojiURL);
            ctx.drawImage(sat3_poison, 151, 194, 16, 16);
        }
    }catch(error){console.log(`error defend up sat3: ${error}`);}
    if(sat3.hp == 0){ ctx.globalAlpha = 1; }














    //// ENEMY
    //ENEMY ONE
    let e1_slash = '';
    let e1_TJ = '';
    if(ene1.bool){ e1_slash = '/'; e1_TJ = '%'; };
    if(ene1.hp == 0){ ctx.globalAlpha = 0.5; }
    ctx.fillStyle = allEneColor;
    try {
        const eenmyImage1 = await loadImage(ene1.png);
        ctx.drawImage(eenmyImage1, 385, 7, ImageWH, ImageWH);
    }catch(error) {
        console.log(`error image ene1 ${ene1.png}`);
    }

    //ENEMY ONE NAME
    ctx.fillText(`${ene1.name}`, 251, 40);
    //ENEMY ONE LEVEL
    ctx.textAlign = 'right';
    ctx.fillText(`${ene1.lvl}`, 382, 40);
    ctx.textAlign = 'left';
    //Progress bar ene one hp left
    const ene1_hp_pg_left = parseInt((ene1_hp_left / ene1.main_hp)*100);
    const ene1_PG_HP_left = (PG_width - 131.67) * ene1_hp_pg_left;
    const e1_fillStartHP_left = 251 + PG_width - ene1_PG_HP_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(e1_fillStartHP_left, 7, ene1_PG_HP_left, PG_height - 4);
    //Progress bar ene one hp
    const ene1_hp_pg = parseInt((ene1_hp / ene1.main_hp)*100);
    const ene1_PG_HP = (PG_width - 131.67) * ene1_hp_pg;
    const e1_fillStartHP = 251 + PG_width - ene1_PG_HP;
    ctx.fillStyle = PG_color_hp;
    ctx.fillRect(e1_fillStartHP, 7, ene1_PG_HP, PG_height - 4);

    //Progress bar ene one hp increase
    const ene1_hp_pg_increase = parseInt((ene1_hp_increase / ene1.main_hp)*100);
    const ene1_PG_HP_increase = (PG_width - 131.67) * ene1_hp_pg_increase;
    const e1_fillStartHP__increase = 251 + PG_width - ene1_PG_HP_increase;
    ctx.fillStyle = PG_color_hp_increase;
    ctx.fillRect(e1_fillStartHP__increase, 7, ene1_PG_HP_increase, PG_height - 4);

    //Progress bat ene one text hp
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene1.hp}${e1_slash}${ene1.main_hp}`, 384, 15.5);
    ctx.textAlign = 'left';

    //Progress bar ene one sm left
    const ene1_wp_pg_left = parseInt((ene1.wp / ene1.left_wp)*100);
    const ene1_PG_wp_left = (PG_width - 131.67) * ene1_wp_pg_left;
    const e1_fillStartSM_left = 251 + PG_width - ene1_PG_wp_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(e1_fillStartSM_left, 18, ene1_PG_wp_left, PG_height - 4);

    //Progress bar ene one sm
    const ene1_wp_pg = parseInt((ene1.wp / ene1.main_wp)*100);
    const ene1_PG_SM = (PG_width - 131.67) * ene1_wp_pg;
    const e1_fillStartSM = 251 + PG_width - ene1_PG_SM;
    ctx.fillStyle = PG_color_sm;
    ctx.fillRect(e1_fillStartSM, 18, ene1_PG_SM, PG_height - 4);
    //Progress bat ene one text sm
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene1.wp}${e1_slash}${ene1.main_wp}`, 384, 26.5);
    ctx.textAlign = 'left';
    //STATE
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene1.str}`, 342, 48); //STR
    ctx.fillText(`${ene1.mag}`, 342, 56); //MAG
    ctx.fillText(`${ene1.pr}${e1_TJ}`, 342, 64); //PR
    ctx.fillText(`${ene1.mr}${e1_TJ}`, 342, 72); //MR
    ctx.textAlign = 'left';
    //WEAPON
    try {
        const ene1_weapon = await loadImage(ene1.weapon);
        ctx.drawImage(ene1_weapon, 352, 42, 32, 32);
    }catch(error) {
        console.log(`error image ene1 ${ene1.weapon}`);
    }
    //RANK
    try{
        if(ene1.rank){
            const match_ene1 = ene1.rank.match(/^(\d+)_/);
            const ene1_rank_id = parseInt(match_ene1[1]);
            if(ene1_rank_id > 14 && ene1_rank_id != 26){
                const emoji = gif[`animal_rank_${ene1_rank_id}`].match(/^<:(\w+):(\d+)>$/);
                const emojiID = emoji[2];

                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
                const ene1_rank = await loadImage(emojiURL);
                ctx.drawImage(ene1_rank, 251, 49, 25, 25);
            }
        }
    }catch(error){console.log(`error rank ene1: ${error}`);}
    //POISON
    try{
        if(ene1.poison_bool && ene1.poison_round > 0){
            const emoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const ene1_poison = await loadImage(emojiURL);
            ctx.drawImage(ene1_poison, 307, 40, 16, 16);
        }
    }catch(error){console.log(`error poison ene1: ${error}`);}
    //DEFEND UP
    try{
        if(ene1.defend_up_bool && ene1.defend_up_round > 0){
            const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const ene1_poison = await loadImage(emojiURL);
            ctx.drawImage(ene1_poison, 290, 40, 16, 16);
        }
    }catch(error){console.log(`error defend up ene1: ${error}`);}
    if(ene1.hp == 0){ ctx.globalAlpha = 1; }






    //ENEMY TWO
    let e2_slash = '';
    let e2_TJ = '';
    if(ene2.bool){ e2_slash = '/'; e2_TJ = '%'; };
    if(ene2.hp == 0){ ctx.globalAlpha = 0.5; }
    try {
        const eenmyImage2 = await loadImage(ene2.png);
        ctx.drawImage(eenmyImage2, 385, 84, ImageWH, ImageWH);
    }catch(error) {
        console.log(`error image ene2 ${ene2.png}`);
    }

    //ENEMY TWO NAME
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene2.name}`, 251, 117);
    //ENEMY TWO LEVEL
    ctx.textAlign = 'right';
    ctx.fillText(`${ene2.lvl}`, 382, 117);
    ctx.textAlign = 'left';
    //Progress bar ene two hp left
    const ene2_hp_pg_left = parseInt((ene2_hp_left / ene2.main_hp)*100);
    const ene2_PG_HP_left = (PG_width - 131.67) * ene2_hp_pg_left;
    const e2_fillStartHP_left = 251 + PG_width - ene2_PG_HP_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(e2_fillStartHP_left, 84, ene2_PG_HP_left, PG_height - 4);
    //Progress bar sat two hp
    const ene2_hp_pg = parseInt((ene2_hp / ene2.main_hp)*100);
    const ene2_PG_HP = (PG_width - 131.67) * ene2_hp_pg;
    const e2_fillStartHP = 251 + PG_width - ene2_PG_HP;
    ctx.fillStyle = PG_color_hp;
    ctx.fillRect(e2_fillStartHP, 84, ene2_PG_HP, PG_height - 4);

    //Progress bar ene two hp increase
    const ene2_hp_pg_increase = parseInt((ene2_hp_increase / ene2.main_hp)*100);
    const ene2_PG_HP_increase = (PG_width - 131.67) * ene2_hp_pg_increase;
    const e2_fillStartHP__increase = 251 + PG_width - ene2_PG_HP_increase;
    ctx.fillStyle = PG_color_hp_increase;
    ctx.fillRect(e2_fillStartHP__increase, 84, ene2_PG_HP_increase, PG_height - 4);

    //Progress bat ene two text hp
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene2.hp}${e2_slash}${ene2.main_hp}`, 384, 92.5);
    ctx.textAlign = 'left';

    //Progress bar ene two sm left
    const ene2_wp_pg_left = parseInt((ene2.wp / ene2.left_wp)*100);
    const ene2_PG_wp_left = (PG_width - 131.67) * ene2_wp_pg_left;
    const e2_fillStartSM_left = 251 + PG_width - ene2_PG_wp_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(e2_fillStartSM_left, 95, ene2_PG_wp_left, PG_height - 4);

    //Progress bar sat two sm
    const ene2_wp_pg = parseInt((ene2.wp / ene2.main_wp)*100);
    const ene2_PG_SM = (PG_width - 131.67) * ene2_wp_pg;
    const e2_fillStartSM = 251 + PG_width - ene2_PG_SM;
    ctx.fillStyle = PG_color_sm;
    ctx.fillRect(e2_fillStartSM, 95, ene2_PG_SM, PG_height - 4);
    //Progress bat ene two text sm
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene2.wp}${e2_slash}${ene2.main_wp}`, 384, 103.5);
    ctx.textAlign = 'left';
    //STATE
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene2.str}`, 342, 125); //STR
    ctx.fillText(`${ene2.mag}`, 342, 133); //MAG
    ctx.fillText(`${ene2.pr}${e2_TJ}`, 342, 141); //PR
    ctx.fillText(`${ene2.mr}${e2_TJ}`, 342, 149); //MR
    ctx.textAlign = 'left';
    //WEAPON
    try {
        const ene2_weapon = await loadImage(ene2.weapon);
        ctx.drawImage(ene2_weapon, 352, 119, 32, 32);
    }catch(error) {
        console.log(`error image ene2 ${ene2.weapon}`);
    }
    //RANK
    try{
        if(ene2.rank){
            const match_ene2 = ene2.rank.match(/^(\d+)_/);
            const ene2_rank_id = parseInt(match_ene2[1]);
            if(ene2_rank_id > 14 && ene2_rank_id != 26){
                const emoji = gif[`animal_rank_${ene2_rank_id}`].match(/^<:(\w+):(\d+)>$/);
                const emojiID = emoji[2];

                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
                const ene2_rank = await loadImage(emojiURL);
                ctx.drawImage(ene2_rank, 251, 126, 25, 25);
            }
        }
    }catch(error){console.log(`error rank ene2: ${error}`);}
    //POISON
    try{
        if(ene2.poison_bool && ene2.poison_round > 0){
            const emoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const ene2_poison = await loadImage(emojiURL);
            ctx.drawImage(ene2_poison, 307, 117, 16, 16);
        }
    }catch(error){console.log(`error poison ene2: ${error}`);}
    //DEFEND UP
    try{
        if(ene2.defend_up_bool && ene2.defend_up_round > 0){
            const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const ene2_poison = await loadImage(emojiURL);
            ctx.drawImage(ene2_poison, 290, 117, 16, 16);
        }
    }catch(error){console.log(`error defend up ene2: ${error}`);}
    if(ene2.hp == 0){ ctx.globalAlpha = 1; }







    //ENEMY THREE
    let e3_slash = '';
    let e3_TJ = '';
    if(ene3.bool){ e3_slash = '/'; e3_TJ = '%'; };
    if(ene3.hp == 0){ ctx.globalAlpha = 0.5; }
    try {
        const eenmyImage3 = await loadImage(ene3.png);
        ctx.drawImage(eenmyImage3, 385, 161, ImageWH, ImageWH);
    }catch(error) {
        console.log(`error image ene3 ${ene3.png}`);
    }

    //ENEMY THREE NAME
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene3.name}`, 251, 192);
    //ENEMY THREE LEVEL
    ctx.textAlign = 'right';
    ctx.fillText(`${ene3.lvl}`, 382, 192);
    ctx.textAlign = 'left';
    //Progress bar ene three hp left
    const ene3_hp_pg_left = parseInt((ene3_hp_left / ene3.main_hp)*100);
    const ene3_PG_HP_left = (PG_width - 131.67) * ene3_hp_pg_left;
    const e3_fillStartHP_left = 251 + PG_width - ene3_PG_HP_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(e3_fillStartHP_left, 161, ene3_PG_HP_left, PG_height - 4);
    //Progress bar sat three hp
    const ene3_hp_pg = parseInt((ene3_hp / ene3.main_hp)*100);
    const ene3_PG_HP = (PG_width - 131.67) * ene3_hp_pg;
    const e3_fillStartHP = 251 + PG_width - ene3_PG_HP;
    ctx.fillStyle = PG_color_hp;
    ctx.fillRect(e3_fillStartHP, 161, ene3_PG_HP, PG_height - 4);

    //Progress bar ene three hp increase
    const ene3_hp_pg_increase = parseInt((ene3_hp_increase / ene3.main_hp)*100);
    const ene3_PG_HP_increase = (PG_width - 131.67) * ene3_hp_pg_increase;
    const e3_fillStartHP__increase = 251 + PG_width - ene3_PG_HP_increase;
    ctx.fillStyle = PG_color_hp_increase;
    ctx.fillRect(e3_fillStartHP__increase, 161, ene3_PG_HP_increase, PG_height - 4);

    //Progress bat ene three text hp
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene3.hp}${e3_slash}${ene3.main_hp}`, 384, 169.5);
    ctx.textAlign = 'left';

    //Progress bar ene three sm left
    const ene3_wp_pg_left = parseInt((ene3.wp / ene3.left_wp)*100);
    const ene3_PG_wp_left = (PG_width - 131.67) * ene3_wp_pg_left;
    const e3_fillStartSM_left = 251 + PG_width - ene3_PG_wp_left;
    ctx.fillStyle = PG_bar_left;
    ctx.fillRect(e3_fillStartSM_left, 172, ene3_PG_wp_left, PG_height - 4);

    //Progress bar sat three sm
    const ene3_wp_pg = parseInt((ene3.wp / ene3.main_wp)*100);
    const ene3_PG_SM = (PG_width - 131.67) * ene3_wp_pg;
    const e3_fillStartSM = 251 + PG_width - ene3_PG_SM;
    ctx.fillStyle = PG_color_sm;
    ctx.fillRect(e3_fillStartSM, 172, ene3_PG_SM, PG_height - 4);
    //Progress bat ene three text sm
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene3.wp}${e3_slash}${ene3.main_wp}`, 384, 180.5);
    ctx.textAlign = 'left';
    //STATE
    ctx.textAlign = 'right';
    ctx.fillStyle = allEneColor;
    ctx.fillText(`${ene3.str}`, 342, 200); //STR
    ctx.fillText(`${ene3.mag}`, 342, 208); //MAG
    ctx.fillText(`${ene3.pr}${e3_TJ}`, 342, 216); //PR
    ctx.fillText(`${ene3.mr}${e3_TJ}`, 342, 224); //MR
    ctx.textAlign = 'left';
    //WEAPON
    try {
        const ene3_weapon = await loadImage(ene3.weapon);
        ctx.drawImage(ene3_weapon, 352, 196, 32, 32);
    }catch(error) {
        console.log(`error image ene3 ${ene3.weapon}`);
    }
    //RANK
    try{
        if(ene3.rank){
            const match_ene3 = ene3.rank.match(/^(\d+)_/);
            const ene3_rank_id = parseInt(match_ene3[1]);
            if(ene3_rank_id > 14 && ene3_rank_id != 26){
                const emoji = gif[`animal_rank_${ene3_rank_id}`].match(/^<:(\w+):(\d+)>$/);
                const emojiID = emoji[2];

                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
                const ene3_rank = await loadImage(emojiURL);
                ctx.drawImage(ene3_rank, 251, 203, 25, 25);
            }
        }
    }catch(error){console.log(`error rank ene3: ${error}`);}
    //POISON
    try{
        if(ene3.poison_bool && ene3.poison_round > 0){
            const emoji = gif.poison_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const ene3_poison = await loadImage(emojiURL);
            ctx.drawImage(ene3_poison, 307, 194, 16, 16);
        }
    }catch(error){console.log(`error poison ene3: ${error}`);}
    //DEFEND UP
    try{
        if(ene3.defend_up_bool && ene3.defend_up_round > 0){
            const emoji = gif.defend_up_passive_weapon_gif.match(/^<:(\w+):(\d+)>$/);
            const emojiID = emoji[2];

            const emojiURL = `https://cdn.discordapp.com/emojis/${emojiID}.png`;
            const ene3_poison = await loadImage(emojiURL);
            ctx.drawImage(ene3_poison, 290, 194, 16, 16);
        }
    }catch(error){console.log(`error defend up ene3: ${error}`);}
    if(ene3.hp == 0){ ctx.globalAlpha = 1; }

    return canvas.toBuffer();
}

function stateHP(statehp, lvl){
    const HP = 2*statehp*lvl+500;
    return HP;
}
function stateSTR(statestr, lvl){
    const str = ((statestr*lvl)+100);
    return str;
}
function stateWP(statewp, lvl){
    const wp = 2*statewp*lvl+500;
    return wp;
}
function stateMAG(statemag, lvl){
    const mag = ((statemag*lvl)+100);
    return mag;
}
function statePR(statepr, Level){
    const pr = parseInt(0.8*((25+2*statepr*Level)/(125+2*statepr*Level))*100);
    return pr;
}
function stateMR(statemr, Level){
    const mr = parseInt((0.8*((25+2*statemr*Level)/(125+2*statemr*Level)))*100);
    return mr;
}

function resistance(demage, resistance, high_hp){
    let s_p = parseInt(demage*(resistance/100));
    demage -= s_p
    if(demage < 0){
        demage *= -1;
    }
    if(demage > high_hp){
        demage = high_hp;
    }
    return parseInt(demage);
}

function generateRandomId(letter){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < letter; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function getWeaponRank(weapon, rank){
    return gif[`${weapon}_${rank}_gif`];
}
function getPassive(passive){
    return gif[`${passive}_gif`];
}

async function getWeaponEquipById(weapon_id, userId){
    const userData = await getUser(userId);
    for(const allwp of userData.wp){
        const str = `${allwp}`;
        const [id, name, rank, passive, percen, boolStr] = str.split(' ');

        if(weapon_id == id){
            if(boolStr == 'false'){
                return false;
            }
        }
    }
    return true;
}

async function getWeaponRankById(weapon_id, userId){
    const userData = await getUser(userId);
    for(const allwp of userData.wp){
        const str = `${allwp}`;
        const [id, name, rank, passive, percen, boolStr] = str.split(' ');

        if(weapon_id == id){
            return gif[`${name}_${rank}_gif`];
        }
    }
}

async function getWeaponNameById(weapon_id, userId){
    const userData = await getUser(userId);
    for(const allwp of userData.wp){
        const str = `${allwp}`;
        const [id, name, rank, passive, percen, boolStr] = str.split(' ');

        if(weapon_id == id){
            if(name == 'great_sword'){
                return '**Great Sword**';
            }else if(name == 'defender_aegis'){
                return '**Defender Aegis**';
            }else if(name == 'wang_of_absorption'){
                return '**Wang of Absorption**';
            }else if(name == 'bow'){
                return '**Bow**';
            }else if(name == 'energy_stuff'){
                return '**Energy Stuff**';
            }else if(name == 'healing_stuff'){
                return '**Healing Stuff**';
            }else if(name == 'orb_of_potency'){
                return '**Orb of Potency**';
            }else if(name == 'rune_of_the_forgotten'){
                return '**Rune of the Forgotten**';
            }else if(name == 'crune_of_celebration'){
                return '**Crune of Celebration**';
            }else if(name == 'spirit_stuff'){
                return '**Spirit Stuff**';
            }else if(name == 'resurrection_staff'){
                return '**Resurrection Staff**';
            }else if(name == 'culling_scythe'){
                return '**Culling Scythe**';
            }else if(name == 'poison_dagger'){
                return '**Poison Dagger**';
            }
        }
    }
}

function getWeaponName(name){
    if(name == 'great_sword'){
        return '**Great Sword**';
    }else if(name == 'defender_aegis'){
        return '**Defender Aegis**';
    }else if(name == 'wang_of_absorption'){
        return '**Wang of Absorption**';
    }else if(name == 'bow'){
        return '**Bow**';
    }else if(name == 'energy_stuff'){
        return '**Energy Stuff**';
    }else if(name == 'healing_stuff'){
        return '**Healing Stuff**';
    }else if(name == 'orb_of_potency'){
        return '**Orb of Potency**';
    }else if(name == 'rune_of_the_forgotten'){
        return '**Rune of the Forgotten**';
    }else if(name == 'crune_of_celebration'){
        return '**Crune of Celebration**';
    }else if(name == 'spirit_stuff'){
        return '**Spirit Stuff**';
    }else if(name == 'resurrection_staff'){
        return '**Resurrection Staff**';
    }else if(name == 'culling_scythe'){
        return '**Culling Scythe**';
    }else if(name == 'poison_dagger'){
        return '**Poison Dagger**';
    }
}

function getRank(rank){
    if(rank == 'common'){
        return gif.animal_rank_1;
    }else if(rank == 'uncommon'){
        return gif.animal_rank_2;
    }else if(rank == 'rare'){
        return gif.animal_rank_3;
    }else if(rank == 'epic'){
        return gif.animal_rank_4;
    }else if(rank == 'mythical'){
        return gif.animal_rank_5;
    }else if(rank == 'legendary'){
        return gif.animal_rank_6;
    }else if(rank == 'febled'){
        return gif.animal_rank_8;
    }else{
        return '';
    }
}

function activeWeapon(sat, weapon_name, weapon_passive, percen){

    const power = percen / 100;

    if(weapon_name == 'great_sword'){
        sat.demage_point = power;

    }else if(weapon_name == 'defender_aegis'){
        sat.pr += parseInt(sat.pr * power);
        sat.mr += parseInt(sat.mr * power);

    }else if(weapon_name == 'wang_of_absorption'){
        sat.mag_point = power;

    }else if(weapon_name == 'bow'){
        sat.demage_point = power;

    }else if(weapon_name == 'energy_stuff'){
        sat.mag_point = power;

    }else if(weapon_name == 'healing_stuff'){
        sat.increase_hp_point = power;

    }else if(weapon_name == 'crune_of_celebration'){
        sat.increase_hp_point = parseInt((power*sat.main_hp)+200);

    }else if(weapon_name == 'rune_of_the_forgotten'){
        sat.increase_demage_point = parseInt((power*(sat.str+sat.mag))+200);

    }else if(weapon_name == 'spirit_stuff'){
        const defend_percen = parseInt(getRandomInt(20, 31)/100);
        sat.pr += parseInt(sat.pr*defend_percen);
        sat.mr += parseInt(sat.mr*defend_percen);

    }else if(weapon_name == 'culling_scythe'){
        sat.culling_point = power;

    }else if(weapon_name == 'resurrection_staff'){
        sat.resurrection_revive_heal = power;
    }


    if(weapon_passive == 'physical_Resistance_effect'){
        sat.pr += parseInt(sat.pr * power);

    }else if(weapon_passive == 'magic_Resistance_effect'){
        sat.mr += parseInt(sat.mr * power);

    }else if(weapon_passive == 'strength_effect'){
        sat.str += parseInt(sat.str * power);

    }else if(weapon_passive == 'magic_effect'){
        sat.mag += parseInt(sat.mag * power);

    }else if(weapon_passive == 'health_point_effect'){
        sat.hp += parseInt(sat.hp * power);

    }else if(weapon_passive == 'weapon_point_effect'){
        sat.wp += parseInt(sat.mag * power);

    }else if(weapon_passive == 'sprout_Effect'){
        const increase_heal_point = getRandomInt(20, 41);
        sat.increase_hp_point += increase_heal_point / 100;
    }

    return sat;
}

function battleAllEntity(entities, sat1, sat2, sat3, ene1, ene2, ene3){
    entities.forEach(entity => {
        if (entity.weapon_bool == true){
            try{
                if(entity.weapon_passive == 'thorns_Effect'){
                    const thorns_ran = parseInt(getRandomInt(15, 36)/100);
                    if([sat1, sat2, sat3].includes(entity)){
                        if((sat1.weapon_passive == 'thorns_Effect') && (sat1.wp > 0)){
                            if((sat1.hp -= ene1.str) || (sat1.hp -= ene1.mag) && ene1.bool){
                                const allDemage = ene1.str + ene1.mag;
                                ene1.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((sat1.hp -= ene2.str) || (sat1.hp -= ene2.mag) && ene2.bool){
                                const allDemage = ene2.str + ene2.mag;
                                ene2.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((sat1.hp -= ene3.str) || (sat1.hp -= ene3.mag) && ene3.bool){
                                const allDemage = ene3.str + ene3.mag;
                                ene3.hp -= parseInt(allDemage*thorns_ran);
                            }
                        }
                        if((sat2.weapon_passive == 'thorns_Effect') && (sat2.wp > 0)){
                            if((sat2.hp -= ene1.str) || (sat2.hp -= ene1.mag) && ene1.bool){
                                const allDemage = ene1.str + ene1.mag;
                                ene1.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((sat2.hp -= ene2.str) || (sat2.hp -= ene2.mag) && ene2.bool){
                                const allDemage = ene2.str + ene2.mag;
                                ene2.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((sat2.hp -= ene3.str) || (sat2.hp -= ene3.mag) && ene3.bool){
                                const allDemage = ene3.str + ene3.mag;
                                ene3.hp -= parseInt(allDemage*thorns_ran);
                            }
                        }
                        if((sat3.weapon_passive == 'thorns_Effect') && (sat3.wp > 0)){
                            if((sat3.hp -= ene1.str) || (sat3.hp -= ene1.mag) && ene1.bool){
                                const allDemage = ene1.str + ene1.mag;
                                ene1.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((sat3.hp -= ene2.str) || (sat3.hp -= ene2.mag) && ene2.bool){
                                const allDemage = ene2.str + ene2.mag;
                                ene2.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((sat3.hp -= ene3.str) || (sat3.hp -= ene3.mag) && ene3.bool){
                                const allDemage = ene3.str + ene3.mag;
                                ene3.hp -= parseInt(allDemage*thorns_ran);
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if((ene1.weapon_passive == 'thorns_Effect') && (ene1.wp > 0)){
                            if((ene1.hp -= sat1.str) || (ene1.hp -= sat1.mag) && sat1.bool){
                                const allDemage = sat1.str + sat1.mag;
                                sat1.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((ene1.hp -= sat2.str) || (ene1.hp -= sat2.mag) && sat2.bool){
                                const allDemage = sat2.str + sat2.mag;
                                sat2.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((ene1.hp -= sat3.str) || (ene1.hp -= sat3.mag) && sat3.bool){
                                const allDemage = sat3.str + sat3.mag;
                                sat3.hp -= parseInt(allDemage*thorns_ran);
                            }
                        }
                        if((ene2.weapon_passive == 'thorns_Effect') && (ene1.wp > 0)){
                            if((ene2.hp -= sat1.str) || (ene2.hp -= sat1.mag) && sat1.bool){
                                const allDemage = sat1.str + sat1.mag;
                                sat1.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((ene2.hp -= sat2.str) || (ene2.hp -= sat2.mag) && sat2.bool){
                                const allDemage = sat2.str + sat2.mag;
                                sat2.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((ene2.hp -= sat3.str) || (ene2.hp -= sat3.mag) && sat3.bool){
                                const allDemage = sat3.str + sat3.mag;
                                sat3.hp -= parseInt(allDemage*thorns_ran);
                            }
                        }
                        if((ene3.weapon_passive == 'thorns_Effect') && (ene1.wp > 0)){
                            if((ene3.hp -= sat1.str) || (ene3.hp -= sat1.mag) && sat1.bool){
                                const allDemage = sat1.str + sat1.mag;
                                sat1.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((ene3.hp -= sat2.str) || (ene3.hp -= sat2.mag) && sat2.bool){
                                const allDemage = sat2.str + sat2.mag;
                                sat2.hp -= parseInt(allDemage*thorns_ran);
                            }
                            if((ene3.hp -= sat3.str) || (ene3.hp -= sat3.mag) && sat3.bool){
                                const allDemage = sat3.str + sat3.mag;
                                sat3.hp -= parseInt(allDemage*thorns_ran);
                            }
                        }
                    }
                }
            }catch(error){console.log(`thorns_Effect: ${error}`);}

            try{
                if(entity.weapon_passive == 'sacrifice_Effect' || entity.weapon_passive_two == 'sacrifice_Effect'){
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_passive == 'sacrifice_Effect' || sat1.weapon_passive_two == 'sacrifice_Effect'){
                            if(sat1.hp <= 0 && !sat1.bool){
                                const heal_hp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_wp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_hp = parseInt(heal_hp_percen*sat1.main_hp);
                                const heal_wp = parseInt(heal_wp_percen*sat1.main_wp);

                                if(sat2.bool){
                                    sat2.hp += heal_hp;
                                    sat2.wp += heal_wp;
                                }

                                if(sat3.bool){
                                    sat3.hp += heal_hp;
                                    sat3.wp += heal_wp;
                                }
                            }
                        }
                        if(sat2.weapon_passive == 'sacrifice_Effect' || sat2.weapon_passive_two == 'sacrifice_Effect'){
                            if(sat2.hp <= 0 && !sat2.bool){
                                const heal_hp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_wp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_hp = parseInt(heal_hp_percen*sat2.main_hp);
                                const heal_wp = parseInt(heal_wp_percen*sat2.main_wp);

                                if(sat1.bool){
                                    sat1.hp += heal_hp;
                                    sat1.wp += heal_wp;
                                }

                                if(sat3.bool){
                                    sat3.hp += heal_hp;
                                    sat3.wp += heal_wp;
                                }
                            }
                        }
                        if(sat3.weapon_passive == 'sacrifice_Effect' || sat3.weapon_passive_two == 'sacrifice_Effect'){
                            if(sat3.hp <= 0 && !sat3.bool){
                                const heal_hp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_wp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_hp = parseInt(heal_hp_percen*sat3.main_hp);
                                const heal_wp = parseInt(heal_wp_percen*sat3.main_wp);

                                if(sat1.bool){
                                    sat1.hp += heal_hp;
                                    sat1.wp += heal_wp;
                                }

                                if(sat2.bool){
                                    sat2.hp += heal_hp;
                                    sat2.wp += heal_wp;
                                }
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity) && (ene1.wp > 0 || ene2.wp > 0 || ene3.wp > 0)){
                        if(ene1.weapon_passive == 'sacrifice_Effect' || ene1.weapon_passive_two == 'sacrifice_Effect'){
                            if(ene1.hp <= 0 && !ene1.bool){
                                const heal_hp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_wp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_hp = parseInt(heal_hp_percen*ene1.main_hp);
                                const heal_wp = parseInt(heal_wp_percen*ene1.main_wp);

                                if(ene2.bool){
                                    ene2.hp += heal_hp;
                                    ene2.wp += heal_wp;
                                }

                                if(ene3.bool){
                                    ene3.hp += heal_hp;
                                    ene3.wp += heal_wp;
                                }
                            }
                        }
                        if(ene2.weapon_passive == 'sacrifice_Effect' || ene2.weapon_passive_two == 'sacrifice_Effect'){
                            if(ene2.hp <= 0 && !ene2.bool){
                                const heal_hp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_wp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_hp = parseInt(heal_hp_percen*ene2.main_hp);
                                const heal_wp = parseInt(heal_wp_percen*ene2.main_wp);

                                if(ene1.bool){
                                    ene1.hp += heal_hp;
                                    ene1.wp += heal_wp;
                                }

                                if(ene3.bool){
                                    ene3.hp += heal_hp;
                                    ene3.wp += heal_wp;
                                }
                            }
                        }
                        if(ene3.weapon_passive == 'sacrifice_Effect' || ene3.weapon_passive_two == 'sacrifice_Effect'){
                            if(ene3.hp <= 0 && !ene3.bool){
                                const heal_hp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_wp_percen = parseInt(getRandomInt(50, 76)/100);
                                const heal_hp = parseInt(heal_hp_percen*ene3.main_hp);
                                const heal_wp = parseInt(heal_wp_percen*ene3.main_wp);

                                if(ene1.bool){
                                    ene1.hp += heal_hp;
                                    ene1.wp += heal_wp;
                                }

                                if(ene2.bool){
                                    ene2.hp += heal_hp;
                                    ene2.wp += heal_wp;
                                }
                            }
                        }
                    }
                }
            }catch(error){console.log(`sacrifice_Effect: ${error}`);}

            try{
                if(entity.weapon_passive == 'discharge_Effect'){
                    if([sat1, sat2, sat3].includes(entity) && (sat1.wp > 0 || sat2.wp > 0 || sat3.wp > 0)){
                        if(sat1.weapon_passive == 'discharge_Effect'){
                            if(sat1.wp <= 0){
                                const demage_replenished_percen = parseInt(getRandomInt(40, 70)/100);
                                let demage_replenished = parseInt(sat1.main_wp*demage_replenished_percen);
                                const ene_ran = getRandomInt(1, 4);
                                if(ene_ran == 1 && ene1.bool){
                                    ene1.hp -= resistance(demage_replenished, ene1.mr, ene1.main_hp);
                                }else if(ene_ran == 2 && ene2.bool){
                                    ene2.hp -= resistance(demage_replenished, ene2.mr, ene2.main_hp);
                                }else if(ene_ran == 3 && ene3.bool){
                                    ene3.hp -= resistance(demage_replenished, ene3.mr, ene3.main_hp);
                                }
                            }
                        }
                        if(sat2.weapon_passive == 'discharge_Effect'){
                            if(sat2.wp <= 0){
                                const demage_replenished_percen = parseInt(getRandomInt(40, 70)/100);
                                let demage_replenished = parseInt(sat2.main_wp*demage_replenished_percen);
                                const ene_ran = getRandomInt(1, 4);
                                if(ene_ran == 1 && ene1.bool){
                                    ene1.hp -= resistance(demage_replenished, ene1.mr, ene1.main_hp);
                                }else if(ene_ran == 2 && ene2.bool){
                                    ene2.hp -= resistance(demage_replenished, ene2.mr, ene2.main_hp);
                                }else if(ene_ran == 3 && ene3.bool){
                                    ene3.hp -= resistance(demage_replenished, ene3.mr, ene3.main_hp);
                                }
                            }
                        }
                        if(sat3.weapon_passive == 'discharge_Effect'){
                            if(sat3.wp <= 0){
                                const demage_replenished_percen = parseInt(getRandomInt(40, 70)/100);
                                let demage_replenished = parseInt(sat3.main_wp*demage_replenished_percen);
                                const ene_ran = getRandomInt(1, 4);
                                if(ene_ran == 1 && ene1.bool){
                                    ene1.hp -= resistance(demage_replenished, ene1.mr, ene1.main_hp);
                                }else if(ene_ran == 2 && ene2.bool){
                                    ene2.hp -= resistance(demage_replenished, ene2.mr, ene2.main_hp);
                                }else if(ene_ran == 3 && ene3.bool){
                                    ene3.hp -= resistance(demage_replenished, ene3.mr, ene3.main_hp);
                                }
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity) && (ene1.wp > 0 || ene2.wp > 0 || ene3.wp > 0)){
                        if(ene1.weapon_passive == 'discharge_Effect'){
                            if(ene1.wp <= 0){
                                const demage_replenished_percen = parseInt(getRandomInt(40, 70)/100);
                                let demage_replenished = parseInt(ene1.main_wp*demage_replenished_percen);
                                const sat_ran = getRandomInt(1, 4);
                                if(sat_ran == 1 && sat1.bool){
                                    sat1.hp -= resistance(demage_replenished, sat1.mr, sat1.main_hp);
                                }else if(sat_ran == 2 && sat2.bool){
                                    sat2.hp -= resistance(demage_replenished, sat2.mr, sat2.main_hp);
                                }else if(sat_ran == 3 && sat3.bool){
                                    sat3.hp -= resistance(demage_replenished, sat3.mr, sat3.main_hp);
                                }
                            }
                        }
                        if(ene2.weapon_passive == 'discharge_Effect'){
                            if(ene2.wp <= 0){
                                const demage_replenished_percen = parseInt(getRandomInt(40, 70)/100);
                                let demage_replenished = parseInt(ene2.main_wp*demage_replenished_percen);
                                const sat_ran = getRandomInt(1, 4);
                                if(sat_ran == 1 && sat1.bool){
                                    sat1.hp -= resistance(demage_replenished, sat1.mr, sat1.main_hp);
                                }else if(sat_ran == 2 && sat2.bool){
                                    sat2.hp -= resistance(demage_replenished, sat2.mr, sat2.main_hp);
                                }else if(sat_ran == 3 && sat3.bool){
                                    sat3.hp -= resistance(demage_replenished, sat3.mr, sat3.main_hp);
                                }
                            }
                        }
                        if(ene3.weapon_passive == 'discharge_Effect'){
                            if(ene3.wp <= 0){
                                const demage_replenished_percen = parseInt(getRandomInt(40, 70)/100);
                                let demage_replenished = parseInt(ene3.main_wp*demage_replenished_percen);
                                const sat_ran = getRandomInt(1, 4);
                                if(sat_ran == 1 && sat1.bool){
                                    sat1.hp -= resistance(demage_replenished, sat1.mr, sat1.main_hp);
                                }else if(sat_ran == 2 && sat2.bool){
                                    sat2.hp -= resistance(demage_replenished, sat2.mr, sat2.main_hp);
                                }else if(sat_ran == 3 && sat3.bool){
                                    sat3.hp -= resistance(demage_replenished, sat3.mr, sat3.main_hp);
                                }
                            }
                        }
                    }
                }
            }catch(error){console.log(`discharge_Effect: ${error}`);}

            try{
                if(entity.weapon_name == 'poison_dagger'){
                    if(sat1.poison_bool && sat1.poison_round > 0){
                        if(sat1.poison_round <= 0){ sat1.poison_bool = false; sat1.poison_round = 0; }
                        if(sat1.poison_round == 1){
                            sat1.hp -= sat1.poison_demage;
                        }else{
                            sat1.hp -= resistance(sat1.poison_demage, sat1.mr, sat1.main_hp);
                        }
                        sat1.poison_round -= 1;
                    }

                    if(sat2.poison_bool && sat2.poison_round > 0){
                        if(sat2.poison_round <= 0){ sat2.poison_bool = false; sat2.poison_round = 0; }
                        if(sat2.poison_round == 1){
                            sat2.hp -= sat2.poison_demage;
                        }else{
                            sat2.hp -= resistance(sat2.poison_demage, sat2.mr, sat2.main_hp);
                        }
                        sat2.poison_round -= 1;
                    }

                    if(sat3.poison_bool && sat3.poison_round > 0){
                        if(sat3.poison_round <= 0){ sat3.poison_bool = false; sat3.poison_round = 0; }
                        if(sat3.poison_round == 1){
                            sat3.hp -= sat3.poison_demage;
                        }else{
                            sat3.hp -= resistance(sat3.poison_demage, sat3.mr, sat3.main_hp);
                        }
                        sat3.poison_round -= 1;
                    }

                    if(ene1.poison_bool && ene1.poison_round > 0){
                        if(ene1.poison_round <= 0){ ene1.poison_bool = false; ene1.poison_round = 0; }
                        if(ene1.poison_round == 1){
                            ene1.hp -= ene1.poison_demage;
                        }else{
                            ene1.hp -= resistance(ene1.poison_demage, ene1.mr, ene1.main_hp);
                        }
                        ene1.poison_round -= 1;
                    }

                    if(ene2.poison_bool && ene2.poison_round > 0){
                        if(ene2.poison_round <= 0){ ene2.poison_bool = false; ene2.poison_round = 0; }
                        if(ene2.poison_round == 1){
                            ene2.hp -= ene2.poison_demage;
                        }else{
                            ene2.hp -= resistance(ene2.poison_demage, ene2.mr, ene2.main_hp);
                        }
                        ene2.poison_round -= 1;
                    }

                    if(ene3.poison_bool && ene3.poison_round > 0){
                        if(ene3.poison_round <= 0){ ene3.poison_bool = false; ene3.poison_round = 0; }
                        if(ene3.poison_round == 1){
                            ene3.hp -= ene3.poison_demage;
                        }else{
                            ene3.hp -= resistance(ene3.poison_demage, ene3.mr, ene3.main_hp);
                        }
                        ene3.poison_round -= 1;
                    }


                    const poison_dagger_demage_ran = parseInt((getRandomInt(70, 101)/100));
                    const take_wp = getRandomInt(100, 201);
                    if([sat1, sat2, sat3].includes(entity)){
                        if((sat1.weapon_name == 'poison_dagger') && (sat1.wp > 0)){
                            const poison_dagger_demage = sat1.str - parseInt(poison_dagger_demage_ran * sat1.str);
                            const ene_ran = getRandomInt(1, 4);
                            sat1.wp -= take_wp;
                            if(ene_ran == 1 && ene1.bool){
                                ene1.hp -= resistance(poison_dagger_demage, ene1.pr, ene1.main_hp);
                                ene1.poison_bool = true;
                                ene1.poison_round += 3;
                                ene1.poison_demage = parseInt(sat1.mag - (sat1.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 2 && ene2.bool){
                                ene2.hp -= resistance(poison_dagger_demage, ene2.pr, ene2.main_hp);
                                ene2.poison_bool = true;
                                ene2.poison_round += 3;
                                ene2.poison_demage = parseInt(sat1.mag - (sat1.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 3 && ene3.bool){
                                ene3.hp -= resistance(poison_dagger_demage, ene3.pr, ene3.main_hp);
                                ene3.poison_bool = true;
                                ene3.poison_round += 3;
                                ene3.poison_demage = parseInt(sat1.mag - (sat1.mag * (getRandomInt(40, 66)/100)));
                            }
                        }
                        if((sat2.weapon_name == 'poison_dagger') && (sat2.wp > 0)){
                            const poison_dagger_demage = sat2.str - parseInt(poison_dagger_demage_ran * sat2.str);
                            const ene_ran = getRandomInt(1, 4);
                            sat2.wp -= take_wp;
                            if(ene_ran == 1 && ene1.bool){
                                ene1.hp -= resistance(poison_dagger_demage, ene1.pr, ene1.main_hp);
                                ene1.poison_bool = true;
                                ene1.poison_round += 3;
                                ene1.poison_demage = parseInt(sat2.mag - (sat2.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 2 && ene2.bool){
                                ene2.hp -= resistance(poison_dagger_demage, ene2.pr, ene2.main_hp);
                                ene2.poison_bool = true;
                                ene2.poison_round += 3;
                                ene2.poison_demage = parseInt(sat2.mag - (sat2.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 3 && ene3.bool){
                                ene3.hp -= resistance(poison_dagger_demage, ene3.pr, ene3.main_hp);
                                ene3.poison_bool = true;
                                ene3.poison_round += 3;
                                ene3.poison_demage = parseInt(sat2.mag - (sat2.mag * (getRandomInt(40, 66)/100)));
                            }
                        }
                        if((sat3.weapon_name == 'poison_dagger') && (sat3.wp > 0)){
                            const poison_dagger_demage = sat3.str - parseInt(poison_dagger_demage_ran * sat3.str);
                            const ene_ran = getRandomInt(1, 4);
                            sat3.wp -= take_wp;
                            if(ene_ran == 1 && ene1.bool){
                                ene1.hp -= resistance(poison_dagger_demage, ene1.pr, ene1.main_hp);
                                ene1.poison_bool = true;
                                ene1.poison_round += 3;
                                ene1.poison_demage = parseInt(sat3.mag - (sat3.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 2 && ene2.bool){
                                ene2.hp -= resistance(poison_dagger_demage, ene2.pr, ene2.main_hp);
                                ene2.poison_bool = true;
                                ene2.poison_round += 3;
                                ene2.poison_demage = parseInt(sat3.mag - (sat3.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 3 && ene3.bool){
                                ene3.hp -= resistance(poison_dagger_demage, ene3.pr, ene3.main_hp);
                                ene3.poison_bool = true;
                                ene3.poison_round += 3;
                                ene3.poison_demage = parseInt(sat3.mag - (sat3.mag * (getRandomInt(40, 66)/100)));
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'poison_dagger' && (ene1.wp > 0)){
                            const poison_dagger_demage = ene1.str - parseInt(poison_dagger_demage_ran * ene1.str);
                            const ene_ran = getRandomInt(1, 4);
                            ene1.wp -= take_wp;
                            if(ene_ran == 1 && sat1.bool){
                                sat1.hp -= resistance(poison_dagger_demage, sat1.pr, sat1.main_hp);
                                sat1.poison_bool = true;
                                sat1.poison_round += 3;
                                sat1.poison_demage = parseInt(ene1.mag - (ene1.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 2 && sat2.bool){
                                sat2.hp -= resistance(poison_dagger_demage, sat2.pr, sat2.main_hp);
                                sat2.poison_bool = true;
                                sat2.poison_round += 3;
                                sat2.poison_demage = parseInt(ene1.mag - (ene1.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 3 && sat3.bool){
                                sat3.hp -= resistance(poison_dagger_demage, sat3.pr, sat3.main_hp);
                                sat3.poison_bool = true;
                                sat3.poison_round += 3;
                                sat3.poison_demage = parseInt(ene1.mag - (ene1.mag * (getRandomInt(40, 66)/100)));
                            }
                        }
                        if((ene2.weapon_name == 'poison_dagger') && (ene2.wp > 0)){
                            const poison_dagger_demage = ene2.str - parseInt(poison_dagger_demage_ran * ene2.str);
                            const ene_ran = getRandomInt(1, 4);
                            ene2.wp -= take_wp;
                            if(ene_ran == 1 && sat1.bool){
                                sat1.hp -= resistance(poison_dagger_demage, sat1.pr, sat1.main_hp);
                                sat1.poison_bool = true;
                                sat1.poison_round += 3;
                                sat1.poison_demage = parseInt(ene2.mag - (ene2.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 2 && sat2.bool){
                                sat2.hp -= resistance(poison_dagger_demage, sat2.pr, sat2.main_hp);
                                sat2.poison_bool = true;
                                sat2.poison_round += 3;
                                sat2.poison_demage = parseInt(ene2.mag - (ene2.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 3 && sat3.bool){
                                sat3.hp -= resistance(poison_dagger_demage, sat3.pr, sat3.main_hp);
                                sat3.poison_bool = true;
                                sat3.poison_round += 3;
                                sat3.poison_demage = parseInt(ene2.mag - (ene2.mag * (getRandomInt(40, 66)/100)));
                            }
                        }
                        if((ene3.weapon_name == 'poison_dagger') && (ene3.wp > 0)){
                            const poison_dagger_demage = ene3.str - parseInt(poison_dagger_demage_ran * ene3.str);
                            const ene_ran = getRandomInt(1, 4);
                            ene3.wp -= take_wp;
                            if(ene_ran == 1 && sat1.bool){
                                sat1.hp -= resistance(poison_dagger_demage, sat1.pr, sat1.main_hp);
                                sat1.poison_bool = true;
                                sat1.poison_round += 3;
                                sat1.poison_demage = parseInt(ene3.mag - (ene3.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 2 && sat2.bool){
                                sat2.hp -= resistance(poison_dagger_demage, sat2.pr, sat2.main_hp);
                                sat2.poison_bool = true;
                                sat2.poison_round += 3;
                                sat2.poison_demage = parseInt(ene3.mag - (ene3.mag * (getRandomInt(40, 66)/100)));
                            }else if(ene_ran == 3 && sat3.bool){
                                sat3.hp -= resistance(poison_dagger_demage, sat3.pr, sat3.main_hp);
                                sat3.poison_bool = true;
                                sat3.poison_round += 3;
                                sat3.poison_demage = parseInt(ene3.mag - (ene3.mag * (getRandomInt(40, 66)/100)));
                            }
                        }
                    }
                }
            }catch(error){console.log(`poison_dagger: ${error}`);}

            try{
                if(entity.weapon_name == 'spirit_stuff'){
                    if(sat1.defend_up_bool && sat1.defend_up_round > 0){
                        sat1.defend_up_round -= 1;
                        if(sat1.defend_up_round <= 0){
                            sat1.pr -= sat1.defend_up_defend_pr;
                            sat1.mr -= sat1.defend_up_defend_mr;
                            sat1.defend_up_round = 0;
                            sat1.defend_up_bool = false;
                        }
                    }

                    if(sat2.defend_up_bool && sat2.defend_up_round > 0){
                        sat2.defend_up_round -= 1;
                        if(sat2.defend_up_round <= 0){
                            sat2.pr -= sat2.defend_up_defend_pr;
                            sat2.mr -= sat2.defend_up_defend_mr;
                            sat2.defend_up_round = 0;
                            sat2.defend_up_bool = false;
                        }
                    }

                    if(sat3.defend_up_bool && sat3.defend_up_round > 0){
                        sat3.defend_up_round -= 1;
                        if(sat3.defend_up_round <= 0){
                            sat3.pr -= sat3.defend_up_defend_pr;
                            sat3.mr -= sat3.defend_up_defend_mr;
                            sat3.defend_up_round = 0;
                            sat3.defend_up_bool = false;
                        }
                    }

                    if(ene1.defend_up_bool && ene1.defend_up_round > 0){
                        ene1.defend_up_round -= 1;
                        if(ene1.defend_up_round <= 0){
                            ene1.pr -= ene1.defend_up_defend_pr;
                            ene1.mr -= ene1.defend_up_defend_mr;
                            ene1.defend_up_round = 0;
                            ene1.defend_up_bool = false;
                        }
                    }

                    if(ene2.defend_up_bool && ene2.defend_up_round > 0){
                        ene2.defend_up_round -= 1;
                        if(ene1.defend_up_round <= 0){
                            ene2.pr -= ene2.defend_up_defend_pr;
                            ene2.mr -= ene2.defend_up_defend_mr;
                            ene2.defend_up_round = 0;
                            ene2.defend_up_bool = false;
                        }
                    }

                    if(ene3.defend_up_bool && ene3.defend_up_round > 0){
                        ene3.defend_up_round -= 1;
                        if(ene3.defend_up_round <= 0){
                            ene3.pr -= ene3.defend_up_defend_pr;
                            ene3.mr -= ene3.defend_up_defend_mr;
                            ene3.defend_up_round = 0;
                            ene3.defend_up_bool = false;
                        }
                    }

                    const spirit_stuff_percen = parseInt((getRandomInt(30, 51)/100));
                    const take_wp = getRandomInt(125, 226);
                    if([sat1, sat2, sat3].includes(entity)){
                        if((sat1.weapon_name == 'spirit_stuff') && (sat1.wp > 0)){
                            const healing = parseInt(spirit_stuff_percen*sat1.mag);
                            sat1.wp -= take_wp;
                            if(sat1.bool){
                                sat1.hp += healing;
                                sat1.defend_up_round += 2;
                                sat1.defend_up_defend_pr = parseInt((sat1.pr) - (sat1.pr * getRandomInt(20, 41) / 100));
                                sat1.defend_up_defend_mr = parseInt((sat1.mr) - (sat1.mr * getRandomInt(20, 41) / 100));
                                if(sat1.defend_up_bool == false){
                                    sat1.pr += sat1.defend_up_defend_pr;
                                    sat1.mr += sat1.defend_up_defend_mr;
                                }
                                sat1.defend_up_bool = true;
                            }
                            if(sat2.bool){
                                sat2.hp += healing;
                                sat2.defend_up_round += 2;
                                sat2.defend_up_defend_pr = parseInt((sat2.pr) - (sat2.pr * getRandomInt(20, 41) / 100));
                                sat2.defend_up_defend_mr = parseInt((sat2.mr) - (sat2.mr * getRandomInt(20, 41) / 100));
                                if(sat2.defend_up_bool == false){
                                    sat2.pr += sat2.defend_up_defend_pr;
                                    sat2.mr += sat2.defend_up_defend_mr;
                                }
                                sat2.defend_up_bool = true;
                            }
                            if(sat3.bool){
                                sat3.hp += healing;
                                sat3.defend_up_round += 2;
                                sat3.defend_up_defend_pr = parseInt((sat3.pr) - (sat3.pr * getRandomInt(20, 41) / 100));
                                sat3.defend_up_defend_mr = parseInt((sat3.mr) - (sat3.mr * getRandomInt(20, 41) / 100));
                                if(sat3.defend_up_bool == false){
                                    sat3.pr += sat3.defend_up_defend_pr;
                                    sat3.mr += sat3.defend_up_defend_mr;
                                }
                                sat3.defend_up_bool = true;
                            }
                        }
                        if((sat2.weapon_name == 'spirit_stuff') && (sat2.wp > 0)){
                            const healing = parseInt(spirit_stuff_percen*sat2.mag);
                            sat2.wp -= take_wp;
                            if(sat1.bool){
                                sat1.hp += healing;
                                sat1.defend_up_round += 2;
                                sat1.defend_up_defend_pr = parseInt((sat1.pr) - (sat1.pr * getRandomInt(20, 41) / 100));
                                sat1.defend_up_defend_mr = parseInt((sat1.mr) - (sat1.mr * getRandomInt(20, 41) / 100));
                                if(sat1.defend_up_bool == false){
                                    sat1.pr += sat1.defend_up_defend_pr;
                                    sat1.mr += sat1.defend_up_defend_mr;
                                }
                                sat1.defend_up_bool = true;
                            }
                            if(sat2.bool){
                                sat2.hp += healing;
                                sat2.defend_up_round += 2;
                                sat2.defend_up_defend_pr = parseInt((sat2.pr) - (sat2.pr * getRandomInt(20, 41) / 100));
                                sat2.defend_up_defend_mr = parseInt((sat2.mr) - (sat2.mr * getRandomInt(20, 41) / 100));
                                if(sat2.defend_up_bool == false){
                                    sat2.pr += sat2.defend_up_defend_pr;
                                    sat2.mr += sat2.defend_up_defend_mr;
                                }
                                sat2.defend_up_bool = true;
                            }
                            if(sat3.bool){
                                sat3.hp += healing;
                                sat3.defend_up_round += 2;
                                sat3.defend_up_defend_pr = parseInt((sat3.pr) - (sat3.pr * getRandomInt(20, 41) / 100));
                                sat3.defend_up_defend_mr = parseInt((sat3.mr) - (sat3.mr * getRandomInt(20, 41) / 100));
                                if(sat3.defend_up_bool == false){
                                    sat3.pr += sat3.defend_up_defend_pr;
                                    sat3.mr += sat3.defend_up_defend_mr;
                                }
                                sat3.defend_up_bool = true;
                            }
                        }
                        if((sat3.weapon_name == 'spirit_stuff') && (sat3.wp > 0)){
                            const healing = parseInt(spirit_stuff_percen*sat3.mag);
                            sat3.wp -= take_wp;
                            if(sat1.bool){
                                sat1.hp += healing;
                                sat1.defend_up_round += 2;
                                sat1.defend_up_defend_pr = parseInt((sat1.pr) - (sat1.pr * getRandomInt(20, 41) / 100));
                                sat1.defend_up_defend_mr = parseInt((sat1.mr) - (sat1.mr * getRandomInt(20, 41) / 100));
                                if(sat1.defend_up_bool == false){
                                    sat1.pr += sat1.defend_up_defend_pr;
                                    sat1.mr += sat1.defend_up_defend_mr;
                                }
                                sat1.defend_up_bool = true;
                            }
                            if(sat2.bool){
                                sat2.hp += healing;
                                sat2.defend_up_round += 2;
                                sat2.defend_up_defend_pr = parseInt((sat2.pr) - (sat2.pr * getRandomInt(20, 41) / 100));
                                sat2.defend_up_defend_mr = parseInt((sat2.mr) - (sat2.mr * getRandomInt(20, 41) / 100));
                                if(sat2.defend_up_bool == false){
                                    sat2.pr += sat2.defend_up_defend_pr;
                                    sat2.mr += sat2.defend_up_defend_mr;
                                }
                                sat2.defend_up_bool = true;
                            }
                            if(sat3.bool){
                                sat3.hp += healing;
                                sat3.defend_up_round += 2;
                                sat3.defend_up_defend_pr = parseInt((sat3.pr) - (sat3.pr * getRandomInt(20, 41) / 100));
                                sat3.defend_up_defend_mr = parseInt((sat3.mr) - (sat3.mr * getRandomInt(20, 41) / 100));
                                if(sat3.defend_up_bool == false){
                                    sat3.pr += sat3.defend_up_defend_pr;
                                    sat3.mr += sat3.defend_up_defend_mr;
                                }
                                sat3.defend_up_bool = true;
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'spirit_stuff' && (ene1.wp > 0)){
                            const healing = parseInt(spirit_stuff_percen*ene1.mag);
                            ene1.wp -= take_wp;
                            if(ene1.bool){
                                ene1.hp += healing;
                                ene1.defend_up_round += 2;
                                ene1.defend_up_defend_pr = parseInt((ene1.pr) - (ene1.pr * getRandomInt(20, 41) / 100));
                                ene1.defend_up_defend_mr = parseInt((ene1.mr) - (ene1.mr * getRandomInt(20, 41) / 100));
                                if(ene1.defend_up_bool == false){
                                    ene1.pr += ene1.defend_up_defend_pr;
                                    ene1.mr += ene1.defend_up_defend_mr;
                                }
                                ene1.defend_up_bool = true;
                            }
                            if(ene2.bool){
                                ene2.hp += healing;
                                ene2.defend_up_round += 2;
                                ene2.defend_up_defend_pr = parseInt((ene2.pr) - (ene2.pr * getRandomInt(20, 41) / 100));
                                ene2.defend_up_defend_mr = parseInt((ene2.mr) - (ene2.mr * getRandomInt(20, 41) / 100));
                                if(ene2.defend_up_bool == false){
                                    ene2.pr += ene2.defend_up_defend_pr;
                                    ene2.mr += ene2.defend_up_defend_mr;
                                }
                                ene2.defend_up_bool = true;
                            }
                            if(ene3.bool){
                                ene3.hp += healing;
                                ene3.defend_up_round += 2;
                                ene3.defend_up_defend_pr = parseInt((ene3.pr) - (ene3.pr * getRandomInt(20, 41) / 100));
                                ene3.defend_up_defend_mr = parseInt((ene3.mr) - (ene3.mr * getRandomInt(20, 41) / 100));
                                if(ene3.defend_up_bool == false){
                                    ene3.pr += ene3.defend_up_defend_pr;
                                    ene3.mr += ene3.defend_up_defend_mr;
                                }
                                ene3.defend_up_bool = true;
                            }
                        }
                        if((ene2.weapon_name == 'spirit_stuff') && (ene2.wp > 0)){
                            const healing = parseInt(spirit_stuff_percen*ene2.mag);
                            ene2.wp -= take_wp;
                            if(ene1.bool){
                                ene1.hp += healing;
                                ene1.defend_up_round += 2;
                                ene1.defend_up_defend_pr = parseInt((ene1.pr) - (ene1.pr * getRandomInt(20, 41) / 100));
                                ene1.defend_up_defend_mr = parseInt((ene1.mr) - (ene1.mr * getRandomInt(20, 41) / 100));
                                if(ene1.defend_up_bool == false){
                                    ene1.pr += ene1.defend_up_defend_pr;
                                    ene1.mr += ene1.defend_up_defend_mr;
                                }
                                ene1.defend_up_bool = true;
                            }
                            if(ene2.bool){
                                ene2.hp += healing;
                                ene2.defend_up_round += 2;
                                ene2.defend_up_defend_pr = parseInt((ene2.pr) - (ene2.pr * getRandomInt(20, 41) / 100));
                                ene2.defend_up_defend_mr = parseInt((ene2.mr) - (ene2.mr * getRandomInt(20, 41) / 100));
                                if(ene2.defend_up_bool == false){
                                    ene2.pr += ene2.defend_up_defend_pr;
                                    ene2.mr += ene2.defend_up_defend_mr;
                                }
                                ene2.defend_up_bool = true;
                            }
                            if(ene3.bool){
                                ene3.hp += healing;
                                ene3.defend_up_round += 2;
                                ene3.defend_up_defend_pr = parseInt((ene3.pr) - (ene3.pr * getRandomInt(20, 41) / 100));
                                ene3.defend_up_defend_mr = parseInt((ene3.mr) - (ene3.mr * getRandomInt(20, 41) / 100));
                                if(ene3.defend_up_bool == false){
                                    ene3.pr += ene3.defend_up_defend_pr;
                                    ene3.mr += ene3.defend_up_defend_mr;
                                }
                                ene3.defend_up_bool = true;
                            }
                        }
                        if((ene3.weapon_name == 'spirit_stuff') && (ene3.wp > 0)){
                            const healing = parseInt(spirit_stuff_percen*ene3.mag);
                            ene3.wp -= take_wp;
                            if(ene1.bool){
                                ene1.hp += healing;
                                ene1.defend_up_round += 2;
                                ene1.defend_up_defend_pr = parseInt((ene1.pr) - (ene1.pr * getRandomInt(20, 41) / 100));
                                ene1.defend_up_defend_mr = parseInt((ene1.mr) - (ene1.mr * getRandomInt(20, 41) / 100));
                                if(ene1.defend_up_bool == false){
                                    ene1.pr += ene1.defend_up_defend_pr;
                                    ene1.mr += ene1.defend_up_defend_mr;
                                }
                                ene1.defend_up_bool = true;
                            }
                            if(ene2.bool){
                                ene2.hp += healing;
                                ene2.defend_up_round += 2;
                                ene2.defend_up_defend_pr = parseInt((ene2.pr) - (ene2.pr * getRandomInt(20, 41) / 100));
                                ene2.defend_up_defend_mr = parseInt((ene2.mr) - (ene2.mr * getRandomInt(20, 41) / 100));
                                if(ene2.defend_up_bool == false){
                                    ene2.pr += ene2.defend_up_defend_pr;
                                    ene2.mr += ene2.defend_up_defend_mr;
                                }
                                ene2.defend_up_bool = true;
                            }
                            if(ene3.bool){
                                ene3.hp += healing;
                                ene3.defend_up_round += 2;
                                ene3.defend_up_defend_pr = parseInt((ene3.pr) - (ene3.pr * getRandomInt(20, 41) / 100));
                                ene3.defend_up_defend_mr = parseInt((ene3.mr) - (ene3.mr * getRandomInt(20, 41) / 100));
                                if(ene3.defend_up_bool == false){
                                    ene3.pr += ene3.defend_up_defend_pr;
                                    ene3.mr += ene3.defend_up_defend_mr;
                                }
                                ene3.defend_up_bool = true;
                            }
                        }
                    }
                }
            }catch(error){console.log(`spirit_stuff: ${error}`);}
            try{
                if(entity.weapon_name == 'resurrection_staff'){
                    const take_wp = getRandomInt(300, 401);
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'resurrection_staff'){
                            if(!sat2.bool && sat2.hp <= 0 && sat1.wp > 0){
                                sat1.wp -= take_wp;
                                sat2.hp += parseInt(sat1.resurrection_revive_heal * sat1.mag);
                            }
                            if(!sat3.bool && sat3.hp <= 0 && sat1.wp > 0){
                                sat1.wp -= take_wp;
                                sat3.hp += parseInt(sat1.resurrection_revive_heal * sat1.mag);
                            }
                        }
                        if(sat2.weapon_name == 'resurrection_staff'){
                            if(!sat1.bool && sat1.hp <= 0 && sat2.wp > 0){
                                sat2.wp -= take_wp;
                                sat1.hp += parseInt(sat2.resurrection_revive_heal * sat2.mag);
                            }
                            if(!sat3.bool && sat3.hp <= 0 && sat2.wp > 0){
                                sat2.wp -= take_wp;
                                sat3.hp += parseInt(sat2.resurrection_revive_heal * sat2.mag);
                            }
                        }
                        if(sat3.weapon_name == 'resurrection_staff'){
                            if(!sat1.bool && sat1.hp <= 0 && sat3.wp > 0){
                                sat3.wp -= take_wp;
                                sat1.hp += parseInt(sat3.resurrection_revive_heal * sat3.mag);
                            }
                            if(!sat3.bool && sat3.hp <= 0 && sat3.wp > 0){
                                sat3.wp -= take_wp;
                                sat3.hp += parseInt(sat3.resurrection_revive_heal * sat3.mag);
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'resurrection_staff'){
                            if(!ene2.bool && ene2.hp <= 0 && ene1.wp > 0){
                                ene1.wp -= take_wp;
                                ene2.hp += parseInt(ene1.resurrection_revive_heal * ene1.mag);
                            }
                            if(!ene3.bool && ene3.hp <= 0 && ene1.wp > 0){
                                ene1.wp -= take_wp;
                                ene3.hp += parseInt(ene1.resurrection_revive_heal * ene1.mag);

                            }
                            if(ene2.weapon_name == 'resurrection_staff'){
                                if(!ene1.bool && ene2.hp <= 0 && ene2.wp > 0){
                                    ene2.wp -= take_wp;
                                    ene1.hp += parseInt(ene2.resurrection_revive_heal * ene2.mag);
                                }
                                if(!ene3.bool && ene3.hp <= 0 && ene2.wp > 0){
                                    ene2.wp -= take_wp;
                                    ene3.hp += parseInt(ene2.resurrection_revive_heal * ene2.mag);

                                }
                            }
                            if(ene3.weapon_name == 'resurrection_staff'){
                                if(!ene1.bool && ene2.hp <= 0 && ene3.wp > 0){
                                    ene3.wp -= take_wp;
                                    ene1.hp += parseInt(ene3.resurrection_revive_heal * ene3.mag);
                                }
                                if(!ene2.bool && ene3.hp <= 0 && ene3.wp > 0){
                                    ene3.wp -= take_wp;
                                    ene2.hp += parseInt(ene3.resurrection_revive_heal * ene3.mag);

                                }
                            }
                        }
                    }
                }
            }catch(error){console.log(`resurrection_staff: ${error}`);}

            try{
                if(entity.weapon_name == 'healing_stuff'){
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'healing_stuff' && sat1.wp > 0){
                            const take_wp = getRandomInt(150, 226);
                            sat1.wp -= take_wp;
                            const healing = parseInt(sat1.mag * sat1.increase_hp_point);
                            if((sat2.hp < (sat1.hp && sat3.hp)) && sat2.bool){
                                sat2.hp += healing;
                            }else if((sat3.hp < (sat1.hp && sat2.hp)) && sat3.bool){
                                sat3.hp += healing;
                            }
                        }
                        if(sat2.weapon_name == 'healing_stuff' && sat2.wp > 0){
                            const take_wp = getRandomInt(150, 226);
                            sat2.wp -= take_wp;
                            const healing = parseInt(sat2.mag * sat2.increase_hp_point);
                            if((sat1.hp < (sat2.hp && sat3.hp)) && sat1.bool){
                                sat1.hp += healing;
                            }else if((sat3.hp < (sat1.hp && sat2.hp)) && sat3.bool){
                                sat3.hp += healing;
                            }
                        }
                        if(sat3.weapon_name == 'healing_stuff' && sat3.wp > 0){
                            const take_wp = getRandomInt(150, 226);
                            sat3.wp -= take_wp;
                            const healing = parseInt(sat3.mag * sat3.increase_hp_point);
                            if((sat1.hp < (sat2.hp && sat3.hp)) && sat1.bool){
                                sat1.hp += healing;
                            }else if((sat2.hp < (sat1.hp && sat3.hp)) && sat2.bool){
                                sat2.hp += healing;
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        let healing = 0;
                        if(ene1.weapon_name == 'healing_stuff' && ene1.wp > 0){
                            const take_wp = getRandomInt(150, 226);
                            ene1.wp -= take_wp;
                            const healing = parseInt(ene1.mag * ene1.increase_hp_point);
                            if((ene2.hp < (ene1.hp && ene3.hp)) && ene2.bool){
                                ene2.hp += healing;
                            }else if((ene3.hp < (ene1.hp && ene2.hp)) && ene3.bool){
                                ene3.hp += healing;
                            }
                        }
                        if(ene2.weapon_name == 'healing_stuff' && ene2.wp > 0){
                            const take_wp = getRandomInt(150, 226);
                            ene2.wp -= take_wp;
                            const healing = parseInt(ene2.mag * ene2.increase_hp_point);
                            if((ene1.hp < (ene2.hp && ene3.hp)) && ene1.bool){
                                ene1.hp += healing;
                            }else if((ene3.hp < (ene1.hp && ene2.hp)) && ene3.bool){
                                ene3.hp += healing;
                            }
                        }
                        if(ene3.weapon_name == 'healing_stuff' && ene3.wp > 0){
                            const take_wp = getRandomInt(150, 226);
                            ene3.wp -= take_wp;
                            const healing = parseInt(ene3.mag * ene3.increase_hp_point);
                            if((ene1.hp < (ene2.hp && ene3.hp)) && ene1.bool){
                                ene1.hp += healing;
                            }else if((ene2.hp < (ene1.hp && ene3.hp)) && ene2.bool){
                                ene2.hp += healing;
                            }
                        }
                    }
                }
            }catch(error){console.log(`healing_stuff: ${error}`);}

            try{
                if(entity.weapon_name == 'rune_of_the_forgotten'){
                    if([sat1, sat2, sat3].includes(entity) && (sat1.wp > 0 || sat2.wp > 0 || sat3.wp > 0)){
                        if(sat1.weapon_name == 'rune_of_the_forgotten' && sat1.wp > 0){
                            const alldemage = sat1.increase_demage_point;
                            if(ene1.bool){
                                ene1.hp -= alldemage * (sat1.str + sat1. mag);
                            }
                            if(ene2.bool){
                                ene2.hp -= alldemage * (sat1.str + sat1. mag);
                            }
                            if(ene3.bool){
                                ene3.hp -= alldemage * (sat1.str + sat1. mag);
                            }
                        }
                        if(sat2.weapon_name == 'rune_of_the_forgotten' && sat2.wp > 0){
                            const alldemage = sat2.increase_demage_point;
                            if(ene1.bool){
                                ene1.hp -= alldemage * (sat2.str + sat2. mag);
                            }
                            if(ene2.bool){
                                ene2.hp -= alldemage * (sat2.str + sat2. mag);
                            }
                            if(ene3.bool){
                                ene3.hp -= alldemage * (sat2.str + sat2. mag);
                            }
                        }
                        if(sat3.weapon_name == 'rune_of_the_forgotten' && sat3.wp > 0){
                            const alldemage = sat3.increase_demage_point;
                            if(ene1.bool){
                                ene1.hp -= alldemage * (sat3.str + sat3. mag);
                            }
                            if(ene2.bool){
                                ene2.hp -= alldemage * (sat3.str + sat3. mag);
                            }
                            if(ene3.bool){
                                ene3.hp -= alldemage * (sat3.str + sat3. mag);
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'rune_of_the_forgotten' && ene1.wp > 0){
                            const alldemage = ene1.increase_demage_point;
                            if(sat1.bool){
                                sat1.hp -= alldemage * (ene1.str + ene1. mag);
                            }
                            if(sat2.bool){
                                sat2.hp -= alldemage * (ene1.str + ene1. mag);
                            }
                            if(sat3.bool){
                                sat3.hp -= alldemage * (ene1.str + ene1. mag);
                            }
                        }
                        if(ene2.weapon_name == 'rune_of_the_forgotten' && ene2.wp > 0){
                            const alldemage = ene2.increase_demage_point;
                            if(sat1.bool){
                                sat1.hp -= alldemage * (ene2.str + ene2. mag);
                            }
                            if(sat2.bool){
                                sat2.hp -= alldemage * (ene2.str + ene2. mag);
                            }
                            if(sat3.bool){
                                sat3.hp -= alldemage * (ene2.str + ene2. mag);
                            }
                        }
                        if(ene3.weapon_name == 'rune_of_the_forgotten' && ene3.wp > 0){
                            const alldemage = ene3.increase_demage_point;
                            if(sat1.bool){
                                sat1.hp -= alldemage * (ene3.str + ene3. mag);
                            }
                            if(sat2.bool){
                                sat2.hp -= alldemage * (ene3.str + ene3. mag);
                            }
                            if(sat3.bool){
                                sat3.hp -= alldemage * (ene3.str + ene3. mag);
                            }
                        }
                    }
                }
            }catch(error){console.log(`rune_of_the_forgotten: ${error}`);}

            try{
                if(entity.weapon_name == 'crune_of_celebration'){
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'crune_of_celebration' && sat1.wp > 0){
                            const healing = sat1.increase_hp_point;
                            sat1.hp += healing * sat1.hp;

                            if(sat2.bool){
                                sat2.hp += healing * sat1.hp;
                            }
                            if(sat3.bool){
                                sat3.hp += healing * sat1.hp;
                            }
                        }
                        if(sat2.weapon_name == 'crune_of_celebration' && sat2.wp > 0){
                            const healing = sat2.increase_hp_point;
                            sat2.hp += healing * sat2.hp;

                            if(sat1.bool){
                                sat1.hp += healing * sat2.hp;
                            }
                            if(sat3.bool){
                                sat3.hp += healing * sat2.hp;
                            }
                        }
                        if(sat3.weapon_name == 'crune_of_celebration' && sat3.wp > 0){
                            const healing = sat3.increase_hp_point;
                            sat3.hp += healing * sat3.hp;

                            if(sat1.bool){
                                sat1.hp += healing * sat3.hp;
                            }
                            if(sat2.bool){
                                sat2.hp += healing * sat3.hp;
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'crune_of_celebration' && ene1.wp > 0){
                            const healing = ene1.increase_hp_point;
                            ene1.hp += healing * ene1.hp;

                            if(ene2.bool){
                                ene2.hp += healing * ene1.hp;
                            }
                            if(ene3.bool){
                                ene3.hp += healing * ene1.hp;
                            }
                        }
                        if(ene2.weapon_name == 'crune_of_celebration' && ene2.wp > 0){
                            const healing = ene2.increase_hp_point;
                            ene2.hp += healing * ene2.hp;

                            if(ene1.bool){
                                ene1.hp += healing * ene2.hp;
                            }
                            if(ene3.bool){
                                ene3.hp += healing * ene2.hp;
                            }
                        }
                        if(ene3.weapon_name == 'crune_of_celebration' && ene3.wp > 0){
                            const healing = ene3.increase_hp_point;
                            ene3.hp += healing * ene3.hp;

                            if(ene1.bool){
                                ene1.hp += healing * ene3.hp;
                            }
                            if(ene2.bool){
                                ene2.hp += healing * ene3.hp;
                            }
                        }
                    }
                }
            }catch(error){console.log(`crune_of_celebration: ${error}`);}

            try{
                if(entity.weapon_name == 'culling_scythe'){
                    if(sat1.culling_bool && sat1.culling_round > 0){
                        sat1.culling_round -= 1;
                        if(sat1.culling_round <= 0){
                            sat1.increase_hp_point += sat1.culling_point;
                            sat1.culling_bool = false;
                        }
                    }

                    if(sat2.culling_bool && sat2.culling_round > 0){
                        sat2.culling_round -= 1;
                        if(sat2.culling_round <= 0){
                            sat2.increase_hp_point += sat2.culling_point;
                            sat2.culling_bool = false;
                        }
                    }

                    if(sat3.culling_bool && sat3.culling_round > 0){
                        sat3.culling_round -= 1;
                        if(sat3.culling_round <= 0){
                            sat3.increase_hp_point += sat3.culling_point;
                            sat3.culling_bool = false;
                        }
                    }

                    if(ene1.culling_bool && ene1.culling_round > 0){
                        ene1.culling_round -= 1;
                        if(ene1.culling_round <= 0){
                            ene1.increase_hp_point += ene1.culling_point;
                            ene1.culling_bool = false;
                        }
                    }

                    if(ene2.culling_bool && ene2.culling_round > 0){
                        ene2.culling_round -= 1;
                        if(ene2.culling_round <= 0){
                            ene2.increase_hp_point += ene2.culling_point;
                            ene2.culling_bool = false;
                        }
                    }

                    if(ene3.culling_bool && ene3.culling_round > 0){
                        ene3.culling_round -= 1;
                        if(ene3.culling_round <= 0){
                            ene3.increase_hp_point += ene3.culling_point;
                            ene3.culling_bool = false;
                        }
                    }

                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'culling_scythe' && sat1.wp > 0){
                            const take_wp = getRandomInt(100, 201);
                            sat1.wp -= take_wp;
                            if(ene1.bool){
                                if(ene1.increase_hp_point > 1){
                                    ene1.culling_point = parseInt((ene1.increase_hp_point) - (ene1.increase_hp_point * sat1.culling_point));
                                    ene1.increase_hp_point = parseInt((ene1.increase_hp_point) - (ene1.culling_point));
                                    ene1.hp -= resistance(parseInt(( sat1.str ) - (sat1.str * sat1.culling_point)), ene1.pr, ene1.main_hp)
                                    ene1.culling_bool = true;
                                    ene1.culling_round += 2;
                                }
                                if(ene1.increase_hp_point < 1){
                                    ene1.increase_hp_point = 1;
                                }
                            }
                            if(ene2.bool){
                                if(ene2.increase_hp_point > 1){
                                    ene2.culling_point = parseInt((ene2.increase_hp_point) - (ene2.increase_hp_point * sat1.culling_point));
                                    ene2.increase_hp_point = parseInt((ene2.increase_hp_point) - (ene2.culling_point));
                                    ene2.hp -= resistance(parseInt(( sat1.str ) - (sat1.str * sat1.culling_point)), ene2.pr, ene2.main_hp)
                                    ene2.culling_bool = true;
                                    ene2.culling_round += 2;
                                }
                                if(ene2.increase_hp_point < 1){
                                    ene2.increase_hp_point = 1;
                                }
                            }
                            if(ene3.bool){
                                if(ene3.increase_hp_point > 1){
                                    ene3.culling_point = parseInt((ene3.increase_hp_point) - (ene3.increase_hp_point * sat1.culling_point));
                                    ene3.increase_hp_point = parseInt((ene3.increase_hp_point) - (ene3.culling_point));
                                    ene3.hp -= resistance(parseInt(( sat1.str ) - (sat1.str * sat1.culling_point)), ene3.pr, ene3.main_hp)
                                    ene3.culling_bool = true;
                                    ene3.culling_round += 2;
                                }
                                if(ene3.increase_hp_point < 1){
                                    ene3.increase_hp_point = 1;
                                }
                            }
                        }
                        if(sat2.weapon_name == 'culling_scythe' && sat2.wp > 0){
                            const take_wp = getRandomInt(100, 201);
                            sat2.wp -= take_wp;
                            if(ene1.bool){
                                if(ene1.increase_hp_point > 1){
                                    ene1.culling_point = parseInt((ene1.increase_hp_point) - (ene1.increase_hp_point * sat2.culling_point));
                                    ene1.increase_hp_point = parseInt((ene1.increase_hp_point) - (ene1.culling_point));
                                    ene1.hp -= resistance(parseInt(( sat2.str ) - (sat2.str * sat2.culling_point)), ene1.pr, ene1.main_hp)
                                    ene1.culling_bool = true;
                                    ene1.culling_round += 2;
                                }
                                if(ene1.increase_hp_point < 1){
                                    ene1.increase_hp_point = 1;
                                }
                            }
                            if(ene2.bool){
                                if(ene2.increase_hp_point > 1){
                                    ene2.culling_point = parseInt((ene2.increase_hp_point) - (ene2.increase_hp_point * sat2.culling_point));
                                    ene2.increase_hp_point = parseInt((ene2.increase_hp_point) - (ene2.culling_point));
                                    ene2.hp -= resistance(parseInt(( sat2.str ) - (sat2.str * sat2.culling_point)), ene2.pr, ene2.main_hp)
                                    ene2.culling_bool = true;
                                    ene2.culling_round += 2;
                                }
                                if(ene2.increase_hp_point < 1){
                                    ene2.increase_hp_point = 1;
                                }
                            }
                            if(ene3.bool){
                                if(ene3.increase_hp_point > 1){
                                    ene3.culling_point = parseInt((ene3.increase_hp_point) - (ene3.increase_hp_point * sat2.culling_point));
                                    ene3.increase_hp_point = parseInt((ene3.increase_hp_point) - (ene3.culling_point));
                                    ene3.hp -= resistance(parseInt(( sat2.str ) - (sat2.str * sat2.culling_point)), ene3.pr, ene3.main_hp)
                                    ene3.culling_bool = true;
                                    ene3.culling_round += 2;
                                }
                                if(ene3.increase_hp_point < 1){
                                    ene3.increase_hp_point = 1;
                                }
                            }
                        }
                        if(sat3.weapon_name == 'culling_scythe' && sat3.wp > 0){
                            const take_wp = getRandomInt(100, 201);
                            sat3.wp -= take_wp;
                            if(ene1.bool){
                                if(ene1.increase_hp_point > 1){
                                    ene1.culling_point = parseInt((ene1.increase_hp_point) - (ene1.increase_hp_point * sat3.culling_point));
                                    ene1.increase_hp_point = parseInt((ene1.increase_hp_point) - (ene1.culling_point));
                                    ene1.hp -= resistance(parseInt(( sat3.str ) - (sat3.str * sat3.culling_point)), ene1.pr, ene1.main_hp)
                                    ene1.culling_bool = true;
                                    ene1.culling_round += 2;
                                }
                                if(ene1.increase_hp_point < 1){
                                    ene1.increase_hp_point = 1;
                                }
                            }
                            if(ene2.bool){
                                if(ene2.increase_hp_point > 1){
                                    ene2.culling_point = parseInt((ene2.increase_hp_point) - (ene2.increase_hp_point * sat3.culling_point));
                                    ene2.increase_hp_point = parseInt((ene2.increase_hp_point) - (ene2.culling_point));
                                    ene2.hp -= resistance(parseInt(( sat3.str ) - (sat3.str * sat3.culling_point)), ene2.pr, ene2.main_hp)
                                    ene2.culling_bool = true;
                                    ene2.culling_round += 2;
                                }
                                if(ene2.increase_hp_point < 1){
                                    ene2.increase_hp_point = 1;
                                }
                            }
                            if(ene3.bool){
                                if(ene3.increase_hp_point > 1){
                                    ene3.culling_point = parseInt((ene3.increase_hp_point) - (ene3.increase_hp_point * sat3.culling_point));
                                    ene3.increase_hp_point = parseInt((ene3.increase_hp_point) - (ene3.culling_point));
                                    ene3.hp -= resistance(parseInt(( sat3.str ) - (sat3.str * sat3.culling_point)), ene3.pr, ene3.main_hp)
                                    ene3.culling_bool = true;
                                    ene3.culling_round += 2;
                                }
                                if(ene3.increase_hp_point < 1){
                                    ene3.increase_hp_point = 1;
                                }
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'culling_scythe' && ene1.wp > 0){
                            const take_wp = getRandomInt(100, 201);
                            ene1.wp -= take_wp;
                            if(sat1.bool){
                                if(sat1.increase_hp_point > 1){
                                    sat1.culling_point = parseInt((sat1.increase_hp_point) - (sat1.increase_hp_point * ene1.culling_point));
                                    sat1.increase_hp_point = parseInt((sat1.increase_hp_point) - (sat1.culling_point));
                                    sat1.hp -= resistance(parseInt(( ene1.str ) - (ene1.str * ene1.culling_point)), sat1.pr, sat1.main_hp)
                                    sat1.culling_bool = true;
                                    sat1.culling_round += 2;
                                }
                                if(sat1.increase_hp_point < 1){
                                    sat1.increase_hp_point = 1;
                                }
                            }
                            if(sat2.bool){
                                if(sat2.increase_hp_point > 1){
                                    sat2.culling_point = parseInt((sat2.increase_hp_point) - (sat2.increase_hp_point * ene1.culling_point));
                                    sat2.increase_hp_point = parseInt((sat2.increase_hp_point) - (sat2.culling_point));
                                    sat2.hp -= resistance(parseInt(( ene1.str ) - (ene1.str * ene1.culling_point)), sat2.pr, sat2.main_hp)
                                    sat2.culling_bool = true;
                                    sat2.culling_round += 2;
                                }
                                if(sat2.increase_hp_point < 1){
                                    sat2.increase_hp_point = 1;
                                }
                            }
                            if(sat3.bool){
                                if(sat3.increase_hp_point > 1){
                                    sat3.culling_point = parseInt((sat3.increase_hp_point) - (sat3.increase_hp_point * ene1.culling_point));
                                    sat3.increase_hp_point = parseInt((sat3.increase_hp_point) - (sat3.culling_point));
                                    sat3.hp -= resistance(parseInt(( ene1.str ) - (ene1.str * ene1.culling_point)), sat3.pr, sat3.main_hp)
                                    sat3.culling_bool = true;
                                    sat3.culling_round += 2;
                                }
                                if(sat3.increase_hp_point < 1){
                                    sat3.increase_hp_point = 1;
                                }
                            }
                        }
                        if(ene2.weapon_name == 'culling_scythe' && ene2.wp > 0){
                            const take_wp = getRandomInt(100, 201);
                            ene2.wp -= take_wp;
                            if(sat1.bool){
                                if(sat1.increase_hp_point > 1){
                                    sat1.culling_point = parseInt((sat1.increase_hp_point) - (sat1.increase_hp_point * ene2.culling_point));
                                    sat1.increase_hp_point = parseInt((sat1.increase_hp_point) - (sat1.culling_point));
                                    sat1.hp -= resistance(parseInt(( ene2.str ) - (ene2.str * ene2.culling_point)), sat1.pr, sat1.main_hp)
                                    sat1.culling_bool = true;
                                    sat1.culling_round += 2;
                                }
                                if(sat1.increase_hp_point < 1){
                                    sat1.increase_hp_point = 1;
                                }
                            }
                            if(sat2.bool){
                                if(sat2.increase_hp_point > 1){
                                    sat2.culling_point = parseInt((sat2.increase_hp_point) - (sat2.increase_hp_point * ene2.culling_point));
                                    sat2.increase_hp_point = parseInt((sat2.increase_hp_point) - (sat2.culling_point));
                                    sat2.hp -= resistance(parseInt(( ene2.str ) - (ene2.str * ene2.culling_point)), sat2.pr, sat2.main_hp)
                                    sat2.culling_bool = true;
                                    sat2.culling_round += 2;
                                }
                                if(sat2.increase_hp_point < 1){
                                    sat2.increase_hp_point = 1;
                                }
                            }
                            if(sat3.bool){
                                if(sat3.increase_hp_point > 1){
                                    sat3.culling_point = parseInt((sat3.increase_hp_point) - (sat3.increase_hp_point * ene2.culling_point));
                                    sat3.increase_hp_point = parseInt((sat3.increase_hp_point) - (sat3.culling_point));
                                    sat3.hp -= resistance(parseInt(( ene2.str ) - (ene2.str * ene2.culling_point)), sat3.pr, sat3.main_hp)
                                    sat3.culling_bool = true;
                                    sat3.culling_round += 2;
                                }
                                if(sat3.increase_hp_point < 1){
                                    sat3.increase_hp_point = 1;
                                }
                            }
                        }
                        if(ene3.weapon_name == 'culling_scythe' && ene3.wp > 0){
                            const take_wp = getRandomInt(100, 201);
                            ene3.wp -= take_wp;
                            if(sat1.bool){
                                if(sat1.increase_hp_point > 1){
                                    sat1.culling_point = parseInt((sat1.increase_hp_point) - (sat1.increase_hp_point * ene3.culling_point));
                                    sat1.increase_hp_point = parseInt((sat1.increase_hp_point) - (sat1.culling_point));
                                    sat1.hp -= resistance(parseInt(( ene3.str ) - (ene3.str * ene3.culling_point)), sat1.pr, sat1.main_hp)
                                    sat1.culling_bool = true;
                                    sat1.culling_round += 2;
                                }
                                if(sat1.increase_hp_point < 1){
                                    sat1.increase_hp_point = 1;
                                }
                            }
                            if(sat2.bool){
                                if(sat2.increase_hp_point > 1){
                                    sat2.culling_point = parseInt((sat2.increase_hp_point) - (sat2.increase_hp_point * ene3.culling_point));
                                    sat2.increase_hp_point = parseInt((sat2.increase_hp_point) - (sat2.culling_point));
                                    sat2.hp -= resistance(parseInt(( ene3.str ) - (ene3.str * ene3.culling_point)), sat2.pr, sat2.main_hp)
                                    sat2.culling_bool = true;
                                    sat2.culling_round += 2;
                                }
                                if(sat2.increase_hp_point < 1){
                                    sat2.increase_hp_point = 1;
                                }
                            }
                            if(sat3.bool){
                                if(sat3.increase_hp_point > 1){
                                    sat3.culling_point = parseInt((sat3.increase_hp_point) - (sat3.increase_hp_point * ene3.culling_point));
                                    sat3.increase_hp_point = parseInt((sat3.increase_hp_point) - (sat3.culling_point));
                                    sat3.hp -= resistance(parseInt(( ene3.str ) - (ene3.str * ene3.culling_point)), sat3.pr, sat3.main_hp)
                                    sat3.culling_bool = true;
                                    sat3.culling_round += 2;
                                }
                                if(sat3.increase_hp_point < 1){
                                    sat3.increase_hp_point = 1;
                                }
                            }
                        }
                    }
                }
            }catch(error){console.log(`culling_scythe: ${error}`);}

            try{
                if(entity.weapon_name == 'wang_of_absorption'){
                    const take_wp = getRandomInt(150, 251);
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'wang_of_absorption' && sat1.wp > 0){
                            const mag = parseInt(sat1.mag*sat1.mag_point);
                            sat1.wp -= take_wp;
                            const ene_ran = getRandomInt(1, 4);
                            if(ene_ran == 1 && ene1.hp > 0){
                                ene1.hp -= resistance(mag, ene1.mr, ene1.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat2.hp > 0){
                                    if(ene1.wp > 0){
                                        ene1.wp -= parseInt(mag);
                                        sat2.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat3.hp > 0){
                                    if(ene1.wp > 0){
                                        ene1.wp -= parseInt(mag);
                                        sat3.wp += parseInt(mag);
                                    }
                                }
                            }else if(ene_ran == 2 && ene2.hp > 0){
                                ene2.hp -= resistance(mag, ene2.mr, ene2.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat2.hp > 0){
                                    if(ene2.wp > 0){
                                        ene2.wp -= parseInt(mag);
                                        sat2.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat3.hp > 0){
                                    if(ene2.wp > 0){
                                        ene2.wp -= parseInt(mag);
                                        sat3.wp += parseInt(mag);
                                    }
                                }
                            }else if(ene_ran == 3 && ene3.hp > 0){
                                ene3.hp -= resistance(mag, ene3.mr, ene3.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat2.hp > 0){
                                    if(ene3.wp > 0){
                                        ene3.wp -= parseInt(mag);
                                        sat2.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat3.hp > 0){
                                    if(ene3.wp > 0){
                                        ene3.wp -= parseInt(mag);
                                        sat3.wp += parseInt(mag);
                                    }
                                }
                            }
                        }
                        if(sat2.weapon_name == 'wang_of_absorption' && sat2.wp > 0){
                            const mag = parseInt(sat2.mag*sat2.mag_point);
                            sat2.wp -= take_wp;
                            const ene_ran = getRandomInt(1, 4);
                            if(ene_ran == 1 && ene1.hp > 0){
                                ene1.hp -= resistance(mag, ene1.mr, ene1.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat1.hp > 0){
                                    if(ene1.wp > 0){
                                        ene1.wp -= parseInt(mag);
                                        sat1.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat3.hp > 0){
                                    if(ene1.wp > 0){
                                        ene1.wp -= parseInt(mag);
                                        sat3.wp += parseInt(mag);
                                    }
                                }
                            }else if(ene_ran == 2 && ene2.hp > 0){
                                ene2.hp -= resistance(mag, ene2.mr, ene2.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat1.hp > 0){
                                    if(ene2.wp > 0){
                                        ene2.wp -= parseInt(mag);
                                        sat1.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat3.hp > 0){
                                    if(ene2.wp > 0){
                                        ene2.wp -= parseInt(mag);
                                        sat3.wp += parseInt(mag);
                                    }
                                }
                            }else if(ene_ran == 3 && ene3.hp > 0){
                                ene3.hp -= resistance(mag, ene3.mr, ene3.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat1.hp > 0){
                                    if(ene3.wp > 0){
                                        ene3.wp -= parseInt(mag);
                                        sat1.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat3.hp > 0){
                                    if(ene3.wp > 0){
                                        ene3.wp -= parseInt(mag);
                                        sat3.wp += parseInt(mag);
                                    }
                                }
                            }
                        }
                        if(sat3.weapon_name == 'wang_of_absorption' && sat3.wp > 0){
                            const mag = parseInt(sat3.mag*sat3.mag_point);
                            sat3.wp -= take_wp;
                            const ene_ran = getRandomInt(1, 4);
                            if(ene_ran == 1 && ene1.hp > 0){
                                ene1.hp -= resistance(mag, ene1.mr, ene1.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat2.hp > 0){
                                    if(ene1.wp > 0){
                                        ene1.wp -= parseInt(mag);
                                        sat2.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat1.hp > 0){
                                    if(ene1.wp > 0){
                                        ene1.wp -= parseInt(mag);
                                        sat1.wp += parseInt(mag);
                                    }
                                }
                            }else if(ene_ran == 2 && ene2.hp > 0){
                                ene2.hp -= resistance(mag, ene2.mr, ene2.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat2.hp > 0){
                                    if(ene2.wp > 0){
                                        ene2.wp -= parseInt(mag);
                                        sat2.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat1.hp > 0){
                                    if(ene2.wp > 0){
                                        ene2.wp -= parseInt(mag);
                                        sat1.wp += parseInt(mag);
                                    }
                                }
                            }else if(ene_ran == 3 && ene3.hp > 0){
                                ene3.hp -= resistance(mag, ene3.mr, ene3.main_hp);
                                const sat_ran = getRandomInt(1, 3);
                                if(sat_ran == 1 && sat2.hp > 0){
                                    if(ene3.wp > 0){
                                        ene3.wp -= parseInt(mag);
                                        sat2.wp += parseInt(mag);
                                    }
                                }else if(sat_ran == 1 && sat1.hp > 0){
                                    if(ene3.wp > 0){
                                        ene3.wp -= parseInt(mag);
                                        sat1.wp += parseInt(mag);
                                    }
                                }
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'wang_of_absorption' && ene1.wp > 0){
                            const mag = parseInt(ene1.mag*ene1.mag_point);
                            ene1.wp -= take_wp;
                            const sat_ran = getRandomInt(1, 4);
                            if(sat_ran == 1 && sat1.hp > 0){
                                sat1.hp -= resistance(mag, sat1.mr, sat1.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene2.hp > 0){
                                    if(sat1.wp > 0){
                                        sat1.wp -= parseInt(mag);
                                        ene2.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene3.hp > 0){
                                    if(sat1.wp > 0){
                                        sat1.wp -= parseInt(mag);
                                        ene3.wp += parseInt(mag);
                                    }
                                }
                            }else if(sat_ran == 2 && sat2.hp > 0){
                                sat2.hp -= resistance(mag, sat2.mr, sat2.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene2.hp > 0){
                                    if(sat2.wp > 0){
                                        sat2.wp -= parseInt(mag);
                                        ene2.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene3.hp > 0){
                                    if(sat2.wp > 0){
                                        sat2.wp -= parseInt(mag);
                                        ene3.wp += parseInt(mag);
                                    }
                                }
                            }else if(sat_ran == 3 && sat3.hp > 0){
                                sat3.hp -= resistance(mag, sat3.mr, sat3.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene2.hp > 0){
                                    if(sat3.wp > 0){
                                        sat3.wp -= parseInt(mag);
                                        ene2.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene3.hp > 0){
                                    if(sat3.wp > 0){
                                        sat3.wp -= parseInt(mag);
                                        ene3.wp += parseInt(mag);
                                    }
                                }
                            }
                        }
                        if(ene2.weapon_name == 'wang_of_absorption' && ene2.wp > 0){
                            const mag = parseInt(ene2.mag*ene2.mag_point);
                            ene2.wp -= take_wp;
                            const sat_ran = getRandomInt(1, 4);
                            if(sat_ran == 1 && sat1.hp > 0){
                                sat1.hp -= resistance(mag, sat1.mr, sat1.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene1.hp > 0){
                                    if(sat1.wp > 0){
                                        sat1.wp -= parseInt(mag);
                                        ene1.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene3.hp > 0){
                                    if(sat1.wp > 0){
                                        sat1.wp -= parseInt(mag);
                                        ene3.wp += parseInt(mag);
                                    }
                                }
                            }else if(sat_ran == 2 && sat2.hp > 0){
                                sat2.hp -= resistance(mag, sat2.mr, sat2.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene1.hp > 0){
                                    if(sat2.wp > 0){
                                        sat2.wp -= parseInt(mag);
                                        ene1.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene3.hp > 0){
                                    if(sat2.wp > 0){
                                        sat2.wp -= parseInt(mag);
                                        ene3.wp += parseInt(mag);
                                    }
                                }
                            }else if(sat_ran == 3 && sat3.hp > 0){
                                sat3.hp -= resistance(mag, sat3.mr, sat3.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene1.hp > 0){
                                    if(sat3.wp > 0){
                                        sat3.wp -= parseInt(mag);
                                        ene1.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene3.hp > 0){
                                    if(sat3.wp > 0){
                                        sat3.wp -= parseInt(mag);
                                        ene3.wp += parseInt(mag);
                                    }
                                }
                            }
                        }
                        if(ene3.weapon_name == 'wang_of_absorption' && ene3.wp > 0){
                            const mag = parseInt(ene3.mag*ene3.mag_point);
                            ene3.wp -= take_wp;
                            const sat_ran = getRandomInt(1, 4);
                            if(sat_ran == 1 && sat1.hp > 0){
                                sat1.hp -= resistance(mag, sat1.mr, sat1.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene1.hp > 0){
                                    if(sat1.wp > 0){
                                        sat1.wp -= parseInt(mag);
                                        ene1.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene2.hp > 0){
                                    if(sat1.wp > 0){
                                        sat1.wp -= parseInt(mag);
                                        ene2.wp += parseInt(mag);
                                    }
                                }
                            }else if(sat_ran == 2 && sat2.hp > 0){
                                sat2.hp -= resistance(mag, sat2.mr, sat2.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene1.hp > 0){
                                    if(sat2.wp > 0){
                                        sat2.wp -= parseInt(mag);
                                        ene1.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene2.hp > 0){
                                    if(sat2.wp > 0){
                                        sat2.wp -= parseInt(mag);
                                        ene2.wp += parseInt(mag);
                                    }
                                }
                            }else if(sat_ran == 3 && sat3.hp > 0){
                                sat3.hp -= resistance(mag, sat3.mr, sat3.main_hp);
                                const ene_ran = getRandomInt(1, 3);
                                if(ene_ran == 1 && ene1.hp > 0){
                                    if(sat3.wp > 0){
                                        sat3.wp -= parseInt(mag);
                                        ene1.wp += parseInt(mag);
                                    }
                                }else if(ene_ran == 1 && ene2.hp > 0){
                                    if(sat3.wp > 0){
                                        sat3.wp -= parseInt(mag);
                                        ene2.wp += parseInt(mag);
                                    }
                                }
                            }
                        }
                    }
                }
            }catch(error){console.log(`wang_of_absorption: ${error}`);}

            try{
                if(entity.weapon_name == 'defender_aegis'){
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'defender_aegis' && sat1.wp > 0){
                            const take_wp = getRandomInt(150, 251);
                            sat1.wp -= take_wp;
                        }
                        if(sat2.weapon_name == 'defender_aegis' && sat2.wp > 0){
                            const take_wp = getRandomInt(150, 251);
                            sat2.wp -= take_wp;
                        }
                        if(sat3.weapon_name == 'defender_aegis' && sat3.wp > 0){
                            const take_wp = getRandomInt(150, 251);
                            sat3.wp -= take_wp;
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'defender_aegis' && ene1.wp > 0){
                            const take_wp = getRandomInt(150, 251);
                            ene1.wp -= take_wp;
                        }
                        if(ene2.weapon_name == 'defender_aegis' && ene2.wp > 0){
                            const take_wp = getRandomInt(150, 251);
                            ene2.wp -= take_wp;
                        }
                        if(ene3.weapon_name == 'defender_aegis' && ene3.wp > 0){
                            const take_wp = getRandomInt(150, 251);
                            ene3.wp -= take_wp;
                        }
                    }
                }
            }catch(error){console.log(`defender_aegis: ${error}`);}

            try{
                if(entity.weapon_name == 'energy_stuff'){
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'energy_stuff' && sat1.wp > 0){
                            const take_wp = getRandomInt(100, 100);
                            sat1.wp -= take_wp;
                            const demage_all = parseInt((sat1.mag*sat1.mag_point) + (sat1.mag));
                            if(ene1.hp > 0 && ene1.bool){
                                ene1.hp -= resistance(demage_all, ene1.mr, ene1.main_hp);
                            }
                            if(ene2.hp > 0 && ene2.bool){
                                ene2.hp -= resistance(demage_all, ene2.mr, ene2.main_hp);
                            }
                            if(ene3.hp > 0 && ene3.bool){
                                ene3.hp -= resistance(demage_all, ene3.mr, ene3.main_hp);
                            }
                        }
                        if(sat2.weapon_name == 'energy_stuff' && sat2.wp > 0){
                            const take_wp = getRandomInt(100, 100);
                            sat2.wp -= take_wp;
                            const demage_all = parseInt((sat2.mag*sat2.mag_point) + (sat2.mag));
                            if(ene1.hp > 0 && ene1.bool){
                                ene1.hp -= resistance(demage_all, ene1.mr, ene1.main_hp);
                            }
                            if(ene2.hp > 0 && ene2.bool){
                                ene2.hp -= resistance(demage_all, ene2.mr, ene2.main_hp);
                            }
                            if(ene3.hp > 0 && ene3.bool){
                                ene3.hp -= resistance(demage_all, ene3.mr, ene3.main_hp);
                            }
                        }
                        if(sat3.weapon_name == 'energy_stuff' && sat3.wp > 0){
                            const take_wp = getRandomInt(100, 100);
                            sat3.wp -= take_wp;
                            const demage_all = parseInt((sat3.mag*sat3.mag_point) + (sat3.mag));
                            if(ene1.hp > 0 && ene1.bool){
                                ene1.hp -= resistance(demage_all, ene1.mr, ene1.main_hp);
                            }
                            if(ene2.hp > 0 && ene2.bool){
                                ene2.hp -= resistance(demage_all, ene2.mr, ene2.main_hp);
                            }
                            if(ene3.hp > 0 && ene3.bool){
                                ene3.hp -= resistance(demage_all, ene3.mr, ene3.main_hp);
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'energy_stuff' && ene1.wp > 0){
                            const take_wp = getRandomInt(100, 100);
                            ene1.wp -= take_wp;
                            const demage_all = parseInt((ene1.mag*ene1.mag_point) + (ene1.mag));
                            if(sat1.hp > 0 && sat1.bool){
                                sat1.hp -= resistance(demage_all, sat1.mr, sat1.main_hp);
                            }
                            if(sat2.hp > 0 && sat2.bool){
                                sat2.hp -= resistance(demage_all, sat2.mr, sat2.main_hp);
                            }
                            if(sat3.hp > 0 && sat3.bool){
                                sat3.hp -= resistance(demage_all, sat3.mr, sat3.main_hp);
                            }
                        }
                        if(ene2.weapon_name == 'energy_stuff' && ene2.wp > 0){
                            const take_wp = getRandomInt(100, 100);
                            ene2.wp -= take_wp;
                            const demage_all = parseInt((ene2.mag*ene2.mag_point) + (ene2.mag));
                            if(sat1.hp > 0 && sat1.bool){
                                sat1.hp -= resistance(demage_all, sat1.mr, sat1.main_hp);
                            }
                            if(sat2.hp > 0 && sat2.bool){
                                sat2.hp -= resistance(demage_all, sat2.mr, sat2.main_hp);
                            }
                            if(sat3.hp > 0 && sat3.bool){
                                sat3.hp -= resistance(demage_all, sat3.mr, sat3.main_hp);
                            }
                        }
                        if(ene3.weapon_name == 'energy_stuff' && ene3.wp > 0){
                            const take_wp = getRandomInt(100, 100);
                            ene3.wp -= take_wp;
                            const demage_all = parseInt((ene3.mag*ene3.mag_point) + (ene3.mag));
                            if(sat1.hp > 0 && sat1.bool){
                                sat1.hp -= resistance(demage_all, sat1.mr, sat1.main_hp);
                            }
                            if(sat2.hp > 0 && sat2.bool){
                                sat2.hp -= resistance(demage_all, sat2.mr, sat2.main_hp);
                            }
                            if(sat3.hp > 0 && sat3.bool){
                                sat3.hp -= resistance(demage_all, sat3.mr, sat3.main_hp);
                            }
                        }
                    }
                }
            }catch(error){console.log(`energy_stuff: ${error}`);}

            try{
                if(entity.weapon_name == 'orb_of_potency'){
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'orb_of_potency' && sat1.wp > 0){
                            const take_wp = getRandomInt(50, 101);
                            sat1.wp -= take_wp;
                        }
                        if(sat2.weapon_name == 'orb_of_potency' && sat2.wp > 0){
                            const take_wp = getRandomInt(50, 101);
                            sat2.wp -= take_wp;
                        }
                        if(sat3.weapon_name == 'orb_of_potency' && sat3.wp > 0){
                            const take_wp = getRandomInt(50, 101);
                            sat3.wp -= take_wp;
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'orb_of_potency' && ene1.wp > 0){
                            const take_wp = getRandomInt(50, 101);
                            ene1.wp -= take_wp;
                        }
                        if(ene2.weapon_name == 'orb_of_potency' && ene2.wp > 0){
                            const take_wp = getRandomInt(50, 101);
                            ene2.wp -= take_wp;
                        }
                        if(ene3.weapon_name == 'orb_of_potency' && ene3.wp > 0){
                            const take_wp = getRandomInt(50, 101);
                            ene3.wp -= take_wp;
                        }
                    }
                }
            }catch(error){console.log(`orb_of_potency: ${error}`);}

            try{
                if(entity.weapon_name == 'great_sword'){
                    const take_wp = getRandomInt(100, 201);
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'great_sword' && sat1.wp > 0){
                            sat1.wp -= take_wp;
                            const demage_all = parseInt((sat1.str*sat1.demage_point) + (sat1.str));
                            if(ene1.hp > 0 && ene1.bool){
                                ene1.hp -= resistance(demage_all, ene1.pr, ene1.main_hp);
                            }
                            if(ene2.hp > 0 && ene2.bool){
                                ene2.hp -= resistance(demage_all, ene2.pr, ene2.main_hp);
                            }
                            if(ene3.hp > 0 && ene3.bool){
                                ene3.hp -= resistance(demage_all, ene3.pr, ene3.main_hp);
                            }
                        }
                        if(sat2.weapon_name == 'great_sword' && sat2.wp > 0){
                            sat2.wp -= take_wp;
                            const demage_all = parseInt((sat2.str*sat2.demage_point) + (sat2.str));
                            if(ene1.hp > 0 && ene1.bool){
                                ene1.hp -= resistance(demage_all, ene1.pr, ene1.main_hp);
                            }
                            if(ene2.hp > 0 && ene2.bool){
                                ene2.hp -= resistance(demage_all, ene2.pr, ene2.main_hp);
                            }
                            if(ene3.hp > 0 && ene3.bool){
                                ene3.hp -= resistance(demage_all, ene3.pr, ene3.main_hp);
                            }
                        }
                        if(sat3.weapon_name == 'great_sword' && sat3.wp > 0){
                            sat3.wp -= take_wp;
                            const demage_all = parseInt((sat3.str*sat3.demage_point) + (sat3.str));
                            if(ene1.hp > 0 && ene1.bool){
                                ene1.hp -= resistance(demage_all, ene1.pr, ene1.main_hp);
                            }
                            if(ene2.hp > 0 && ene2.bool){
                                ene2.hp -= resistance(demage_all, ene2.pr, ene2.main_hp);
                            }
                            if(ene3.hp > 0 && ene3.bool){
                                ene3.hp -= resistance(demage_all, ene3.pr, ene3.main_hp);
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        ene1.wp -= take_wp;
                        if(ene1.weapon_name == 'great_sword' && ene1.wp > 0){
                            const demage_all = parseInt((ene1.str*ene1.demage_point) + (ene1.str));
                            if(sat1.hp > 0 && sat1.bool){
                                sat1.hp -= resistance(demage_all, sat1.pr, sat1.main_hp);
                            }
                            if(sat2.hp > 0 && sat2.bool){
                                sat2.hp -= resistance(demage_all, sat2.pr, sat2.main_hp);
                            }
                            if(sat3.hp > 0 && sat3.bool){
                                sat3.hp -= resistance(demage_all, sat3.pr, sat3.main_hp);
                            }
                        }
                        if(ene2.weapon_name == 'great_sword' && ene2.wp > 0){
                            ene2.wp -= take_wp;
                            const demage_all = parseInt((ene2.str*ene2.demage_point) + (ene2.str));
                            if(sat1.hp > 0 && sat1.bool){
                                sat1.hp -= resistance(demage_all, sat1.pr, sat1.main_hp);
                            }
                            if(sat2.hp > 0 && sat2.bool){
                                sat2.hp -= resistance(demage_all, sat2.pr, sat2.main_hp);
                            }
                            if(sat3.hp > 0 && sat3.bool){
                                sat3.hp -= resistance(demage_all, sat3.pr, sat3.main_hp);
                            }
                        }
                        if(ene3.weapon_name == 'great_sword' && ene3.wp > 0){
                            ene3.wp -= take_wp;
                            const demage_all = parseInt((ene3.str*ene3.demage_point) + (ene3.str));
                            if(sat1.hp > 0 && sat1.bool){
                                sat1.hp -= resistance(demage_all, sat1.pr, sat1.main_hp);
                            }
                            if(sat2.hp > 0 && sat2.bool){
                                sat2.hp -= resistance(demage_all, sat2.pr, sat2.main_hp);
                            }
                            if(sat3.hp > 0 && sat3.bool){
                                sat3.hp -= resistance(demage_all, sat3.pr, sat3.main_hp);
                            }
                        }
                    }
                }
            }catch(error){console.log(`great_sword: ${error}`);}

            try{
                if(entity.weapon_name == 'bow'){
                    const take_wp = getRandomInt(120, 200);
                    if([sat1, sat2, sat3].includes(entity)){
                        if(sat1.weapon_name == 'bow' && sat1.wp > 0){
                            sat1.wp -= take_wp;
                            const demage = parseInt((sat1.str*sat1.demage_point) + (sat1.str * 3));
                            const ene_ran = getRandomInt(1, 4);
                            if(ene_ran == 1 && ene1.hp > 0){
                                ene1.hp -= resistance(demage, ene1.pr, ene1.main_hp);
                            }else if(ene_ran == 1 && ene2.hp > 0){
                                ene2.hp -= resistance(demage, ene2.pr, ene2.main_hp);
                            }else if(ene_ran == 1 && ene3.hp > 0){
                                ene3.hp -= resistance(demage, ene3.pr, ene3.main_hp);
                            }
                        }
                        if(sat2.weapon_name == 'bow' && sat2.wp > 0){
                            sat2.wp -= take_wp;
                            const demage = parseInt((sat2.str*sat2.demage_point) + (sat2.str * 3));
                            const ene_ran = getRandomInt(1, 4);
                            if(ene_ran == 1 && ene1.hp > 0){
                                ene1.hp -= resistance(demage, ene1.pr, ene1.main_hp);
                            }else if(ene_ran == 1 && ene2.hp > 0){
                                ene2.hp -= resistance(demage, ene2.pr, ene2.main_hp);
                            }else if(ene_ran == 1 && ene3.hp > 0){
                                ene3.hp -= resistance(demage, ene3.pr, ene3.main_hp);
                            }
                        }
                        if(sat3.weapon_name == 'bow' && sat3.wp > 0){
                            sat3.wp -= take_wp;
                            const demage = parseInt((sat3.str*sat3.demage_point) + (sat3.str * 3));
                            const ene_ran = getRandomInt(1, 4);
                            if(ene_ran == 1 && ene1.hp > 0){
                                ene1.hp -= resistance(demage, ene1.pr, ene1.main_hp);
                            }else if(ene_ran == 1 && ene2.hp > 0){
                                ene2.hp -= resistance(demage, ene2.pr, ene2.main_hp);
                            }else if(ene_ran == 1 && ene3.hp > 0){
                                ene3.hp -= resistance(demage, ene3.pr, ene3.main_hp);
                            }
                        }
                    }
                    if([ene1, ene2, ene3].includes(entity)){
                        if(ene1.weapon_name == 'bow' && ene1.wp > 0){
                            ene1.wp -= take_wp;
                            const demage = parseInt((ene1.str*ene1.demage_point) + (ene1.str * 3));
                            const sat_ran = getRandomInt(1, 4);
                            if(sat_ran == 1 && sat1.hp > 0){
                                sat1.hp -= resistance(demage, sat1.pr, sat1.main_hp);
                            }else if(sat_ran == 1 && sat2.hp > 0){
                                sat2.hp -= resistance(demage, sat2.pr, sat2.main_hp);
                            }else if(sat_ran == 1 && sat3.hp > 0){
                                sat3.hp -= resistance(demage, sat3.pr, sat3.main_hp);
                            }
                        }
                        if(ene2.weapon_name == 'bow' && ene2.wp > 0){
                            ene2.wp -= take_wp;
                            const demage = parseInt((ene2.str*ene2.demage_point) + (ene2.str * 3));
                            const sat_ran = getRandomInt(1, 4);
                            if(sat_ran == 1 && sat1.hp > 0){
                                sat1.hp -= resistance(demage, sat1.pr, sat1.main_hp);
                            }else if(sat_ran == 1 && sat2.hp > 0){
                                sat2.hp -= resistance(demage, sat2.pr, sat2.main_hp);
                            }else if(sat_ran == 1 && sat3.hp > 0){
                                sat3.hp -= resistance(demage, sat3.pr, sat3.main_hp);
                            }
                        }
                        if(ene3.weapon_name == 'bow' && ene3.wp > 0){
                            ene3.wp -= take_wp;
                            const demage = parseInt((ene3.str*ene3.demage_point) + (ene3.str * 3));
                            const sat_ran = getRandomInt(1, 4);
                            if(sat_ran == 1 && sat1.hp > 0){
                                sat1.hp -= resistance(demage, sat1.pr, sat1.main_hp);
                            }else if(sat_ran == 1 && sat2.hp > 0){
                                sat2.hp -= resistance(demage, sat2.pr, sat2.main_hp);
                            }else if(sat_ran == 1 && sat3.hp > 0){
                                sat3.hp -= resistance(demage, sat3.pr, sat3.main_hp);
                            }
                        }
                    }
                }
            }catch(error){console.log(`bow: ${error}`);}
        }
    });
}

function battleWithWeapon(sat, weapon_name, passive_name, passive_two_name){
    if(weapon_name == 'rune_of_the_forgotten' && sat.wp > 0){
        const take_wp = getRandomInt(10, 50);
        sat.wp -= take_wp;
    }else if(weapon_name == 'crune_of_celebration' && sat.wp > 0){
        const take_wp = getRandomInt(10, 50);
        sat.wp -= take_wp;
    }

    if((passive_name == 'lifesteal_effect' || passive_two_name == 'lifesteal_effect') && sat.wp > 0){
        const lifesteal_percen = (getRandomInt(15, 36)/100);
        const lifesteal_str = parseInt(sat.str*lifesteal_percen);
        const lifesteal_mag = parseInt(sat.mag*lifesteal_percen);
        sat.hp += (lifesteal_str+lifesteal_mag);
    }else if((passive_name == 'regeneration_effect' || passive_two_name == 'regeneration_effect') && sat.wp > 0){
        const generation_percen = (getRandomInt(5, 11)/100);
        const generattion_hp = parseInt(sat.main_hp*generation_percen);
        sat.hp += generattion_hp;
    }

    return sat;
}

function getRankGif(rank){
    if(rank == 'common'){
        rank_gif = gif.animal_rank_1;
    }else if(rank == 'uncommon'){
        rank_gif = gif.animal_rank_2;
    }else if(rank == 'rare'){
        rank_gif = gif.animal_rank_3;
    }else if(rank == 'epic'){
        rank_gif = gif.animal_rank_4;
    }else if(rank == 'mythical'){
        rank_gif = gif.animal_rank_5;
    }else if(rank == 'legendary'){
        rank_gif = gif.animal_rank_6;
    }else if(rank == 'febled'){
        rank_gif = gif.animal_rank_8;
    }
    return rank_gif;
}

function splitMessage(message) {
    const maxChunkLength = 2000;
    const chunks = [];
    let currentChunk = '';
    const lines = message.split('\n');
    for (const line of lines) {
        if (currentChunk.length + line.length > maxChunkLength) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        if (line.length > maxChunkLength) {
            const lineChunks = splitLine(line, maxChunkLength);
            for (const chunk of lineChunks) {
                chunks.push(chunk);
            }
        } else {
            currentChunk += line + '\n';
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}
function splitLine(line, maxLength) {
    const chunks = [];
    let currentChunk = '';

    for (const char of line) {
        if (currentChunk.length + char.length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        currentChunk += char;
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    return chunks;
}

async function longMessage(longMessage, message){
    const chunks = splitMessage(longMessage);

    for (const chunk of chunks) {
        await message.channel.send(chunk);
    }
}

async function survival(userData, option){

    const width = 720;
    const height = 400;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const currentTime = new Date();

    if(userData.sa.event.revive_date < currentTime && userData.sa.event.revive_date){
        userData.sa.event.revive_date = '';
        userData.sa.GUI.Heart = 5;
        option.dead = false;
    }

    try{
        if(option.camfire_theme == true){//////////////////////////////////////////////// CANFIRE

            if(userData.sa.GUI.Heart > 0){
                const sa_camfire = await loadImage(gif.sa_camfire);
                ctx.drawImage(sa_camfire, 0, 0, width, height);

                ctx.font = 'bold 30px Arial';///////////////////// USERNAME
                ctx.fillStyle = 'Black';
                ctx.textBaseline = 'middle';
                const text = `${userData.username}`;
                const textWidth = ctx.measureText(text).width;
                const x = 629 - (textWidth / 2);
                ctx.fillText(text, x, 360);

                const sa_mail = await loadImage(gif.mail);/// mail
                ctx.drawImage(sa_mail, 0, 0, width, height);

                const ban_talk_chance = getRandomInt(1, 6);/// ban_talk
                if(ban_talk_chance == 1){
                    const sa_mail = await loadImage(gif.ban_talk_long);
                    ctx.drawImage(sa_mail, 0, 0, width, height);
                }

                try{//////////////////////////////////////////////// health
                    const sa_pf = await loadImage(gif.pf);
                    ctx.drawImage(sa_pf, 10, 10, 70, 70);

                    let sa_heart;

                    if(userData.sa.GUI.Heart == 5){
                        sa_heart = await loadImage(gif.bar_5);

                    }else if(userData.sa.GUI.Heart == 4){
                        sa_heart = await loadImage(gif.bar_4);

                    }else if(userData.sa.GUI.Heart == 3){
                        sa_heart = await loadImage(gif.bar_3);

                    }else if(userData.sa.GUI.Heart == 2){
                        sa_heart = await loadImage(gif.bar_2);

                    }else if(userData.sa.GUI.Heart == 1){
                        sa_heart = await loadImage(gif.bar_1);

                    }else if(userData.sa.GUI.Heart <= 0){
                        sa_heart = await loadImage(gif.bar_0);
                    }

                    ctx.drawImage(sa_heart, 75, -35, 294, 163);
                }catch(error){ console.log(`error heart`); }

            }else{

                if(!userData.sa.event.revive_date){
                    const cooldownEnd = new Date(currentTime.getTime() + 300_000);
                    userData.sa.event.revive_date = cooldownEnd;

                    const sa_dead = await loadImage(gif.sa_dead);
                    ctx.drawImage(sa_dead, 0, 0, width, height);

                    try{ await userData.save(); }catch(error){}

                }else{
                    const timeUntilReset = userData.sa.event.revive_date - currentTime;
                    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);

                    const sa_dead = await loadImage(gif.sa_dead);
                    ctx.drawImage(sa_dead, 0, 0, width, height);

                    ctx.font = 'bold 60px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`${minutes}m ${seconds}s`, 250, 340);
                }
            }

        }else if(option.Storage_theme == true){////////////////////////////////////////// STORAGE
            const sa_camfire = await loadImage(gif.sa_storage);
            ctx.drawImage(sa_camfire, 0, 0, width, height);

            ////// chocolate_bar
            if(userData.sa.item.food.chocolate_bar > 0){
                const chocolate_bar = await loadImage(gif.chocolate_bar);
                ctx.drawImage(chocolate_bar, 167, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.food.chocolate_bar}`, 187, 67);
            }

            ////// rag
            if(userData.sa.item.resource.rag > 0){
                const rag = await loadImage(gif.rag);
                ctx.drawImage(rag, 217, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.resource.rag}`, 237, 67);
            }

            ////// stack
            if(userData.sa.item.resource.stack > 0){
                const stack = await loadImage(gif.stack);
                ctx.drawImage(stack, 267, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.resource.stack}`, 287, 67);
            }

            ////// flower
            if(userData.sa.item.resource.flower > 0){
                const flower = await loadImage(gif.flower);
                ctx.drawImage(flower, 317, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.resource.flower}`, 337, 67);
            }

            ////// log
            if(userData.sa.item.resource.log > 0){
                const log = await loadImage(gif.log);
                ctx.drawImage(log, 367, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.resource.log}`, 387, 67);
            }

            ////// flower soup
            if(userData.sa.item.food.flower_soup > 0){
                const flower_soup = await loadImage(gif.flower_soup);
                ctx.drawImage(flower_soup, 417, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.food.flower_soup}`, 437, 67);
            }

            ////// stone
            if(userData.sa.item.resource.stone > 0){
                const stone = await loadImage(gif.stone);
                ctx.drawImage(stone, 467, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.resource.stone}`, 487, 67);
            }

            ////// medical
            if(userData.sa.item.medical.bandage > 0){
                const bandage = await loadImage(gif.bandage);
                ctx.drawImage(bandage, 517, 47, 47, 47);

                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'Black';
                ctx.fillText(`${userData.sa.item.medical.bandage}`, 537, 67);
            }

            //////////////////////// weapom

            ////// knife
            if(userData.sa.item.melee.knife.knife_bool){
                const knife_item = await loadImage(gif.knife_item);
                ctx.drawImage(knife_item, 25, 120, 100, 100);
            }

            ////// spear
            if(userData.sa.item.melee.spear.spear_bool){
                const spear_item = await loadImage(gif.spear_item);
                ctx.drawImage(spear_item, 42, 50, 200, 200);
            }

            ////// axe
            if(userData.sa.item.melee.axe.axe_bool){
                const axe_item = await loadImage(gif.axe_item);
                ctx.drawImage(axe_item, 20, 190, 100, 100);
            }

        }else if(option.map_theme == true){////////////////////////////////////////////// MAP
            const sa_map = await loadImage(gif.sa_map);
            ctx.drawImage(sa_map, 0, 0, width, height);

        }else if(option.exploring == true){////////////////////////////////////////////// EXPLORING

            //////////////////////////////////////////////////////////////////////////////////// LANDING UNLOCK
            let exploring;
            if(option.landing == 'a'){
                exploring = await loadImage(gif.sa_forest_1);

            }else if(option.landing == 'b'){
                exploring = await loadImage(gif.sa_forest_2);

            }else if(option.landing == 'c'){
                exploring = await loadImage(gif.sa_forest_3);

            }else if(option.landing == 'd'){
                exploring = await loadImage(gif.sa_forest_4);

            }else if(option.landing == 'e'){
                exploring = await loadImage(gif.sa_forest_5);

            }else if(option.landing == 'f'){
                exploring = await loadImage(gif.sa_forest_5);
            }

            try{//////// EXPLORING
                ctx.drawImage(exploring, 0, 0, width, height);
            }catch(error){ console.log(`error exploring`); }
            //////////////////////////////////////////////////////////////////////////////////// LANDING UNLOCK




            ///////////////////////////////////////////////////////////////////////////////////// melee & weapom
            if(option.zombie_amount > 0){
                if(userData.sa.item.melee.knife.knife_bool){///////////////////////////////////// knife
                    userData.sa.item.melee.knife.knife_percen -= option.zombie_amount * 5;

                    if(option.zombie_amount > 3){
                        userData.sa.GUI.Heart -= 1;
                        try{//////// DEMAGE HEART
                            const sa_demage_heart = await loadImage(gif.demage_heart);
                            ctx.drawImage(sa_demage_heart, 0, 0, width, height);
                        }catch(error){ console.log(`error demage heart`); }

                    }else{
                        const luck_knife_ran = getRandomInt(1, 3);
                        if(luck_knife_ran == 1){
                            userData.sa.GUI.Heart -= 1;
                            try{//////// DEMAGE HEART
                                const sa_demage_heart = await loadImage(gif.demage_heart);
                                ctx.drawImage(sa_demage_heart, 0, 0, width, height);
                            }catch(error){ console.log(`error demage heart`); }
                        }
                    }

                    const resource_ran = getRandomInt(1, 3);
                    if(resource_ran == 1){
                        try{//////// RAG
                            const sa_rag = await loadImage(gif.rag);
                            ctx.drawImage(sa_rag, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${option.zombie_amount}`, 90, 130);

                            userData.sa.item.resource.rag += option.zombie_amount;

                        }catch(error){ console.log(`error RAG`); }

                    }else if(resource_ran == 2){
                        try{//////// STACK
                            const sa_stack = await loadImage(gif.stack);
                            ctx.drawImage(sa_stack, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${option.zombie_amount}`, 90, 130);

                            userData.sa.item.resource.stack += option.zombie_amount;

                        }catch(error){ console.log(`error STACK`); }
                    }

                    if(userData.sa.item.melee.knife.knife_percen <= 0){
                        userData.sa.item.melee.knife.knife_bool = false;
                        userData.sa.item.melee.knife.knife_percen = 0;
                    }

                    if(userData.sa.GUI.Heart <= 0){
                        option.dead = true;
                    }

                    option.zombie_amount = 0;

                }else if(userData.sa.item.melee.spear.spear_bool){/////////////////////////////// spear
                    userData.sa.item.melee.spear.spear_percen -= option.zombie_amount * 5;

                    if(option.zombie_amount > 1){
                        userData.sa.GUI.Heart -= 1;
                        try{//////// DEMAGE HEART
                            const sa_demage_heart = await loadImage(gif.demage_heart);
                            ctx.drawImage(sa_demage_heart, 0, 0, width, height);
                        }catch(error){ console.log(`error demage heart`); }

                    }else{
                        const luck_knife_ran = getRandomInt(1, 3);
                        if(luck_knife_ran == 1){
                            userData.sa.GUI.Heart -= 1;
                            try{//////// DEMAGE HEART
                                const sa_demage_heart = await loadImage(gif.demage_heart);
                                ctx.drawImage(sa_demage_heart, 0, 0, width, height);
                            }catch(error){ console.log(`error demage heart`); }
                        }
                    }

                    const resource_ran = getRandomInt(1, 3);
                    if(resource_ran == 1){
                        try{//////// RAG
                            const sa_rag = await loadImage(gif.rag);
                            ctx.drawImage(sa_rag, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${option.zombie_amount}`, 90, 130);

                            userData.sa.item.resource.rag += option.zombie_amount;

                        }catch(error){ console.log(`error RAG`); }

                    }else if(resource_ran == 2){
                        try{//////// STACK
                            const sa_stack = await loadImage(gif.stack);
                            ctx.drawImage(sa_stack, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${option.zombie_amount}`, 90, 130);

                            userData.sa.item.resource.stack += option.zombie_amount;

                        }catch(error){ console.log(`error STACK`); }
                    }

                    if(userData.sa.item.melee.spear.spear_percen <= 0){
                        userData.sa.item.melee.spear.spear_bool = false;
                        userData.sa.item.melee.spear.spear_percen = 0;
                    }

                    if(userData.sa.GUI.Heart <= 0){
                        option.dead = true;
                    }

                    option.zombie_amount = 0;

                }else if(userData.sa.item.melee.axe.axe_bool){//////////////////////////////////////axe
                    userData.sa.item.melee.axe.axe_percen -= option.zombie_amount * 5;

                    if(option.zombie_amount > 1){
                        userData.sa.GUI.Heart -= 1;
                        try{//////// DEMAGE HEART
                            const sa_demage_heart = await loadImage(gif.demage_heart);
                            ctx.drawImage(sa_demage_heart, 0, 0, width, height);
                        }catch(error){ console.log(`error demage heart`); }

                    }else{
                        const luck_knife_ran = getRandomInt(1, 3);
                        if(luck_knife_ran == 1){
                            userData.sa.GUI.Heart -= 1;
                            try{//////// DEMAGE HEART
                                const sa_demage_heart = await loadImage(gif.demage_heart);
                                ctx.drawImage(sa_demage_heart, 0, 0, width, height);
                            }catch(error){ console.log(`error demage heart`); }
                        }
                    }

                    const resource_ran = getRandomInt(1, 3);
                    if(resource_ran == 1){
                        try{//////// RAG
                            const sa_rag = await loadImage(gif.rag);
                            ctx.drawImage(sa_rag, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${option.zombie_amount}`, 90, 130);

                            userData.sa.item.resource.rag += option.zombie_amount;

                        }catch(error){ console.log(`error RAG`); }

                    }else if(resource_ran == 2){
                        try{//////// STACK
                            const sa_stack = await loadImage(gif.stack);
                            ctx.drawImage(sa_stack, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${option.zombie_amount}`, 90, 130);

                            userData.sa.item.resource.stack += option.zombie_amount;

                        }catch(error){ console.log(`error STACK`); }
                    }

                    if(userData.sa.item.melee.axe.axe_percen <= 0){
                        userData.sa.item.melee.axe.axe_bool = false;
                        userData.sa.item.melee.axe.axe_percen = 0;
                    }

                    if(userData.sa.GUI.Heart <= 0){
                        option.dead = true;
                    }

                    option.zombie_amount = 0;

                }else{
                    userData.sa.GUI.Heart -= option.zombie_amount;

                    if(userData.sa.GUI.Heart <= 0){
                        option.dead = true;
                    }

                    option.zombie_amount = 0;
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////// melee & weapom





            ///////////////////////////////////////////////////////////////////////////////////// spawning
            const zombie = getRandomInt(1, option.zombie_chanceSpawn + 1);
            if(zombie == 1 && option.spanw_resource <= 0){///////// ZOMBIE
                const zombie_amount = getRandomInt(option.zombie_startWith, option.zombie_endWith + 1);
                option.zombie_amount = zombie_amount;

                let zombie_pos = 420;
                for(let i = 1; i <= zombie_amount; i ++){
                    try{
                        let sa_zombie;
                        const zombie_ran = getRandomInt(1, 6);

                        if(zombie_ran == 1){
                            sa_zombie = await loadImage(gif.zombie);
                        }else if(zombie_ran == 2){
                            sa_zombie = await loadImage(gif.zombie2);
                        }else if(zombie_ran == 3){
                            sa_zombie = await loadImage(gif.zombie3);
                        }else if(zombie_ran == 4){
                            sa_zombie = await loadImage(gif.zombie4);
                        }else if(zombie_ran == 5){
                            sa_zombie = await loadImage(gif.zombie5);
                        }

                        ctx.drawImage(sa_zombie, zombie_pos, 190, 211, 211);
                    }catch(error){ console.log(`error zombie`); }
                    zombie_pos += 50;
                }
            }else{
                if(option.interact == true){
                    if(option.spanw_resource == 2){
                        try{//////// LOG
                            const sa_log = await loadImage(gif.log);
                            ctx.drawImage(sa_log, 50, 100, 40, 40);

                            let amount_log = 1;

                            if(userData.sa.item.melee.axe.axe_bool){
                                amount_log = 3;
                            }

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ ${amount_log}`, 90, 130);

                            userData.sa.item.resource.log += amount_log;

                        }catch(error){ console.log(`error log`); }

                    }else if(option.spanw_resource == 1){
                        try{//////// FLOWER
                            const sa_flower = await loadImage(gif.flower);
                            ctx.drawImage(sa_flower, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ 1`, 90, 130);

                            userData.sa.item.resource.flower += 1;

                        }catch(error){ console.log(`error flower`); }

                    }else if(option.spanw_resource == 3){
                        try{//////// STONE
                            const sa_stone = await loadImage(gif.stone);
                            ctx.drawImage(sa_stone, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ 1`, 90, 130);

                            userData.sa.item.resource.stone += 1;

                        }catch(error){ console.log(`error stone`); }

                    }else if(option.spanw_resource == 4){
                        try{//////// HEALING
                            const sa_heart = await loadImage(gif.heart);
                            ctx.drawImage(sa_heart, 50, 100, 40, 40);

                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = 'White';
                            ctx.fillText(`+ 1`, 90, 130);

                            if(userData.sa.GUI.Heart < 5){
                                userData.sa.GUI.Heart += 1;
                            }

                        }catch(error){ console.log(`error healing`); }

                    }else if(option.spanw_resource == 10){
                        if(option.landing == 'a'){
                            try{//////// AXE
                                const sa_axe_item = await loadImage(gif.axe_item);
                                ctx.drawImage(sa_axe_item, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 1`, 90, 130);

                                userData.sa.item.melee.axe.axe_bool = true;
                                userData.sa.item.melee.axe.axe_percen = 100;

                            }catch(error){ console.log(`error axe`); }

                        }else if(option.landing == 'b'){
                            try{//////// KNIFE
                                const sa_knife_item = await loadImage(gif.knife_item);
                                ctx.drawImage(sa_knife_item, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 1`, 90, 130);

                                userData.sa.item.melee.knife.knife_bool = true;
                                userData.sa.item.melee.knife.knife_percen = 100;

                            }catch(error){ console.log(`error knife`); }

                        }else if(option.landing == 'c'){
                            try{//////// AXE
                                const sa_axe_item = await loadImage(gif.axe_item);
                                ctx.drawImage(sa_axe_item, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 1`, 90, 130);

                                userData.sa.item.melee.axe.axe_bool = true;
                                userData.sa.item.melee.axe.axe_percen = 100;

                            }catch(error){ console.log(`error axe`); }

                        }else if(option.landing == 'd'){
                            try{//////// KNIFE
                                const sa_knife_item = await loadImage(gif.knife_item);
                                ctx.drawImage(sa_knife_item, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 1`, 90, 130);

                                userData.sa.item.melee.knife.knife_bool = true;
                                userData.sa.item.melee.knife.knife_percen = 100;

                            }catch(error){ console.log(`error knife`); }

                        }else if(option.landing == 'e'){
                            try{//////// AXE
                                const sa_axe_item = await loadImage(gif.axe_item);
                                ctx.drawImage(sa_axe_item, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 1`, 90, 130);

                                userData.sa.item.melee.axe.axe_bool = true;
                                userData.sa.item.melee.axe.axe_percen = 100;

                            }catch(error){ console.log(`error axe`); }

                        }else if(option.landing == 'f'){
                            try{//////// KNIFE
                                const sa_knife_item = await loadImage(gif.knife_item);
                                ctx.drawImage(sa_knife_item, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 1`, 90, 130);

                                userData.sa.item.melee.knife.knife_bool = true;
                                userData.sa.item.melee.knife.knife_percen = 100;

                            }catch(error){ console.log(`error knife`); }
                        }
                    }else if(option.spanw_resource == 11){
                        const healing_item_ran = getRandomInt(1, 4);

                        if(healing_item_ran == 1){
                            try{//////// CHCOLATE_BAR
                                const sa_chocolate_bar = await loadImage(gif.chocolate_bar);
                                ctx.drawImage(sa_chocolate_bar, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 5`, 90, 130);

                                userData.sa.item.food.chocolate_bar += 5;

                            }catch(error){ console.log(`error knife`); }

                        }else if(healing_item_ran == 2){
                            try{//////// FLOWER_SOUP
                                const sa_flower_soup = await loadImage(gif.flower_soup);
                                ctx.drawImage(sa_flower_soup, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 5`, 90, 130);

                                userData.sa.item.food.flower_soup += 5;

                            }catch(error){ console.log(`error knife`); }

                        }else if(healing_item_ran == 3){
                            try{//////// BANDAGE
                                const sa_bandage = await loadImage(gif.bandage);
                                ctx.drawImage(sa_bandage, 50, 100, 40, 40);

                                ctx.font = 'bold 24px Arial';
                                ctx.fillStyle = 'White';
                                ctx.fillText(`+ 10`, 90, 130);

                                userData.sa.item.medical.bandage += 10;

                            }catch(error){ console.log(`error knife`); }
                        }
                    }

                    option.interact = false;
                    option.spanw_resource = 0;

                }else if(option.zombie_amount <= 0 && option.spanw_resource != 0){

                    if(option.spanw_resource == 1){
                        try{///////// TREE FLOWER
                            const sa_tree_flower = await loadImage(gif.tree_flower);
                            ctx.drawImage(sa_tree_flower, 600, 310, 90, 90);
                        }catch(error){ console.log(`error tree flower`); }

                    }else if(option.spanw_resource == 2){
                        try{///////// TREE LOG
                            let sa_tree_log;
                            const tree_log_ran = getRandomInt(1, 4);
                            if(tree_log_ran == 1){
                                sa_tree_log = await loadImage(gif.tree12);
                            }else if(tree_log_ran == 2){
                                sa_tree_log = await loadImage(gif.tree13);
                            }else if(tree_log_ran == 3){
                                sa_tree_log = await loadImage(gif.tree14);
                            }
                            ctx.drawImage(sa_tree_log, 450, 65, 335, 335);
                        }catch(error){ console.log(`error tree log`); }

                    }else if(option.spanw_resource == 3){
                        try{///////// TREE STONE
                            const sa_tree_stone = await loadImage(gif.tree_stone);
                            ctx.drawImage(sa_tree_stone, 600, 310, 90, 90);
                        }catch(error){ console.log(`error tree stone`); }

                    }else if(option.spanw_resource == 4){
                        try{///////// HEALING
                            const sa_healing = await loadImage(gif.healing);
                            ctx.drawImage(sa_healing, 580, 250, 150, 150);
                        }catch(error){ console.log(`error healing`); }

                    }else if(option.spanw_resource == 10){
                        try{///////// REWARD CHEST
                            const sa_reward_chest = await loadImage(gif.reward_chest);
                            ctx.drawImage(sa_reward_chest, 0, 0, width, height);
                        }catch(error){ console.log(`error reward chest`); }
                    }else if(option.spanw_resource == 10){
                        try{///////// REWARD CHEST
                            const sa_reward_chest_normal = await loadImage(gif.reward_chest_normal);
                            ctx.drawImage(sa_reward_chest_normal, 0, 0, width, height);
                        }catch(error){ console.log(`error reward chest normal`); }
                    }

                }else if(option.spanw_resource == 0){
                    const spanw_resource_luck_ran = getRandomInt(1, 3);
                    if(spanw_resource_luck_ran == 1){
                        const spanw_resource_ran = getRandomInt(1, 4);
                        if(spanw_resource_ran == 1){
                            option.spanw_resource = 1;

                        }else if(spanw_resource_ran == 2){
                            option.spanw_resource = 2;

                        }else if(spanw_resource_ran == 3){
                            option.spanw_resource = 3;
                        }
                    }else{
                        const healing_luck_ran = getRandomInt(1, 3);
                        if(healing_luck_ran == 1){
                            option.spanw_resource = 4;
                        }
                    }
                }
            }
            if(option.landing == 'a'){
                if(userData.sa.land.land_b == false && option.level_exploring == 99){
                    option.spanw_resource = 10;

                }else if(option.level_exploring == 99){
                    option.spanw_resource = 11;
                }
            }else if(option.landing == 'b'){
                if(userData.sa.land.land_c == false && option.level_exploring == 99){
                    option.spanw_resource = 10;

                }else if(option.level_exploring == 99){
                    option.spanw_resource = 11;
                }
            }else if(option.landing == 'c'){
                if(userData.sa.land.land_d == false && option.level_exploring == 99){
                    option.spanw_resource = 10;

                }else if(option.level_exploring == 99){
                    option.spanw_resource = 11;
                }
            }else if(option.landing == 'd'){
                if(userData.sa.land.land_e == false && option.level_exploring == 99){
                    option.spanw_resource = 10;

                }else if(option.level_exploring == 99){
                    option.spanw_resource = 11;
                }
            }else if(option.landing == 'e'){
                if(userData.sa.land.land_f == false && option.level_exploring == 99){
                    option.spanw_resource = 10;

                }else if(option.level_exploring == 99){
                    option.spanw_resource = 11;
                }
            }else if(option.landing == 'f'){
                if(option.level_exploring == 99){
                    option.spanw_resource = 10;
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////// spawning





            ///////////////////////////////////////////////////////////////////////////////////// gui
            if(userData.sa.GUI.Heart > 0){///////// health
                try{
                    const sa_pf = await loadImage(gif.pf);
                    ctx.drawImage(sa_pf, 10, 10, 70, 70);

                    let sa_heart;

                    if(userData.sa.GUI.Heart == 5){
                        sa_heart = await loadImage(gif.bar_5);

                    }else if(userData.sa.GUI.Heart == 4){
                        sa_heart = await loadImage(gif.bar_4);

                    }else if(userData.sa.GUI.Heart == 3){
                        sa_heart = await loadImage(gif.bar_3);

                    }else if(userData.sa.GUI.Heart == 2){
                        sa_heart = await loadImage(gif.bar_2);

                    }else if(userData.sa.GUI.Heart == 1){
                        sa_heart = await loadImage(gif.bar_1);

                    }else if(userData.sa.GUI.Heart <= 0){
                        sa_heart = await loadImage(gif.bar_0);
                    }

                    ctx.drawImage(sa_heart, 75, -35, 294, 163);
                }catch(error){ console.log(`error heart`); }
            }

            try{//////////////////////////////////// ARROW
                const sa_arrow = await loadImage(gif.arrow);
                ctx.drawImage(sa_arrow, 660, 10, 50, 50);

                ctx.font = 'bold 30px Arial';///////////////////// USERNAME
                ctx.fillStyle = 'White';
                ctx.textBaseline = 'middle';
                const text = `${option.level_exploring}`;
                const textWidth = ctx.measureText(text).width;
                const x = 680 - (textWidth / 2);
                ctx.fillText(text, x, 30);

            }catch(error){ console.log(`error arrow`); }

            try{//////////////////////////////////// LANDING
                let sa_land;

                if(option.landing == 'a'){
                    sa_land = await loadImage(gif.land_a);
                }else if(option.landing == 'b'){
                    sa_land = await loadImage(gif.land_b);
                }else if(option.landing == 'c'){
                    sa_land = await loadImage(gif.land_c);
                }else if(option.landing == 'd'){
                    sa_land = await loadImage(gif.land_d);
                }else if(option.landing == 'e'){
                    sa_land = await loadImage(gif.land_e);
                }else if(option.landing == 'f'){
                    sa_land = await loadImage(gif.land_f);
                }

                if(option.level_exploring == 100){//////////////////////////////////// new land unlock
                    if(option.landing == 'a'){
                        if(userData.sa.land.land_b == false){
                            const sa_new_land_unlock = await loadImage(gif.new_land_unlock);
                            ctx.drawImage(sa_new_land_unlock, 0, 0, width, height);
                            userData.sa.land.land_b = true;
                        }
                    }else if(option.landing == 'b'){
                        if(userData.sa.land.land_c == false){
                            const sa_new_land_unlock = await loadImage(gif.new_land_unlock);
                            ctx.drawImage(sa_new_land_unlock, 0, 0, width, height);
                            userData.sa.land.land_c = true;
                        }
                    }else if(option.landing == 'c'){
                        if(userData.sa.land.land_d == false){
                            const sa_new_land_unlock = await loadImage(gif.new_land_unlock);
                            ctx.drawImage(sa_new_land_unlock, 0, 0, width, height);
                            userData.sa.land.land_d = true;
                        }
                    }else if(option.landing == 'd'){
                        if(userData.sa.land.land_e == false){
                            const sa_new_land_unlock = await loadImage(gif.new_land_unlock);
                            ctx.drawImage(sa_new_land_unlock, 0, 0, width, height);
                            userData.sa.land.land_e = true;
                        }
                    }else if(option.landing == 'e'){
                        if(userData.sa.land.land_f == false){
                            const sa_new_land_unlock = await loadImage(gif.new_land_unlock);
                            ctx.drawImage(sa_new_land_unlock, 0, 0, width, height);
                            userData.sa.land.land_f = true;
                        }
                    }
                }

                ctx.drawImage(sa_land, 0, 0, width, height);
            }catch(error){ console.log(`error landing`); }

            const ban_talk_chance = getRandomInt(1, 4);////////////////////// ban talk
            if(ban_talk_chance == 1){
                const ban_talking_ran = getRandomInt(1, 7);
                if(ban_talking_ran == 1){
                    try{
                        const ban_talk = await loadImage(gif.ban_talk_0);
                        ctx.drawImage(ban_talk, 0, 0, width, height);
                        ctx.font = 'bold 35px Arial';
                        ctx.fillStyle = 'Black';
                        ctx.fillText(`${option.zombie_amount}`, 180, 170);
                    }catch(error){ console.log(`error ban talk`); }

                }else if(ban_talking_ran == 2){
                    try{
                        const ban_talk = await loadImage(gif.ban_talk_1);
                        ctx.drawImage(ban_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error ban talk`); }

                }else if(ban_talking_ran == 3){
                    try{
                        const ban_talk = await loadImage(gif.ban_talk_2);
                        ctx.drawImage(ban_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error ban talk`); }

                }else if(ban_talking_ran == 4){
                    try{
                        const ban_talk = await loadImage(gif.ban_talk_3);
                        ctx.drawImage(ban_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error ban talk`); }
                }else if(ban_talking_ran == 5){
                    try{
                        const ban_talk = await loadImage(gif.ban_talk_4);
                        ctx.drawImage(ban_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error ban talk`); }
                }else if(ban_talking_ran == 6){
                    try{
                        const ban_talk = await loadImage(gif.ban_talk_5);
                        ctx.drawImage(ban_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error ban talk`); }
                }
            }

            const zombie_talk_chance = getRandomInt(1, 4);///////////////////////////// zombie talk
            if(zombie_talk_chance == 1 && option.zombie_amount > 0){
                const zombie_talk = getRandomInt(1, 4);
                if(zombie_talk == 1){
                    try{
                        const zombie_talk = await loadImage(gif.zombie_talk_0);
                        ctx.drawImage(zombie_talk, 0, 0, width, height);
                        ctx.font = 'bold 35px Arial';
                        ctx.fillStyle = 'Black';
                        ctx.fillText(`${option.zombie_amount}`, 433, 220);
                    }catch(error){ console.log(`error zombie talk`); }

                }else if(zombie_talk == 2){
                    try{
                        const zombie_talk = await loadImage(gif.zombie_talk_1);
                        ctx.drawImage(zombie_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error zombie talk`); }

                }else if(zombie_talk == 3){
                    try{
                        const zombie_talk = await loadImage(gif.zombie_talk_2);
                        ctx.drawImage(zombie_talk, 0, 0, width, height);
                    }catch(error){ console.log(`error zombie talk`); }
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////// gui





            try{///////// BAN
                const sa_ban = await loadImage(gif.ban);
                ctx.drawImage(sa_ban, 10, 190, 211, 211);
            }catch(error){ console.log(`error ban`); }

            if(userData.sa.item.melee.knife.knife_bool){///////// KNIFE
                try{
                    const sa_knife = await loadImage(gif.knife);
                    ctx.drawImage(sa_knife, 10, 190, 211, 211);

                    ctx.font = 'bold 25px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`${userData.sa.item.melee.knife.knife_percen}%`, 100, 95);
                }catch(error){ console.log(`error knife`); }

            }else if(userData.sa.item.melee.spear.spear_bool){////////// SPEAR
                try{
                    const sa_spear = await loadImage(gif.spear);
                    ctx.drawImage(sa_spear, 10, 190, 211, 211);

                    ctx.font = 'bold 25px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`${userData.sa.item.melee.spear.spear_percen}%`, 100, 95);
                }catch(error){ console.log(`error spear`); }

            }else if(userData.sa.item.melee.axe.axe_bool){///////////// AXE
                try{
                    const sa_axe = await loadImage(gif.axe);
                    ctx.drawImage(sa_axe, 10, 190, 211, 211);

                    ctx.font = 'bold 25px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`${userData.sa.item.melee.axe.axe_percen}%`, 100, 95);
                }catch(error){ console.log(`error axe`); }
            }

        }else if(option.crafting_theme == true){///////////////////////////////////////// CRAFTING
            const sa_crafting = await loadImage(gif.sa_crafting);
            ctx.drawImage(sa_crafting, 0, 0, width, height);

            if(option.crafted_spear){///////// crafting spear
                option.crafted_spear = false;

                try{
                    const sa_spear = await loadImage(gif.spear);
                    ctx.drawImage(sa_spear, 240, -75, 135, 135);

                    ctx.font = 'bold 25px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`+ 1`, 380, 25);
                }catch(error){ console.log(`error crafting spear`); }

            }else if(option.crafted_flower_soup){///////// flower soup
                option.crafted_flower_soup = false;

                try{
                    const sa_flower_soup = await loadImage(gif.flower_soup);
                    ctx.drawImage(sa_flower_soup, 335, -5, 40, 40);

                    ctx.font = 'bold 25px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`+ 1`, 380, 25);
                }catch(error){ console.log(`error crafting spear`); }

            }else if(option.crafted_bandage){///////// medical
                option.crafted_bandage = false;

                try{
                    const sa_bandage = await loadImage(gif.bandage);
                    ctx.drawImage(sa_bandage, 335, -5, 40, 40);

                    ctx.font = 'bold 25px Arial';
                    ctx.fillStyle = 'White';
                    ctx.fillText(`+ 1`, 380, 25);
                }catch(error){ console.log(`error medical`); }
            }

            ////// knife
            if(userData.sa.item.melee.knife.knife_bool){
                const knife_item = await loadImage(gif.knife_item);
                ctx.drawImage(knife_item, 25, 120, 100, 100);
            }

            ////// spear
            if(userData.sa.item.melee.spear.spear_bool){
                const spear_item = await loadImage(gif.spear_item);
                ctx.drawImage(spear_item, 42, 50, 200, 200);
            }
        }else if(option.base_theme == true){///////////////////////////////////////// BASE
            if(userData.sa.base.base_bool){
                const sa_upgrade_base = await loadImage(gif.upgrade_base);
                ctx.drawImage(sa_upgrade_base, 0, 0, width, height);

            }else{
                const sa_upgrade_base = await loadImage(gif.upgrade_base);
                ctx.drawImage(sa_upgrade_base, 0, 0, width, height);

                ////// log
                if(true){
                    const log = await loadImage(gif.log);
                    ctx.drawImage(log, 397, 110, 50, 50);

                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = 'Black';
                    ctx.fillText(`${userData.sa.item.resource.log} / 75`, 460, 145);
                }

                ////// stack
                if(true){
                    const stack = await loadImage(gif.stack);
                    ctx.drawImage(stack, 397, 180, 50, 50);

                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = 'Black';
                    ctx.fillText(`${userData.sa.item.resource.stack} / 100`, 460, 215);
                }

                ////// rag
                if(true){
                    const rag = await loadImage(gif.rag);
                    ctx.drawImage(rag, 397, 250, 50, 50);

                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = 'Black';
                    ctx.fillText(`${userData.sa.item.resource.rag} / 80`, 460, 285);
                }
            }
        }

    }catch(error){ console.log(`error survival in function ${error.stack()}`); }

    return canvas.toBuffer();
}

module.exports = {survival, battleAllEntity ,longMessage ,splitMessage ,getRankGif ,battleWithWeapon ,activeWeapon ,getRank ,getWeaponName ,getWeaponNameById ,getWeaponRankById ,getWeaponEquipById ,getPassive ,getWeaponRank ,generateRandomId ,resistance ,stateMR ,stateHP, stateSTR, stateWP, stateMAG, statePR, stateMAG ,getSatImage ,loadImage ,createCanvas ,checkOwnAnimal ,xpToRateXp, xpToLevel, toSuperscript ,User, fs, getAnimalNameByName, getimageAnimal, getAnimalIdByName, checkRankAnimalById, checkPointAnimalById, checkSellAnimalById, customEmbed, cooldown, mileToHour, mileToMin, mileToSec, basicEmbed, EmbedBuilder, getCollectionButton, oneButton, twoButton, threeButton, fourButton, fiveButton, sleep, getRandomInt, one_second, prefix, getFiles, getUser, SimpleEmbed, blackjackEmbed, gif, advanceEmbed, labelButton, emojiButton, sym, syms, sym3, ButtonStyle, AttachmentBuilder, ComponentType, createCanvas, loadImage, InteractionCollector };