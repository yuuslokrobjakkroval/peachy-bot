const { Command } = require("../../structures");
const { gif, SimpleEmbed, getUser, ButtonStyle, createCanvas, loadImage, emojiButton, twoButton, getCollectionButton, formatCapitalize } = require('../../functions/function');
const moment = require('moment-timezone');
const config = require('../../config');
const { TITLE, MALE, FEMALE, GAY, RELATIONSHIPHEART, YES, NO , CATCAKE, HEARTCAKE, PANCAKE, SWEETROLL} = require('../../utils/Emoji');
const CAKE = [CATCAKE, HEARTCAKE, PANCAKE, SWEETROLL]

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const randomCake = getRandomElement(CAKE);


class Profile extends Command {
    constructor(client) {
        super(client, {
            name: "profile",
            description: {
                content: "Manage your profile or update your relationship status.",
                examples: ["profile set about me I love coding!", "profile set relationship @user"],
                usage: "PROFILE <set> <bio/birthday/relationship> [details]",
            },
            category: "social",
            aliases: ["profile", "pf"],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'action',
                    description: 'The action to perform (set)',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'set', value: 'set' },
                    ],
                },
                {
                    name: 'type',
                    description: 'The type of setting (bio/birthday/relationship)',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'bio', value: 'bio' },
                        { name: 'birthday', value: 'birthday' },
                        { name: 'relationship', value: 'relationship' },
                    ],
                },
                {
                    name: 'details',
                    description: 'The details to set (text or mention)',
                    type: 'STRING',
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        try {
            const user = ctx.author;
            const userData = await getUser(user.id);
            if (!args[0]) {
                const username = userData.username ? userData.username : user.username;
                const bio = userData.bio || 'Not Set';
                const birthday = moment(userData.dateOfBirth, 'DD-MM-YYYY').format('DD-MMM-YYYY') || 'Not Set';
                const relationshipStatus = userData.relationshipStatus || 'Not Set';
                const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
                const width = 1280;
                const height = 1280;
                const canvas = createCanvas(width, height);
                const ctxCanvas = canvas.getContext('2d');

                let backgroundPath;
                if (userData.relationshipStatus === 'single') {
                    if (userData.userId === '1006597979932725320') {
                        backgroundPath = gif.hugme_supporter_female_background;
                    } else if (userData.userId === '1259714830483329065') {
                        backgroundPath = gif.kol_supporter_female_background;
                    } else {
                        backgroundPath = userData.gender === 'male'
                            ? gif.single_male_background
                            : gif.single_female_background;
                    }

                    try {
                        const background = await loadImage(backgroundPath);
                        ctxCanvas.drawImage(background, 0, 0, width, height);
                    } catch (error) {
                        console.error(`Error loading background image: ${error}`);
                    }

                    // User Avatar
                    const avatar = await loadImage(avatarURL);
                    const existingAvatarX = 459.84;
                    const existingAvatarY = 603;
                    const avatarSize = 360;
                    ctxCanvas.save();
                    ctxCanvas.beginPath();
                    ctxCanvas.arc(existingAvatarX + avatarSize / 2, existingAvatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                    ctxCanvas.clip();
                    ctxCanvas.drawImage(avatar, existingAvatarX, existingAvatarY, avatarSize, avatarSize);
                    ctxCanvas.restore();

                    // Draw username
                    ctxCanvas.font = '30px Times New Roman';
                    ctxCanvas.fillStyle = '#ffffff';
                    ctxCanvas.fillText(username, 140, 50);

                    // Draw "About Me"
                    ctxCanvas.font = "30px Times New Roman";
                    ctxCanvas.fillStyle = '#ffffff';
                    ctxCanvas.fillText('About Me:', 140, 90);
                    ctxCanvas.fillText(bio, 140, 120);

                    // Draw "Relationship Status"
                    ctxCanvas.font = "30px Times New Roman";
                    ctxCanvas.fillStyle = '#ffffff';
                    ctxCanvas.fillText('Relationship Status:', 140, 160);
                    ctxCanvas.fillText(relationshipStatus, 140, 190);
                } else {
                    if (userData.relationshipStatus === 'relationship') {
                        backgroundPath = userData.gender === 'male'
                            ? gif.two_bestie_male_background
                            : gif.two_relationship_background;
                    } else {
                        backgroundPath = userData.userId === '966688007493140591'
                            ? gif.owner_special_background
                            : userData.userId === '946079190971732041'
                                ? gif.baby_owner_special_background
                                : gif.one_relationship_background;
                    }

                    try {
                        const background = await loadImage(backgroundPath);
                        ctxCanvas.drawImage(background, 0, 0, width, height);
                    } catch (error) {
                        console.error(`Error loading background image: ${error}`);
                    }

                    // User Avatar
                    const avatar = await loadImage(avatarURL);
                    const userAvatarX = 95.06;
                    const userAvatarY = 600.5;
                    const partnerAvatarX = 823.56;
                    const partnerAvatarY = 599;
                    const avatarSize = 360;

                    ctxCanvas.save();
                    ctxCanvas.beginPath();
                    ctxCanvas.arc(userAvatarX + avatarSize / 2, userAvatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                    ctxCanvas.clip();
                    ctxCanvas.drawImage(avatar, userAvatarX, userAvatarY, avatarSize, avatarSize);
                    ctxCanvas.restore();

                    // Partner Avatar
                    if (userData.relationshipPartnerId) {
                        const partner = await client.users.fetch(userData.relationshipPartnerId);
                        const partnerURL = partner.displayAvatarURL({ extension: 'png', size: 256 });
                        const partnerAvatar = await loadImage(partnerURL);
                        ctxCanvas.save();
                        ctxCanvas.beginPath();
                        ctxCanvas.arc(partnerAvatarX + avatarSize / 2, partnerAvatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                        ctxCanvas.clip();
                        ctxCanvas.drawImage(partnerAvatar, partnerAvatarX, partnerAvatarY, avatarSize, avatarSize);
                        ctxCanvas.restore();
                    }

                    // Draw username
                    ctxCanvas.font = "30px Times New Roman";
                    ctxCanvas.fillStyle = '#ffffff';
                    ctxCanvas.fillText(username, 140, 50);

                    // Draw "About Me"
                    ctxCanvas.font = "30px Times New Roman";
                    ctxCanvas.fillStyle = '#ffffff';
                    ctxCanvas.fillText('About Me:', 140, 90);
                    ctxCanvas.fillText(bio, 140, 120);

                    // Draw "Relationship Status"
                    ctxCanvas.font = "30px Times New Roman";
                    ctxCanvas.fillStyle = '#ffffff';
                    ctxCanvas.fillText('Relationship Status:', 140, 160);
                    ctxCanvas.fillText(relationshipStatus, 140, 190);
                }

                const buffer = canvas.toBuffer();
                const attachment = { files: [{ attachment: buffer, name: 'profile.png' }] };
                await ctx.channel.send(attachment);
            } else {
                if (args[0] && args[1]) {
                    if (args[0] === 'set' && args[1] === 'gender') {
                        const gender = args.slice(2).join(" ").toLowerCase();
                        if (!["male", "female", "gay"].includes(gender)) {

                            const embed = this.client.embed()
                                .setColor(config.color.main)
                                .setTitle(`**${TITLE} Gender ${TITLE}**\n`)
                                .setDescription("Please specify a valid gender (male, female, gay).");
                            return await ctx.channel.send({embeds: [embed]});
                        }

                        let GENDER;

                        if (gender === "male") {
                            GENDER = MALE;
                        } else if (gender === "female") {
                            GENDER = FEMALE;
                        } else {
                            GENDER = GAY;
                        }

                        userData.gender = gender;
                        await userData.save();

                        const embed = this.client.embed()
                            .setColor(config.color.main)
                            .setTitle(`**${TITLE} Gender ${TITLE}**\n`)
                            .setDescription(`Your gender has been set to **\`${formatCapitalize(gender)}\`** ${GENDER}.`);

                        await ctx.channel.send({embeds: [embed]});

                    } else if (args[0] === 'set' && args[1] === 'bio') {
                        const command = ctx?.message?.content;
                        const text = `${command?.slice(command.indexOf(args[2]))}`;
                        if (text.length > 50) {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> your bio is more than 50 characters.`)]});
                        }
                        userData.bio = text;
                        await userData.save();

                        const embed = this.client.embed()
                            .setColor(config.color.main)
                            .setTitle(`**${TITLE} Bio ${TITLE}**\n`)
                            .setDescription(`Now <@${user.id}> has changed their bio to **${text}.**`);
                        await ctx.channel.send({embeds: [embed]});

                    } else if (args[0] === 'set' && args[1] === 'username') {
                        const command = ctx?.message?.content;
                        const text = `${command?.slice(command.indexOf(args[2]))}`;
                        if (text.length > 10) {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> your username is more than 10 characters.`)]});
                        }
                        userData.username = text;
                        await userData.save();
                        const embed = this.client.embed()
                            .setColor(config.color.main)
                            .setTitle(`**${TITLE} Username ${TITLE}**\n`)
                            .setDescription(`Now <@${user.id}> has changed their username to **${text}.**`);
                        await ctx.channel.send({embeds: [embed]});

                    } else if ((args[0] === 'set' && args[1] === 'bd') || args[1] === 'birthday') {
                        const command = ctx?.message?.content;
                        const text = command?.slice(command.indexOf(args[2]));

                        const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
                        if (!datePattern.test(text)) {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> please enter your birthday in the format DD-MM-YYYY.`)]});
                        }

                        const [day, month, year] = text.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> the date you provided is not a valid date.`)]});
                        }

                        if (text.length > 12) {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> your birthday entry is more than 12 characters.`)]});
                        }

                        userData.dateOfBirth = text;
                        await userData.save();

                        const embed = this.client.embed()
                            .setColor(config.color.main)
                            .setTitle(`**${TITLE} Birthday ${TITLE}**\n`)
                            .setDescription(`Now <@${user.id}> has set their birthday to **${text} ${randomCake}.**`);
                        await ctx.channel.send({embeds: [embed]});

                    } else if (args[0] === 'set' && args[1] === 'relationship') {
                        const mention = ctx.message.mentions.users.first();
                        if (mention) {
                            if (mention.id === userData.relationshipPartnerId) {
                                return ctx.channel.send({embeds: [SimpleEmbed(`${user.displayName} and ${mention.displayName} are already in a relationship ${RELATIONSHIPHEART}`)]});
                            }

                            const embed = this.client.embed()
                                .setAuthor({
                                    name: `${user.displayName} and ${mention.displayName} are about to get married`,
                                    iconURL: user.displayAvatarURL()
                                })
                                .setColor("Random")
                                .setDescription(`💝💖💘 God bless the two of you❤️💞💓\n\n<@${mention.id}>, do you agree with <@${user.id}>?`)
                                .setTimestamp();

                            const confirmButton = emojiButton('confirm_button', `${YES}`, ButtonStyle.Success);
                            const cancelButton = emojiButton('cancel_button', `${NO}`, ButtonStyle.Danger);
                            const allButtons = twoButton(confirmButton, cancelButton);

                            const messageEmbed = await ctx.channel.send({embeds: [embed], components: [allButtons]});
                            const collector = getCollectionButton(messageEmbed, 30000);

                            collector.on('end', (collected, reason) => {
                                if (reason === 'time') {
                                    confirmButton.setDisabled(true);
                                    cancelButton.setDisabled(true);
                                    messageEmbed.edit({embeds: [embed.setColor('#3D3D3D')], components: [allButtons]});
                                }
                            });

                            collector.on('collect', async (interaction) => {
                                if (interaction.user.id !== mention.id) {
                                    await interaction.reply({content: 'This button is not for you!', ephemeral: true});
                                    return;
                                }

                                if (interaction.customId === 'confirm_button') {
                                    try {
                                        const partnerData = await getUser(mention.id);
                                        const now = moment.tz('Asia/Phnom_Penh');
                                        const dateOfStart = now.format('DD-MM-YYYY');
                                        userData.relationshipStatus = args[1];
                                        userData.relationshipPartnerId = mention.id;
                                        userData.dateOfStartRelationShip = dateOfStart;
                                        partnerData.relationshipStatus = args[1];
                                        partnerData.relationshipPartnerId = user.id;
                                        partnerData.dateOfStartRelationShip = dateOfStart;

                                        await Promise.all([userData.save(), partnerData.save()]);

                                        messageEmbed.edit({
                                            embeds: [SimpleEmbed(`💓💞❤️💘 **Congratulations! You are now a couple** 💖💝❣️💗\n <@${user.id}> ${RELATIONSHIPHEART} <@${mention.id}>.`)],
                                            components: []
                                        });
                                        collector.stop();
                                    } catch (error) {
                                        console.error(`Error saving relationship data: ${error}`);
                                    }
                                }

                                if (interaction.customId === 'cancel_button') {
                                    messageEmbed.edit({
                                        embeds: [SimpleEmbed(`<@${mention.id}> has rejected the proposal.`)],
                                        components: []
                                    });
                                    collector.stop();
                                }
                            });
                        } else {
                            return ctx.channel.send({embeds: [SimpleEmbed(`${user.displayName} please mention your partner.`)]});
                        }
                    } else if (args[0] === 'set' && args[1] === 'bestie') {
                        const mention = ctx.message.mentions.users.first();
                        if (mention) {
                            if (mention.id === userData.relationshipPartnerId) {
                                return ctx.channel.send({embeds: [SimpleEmbed(`${user.displayName} and ${mention.displayName} are already in a bestie ${RELATIONSHIPHEART}`)]});
                            }

                            const embed = this.client.embed()
                                .setAuthor({
                                    name: `${user.displayName} and ${mention.displayName} are about to get bestie`,
                                    iconURL: user.displayAvatarURL()
                                })
                                .setColor("Random")
                                .setDescription(`${mention.displayName}, do you agree with ${user.displayName}?`)
                                .setTimestamp();

                            const confirmButton = emojiButton('confirm_button', `${YES}`, ButtonStyle.Success);
                            const cancelButton = emojiButton('cancel_button', `${NO}`, ButtonStyle.Danger);
                            const allButtons = twoButton(confirmButton, cancelButton);

                            const messageEmbed = await ctx.channel.send({embeds: [embed], components: [allButtons]});
                            const collector = getCollectionButton(messageEmbed, 30000);

                            collector.on('end', (collected, reason) => {
                                if (reason === 'time') {
                                    confirmButton.setDisabled(true);
                                    cancelButton.setDisabled(true);
                                    messageEmbed.edit({embeds: [embed.setColor('#3D3D3D')], components: [allButtons]});
                                }
                            });

                            collector.on('collect', async (interaction) => {
                                if (interaction.user.id !== mention.id) {
                                    await interaction.reply({content: 'This button is not for you!', ephemeral: true});
                                    return;
                                }

                                if (interaction.customId === 'confirm_button') {
                                    try {
                                        const partnerData = await getUser(mention.id);
                                        const now = moment.tz('Asia/Phnom_Penh');
                                        const dateOfStart = now.format('DD-MM-YYYY');
                                        userData.relationshipStatus = args[1];
                                        userData.relationshipPartnerId = mention.id;
                                        userData.dateOfStartRelationShip = dateOfStart;
                                        partnerData.relationshipStatus = args[1];
                                        partnerData.relationshipPartnerId = user.id;
                                        partnerData.dateOfStartRelationShip = dateOfStart;

                                        await Promise.all([userData.save(), partnerData.save()]);

                                        messageEmbed.edit({
                                            embeds: [SimpleEmbed(`💓💞❤️💘 **Congratulations! You are now a bestie** 💖💝❣️💗\n <@${user.id}> ${RELATIONSHIPHEART} <@${mention.id}>.`)],
                                            components: []
                                        });
                                        collector.stop();
                                    } catch (error) {
                                        console.error(`Error saving relationship data: ${error}`);
                                    }
                                }

                                if (interaction.customId === 'cancel_button') {
                                    messageEmbed.edit({
                                        embeds: [SimpleEmbed(`<@${mention.displayName}> has rejected the proposal.`)],
                                        components: []
                                    });
                                    collector.stop();
                                }
                            });

                        } else {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.displayName}> please mention your partner.`)]});
                        }
                    } else {
                        let recommendationMessage = '';

                        recommendationMessage += 'Invalid command usage.\nPlease use `profile` to view your profile.\nPlease use `profile set` to update your details.\n';
                        if (!userData.gender) {
                            recommendationMessage += 'Please set your gender using `profile set gender [male, female]`.\n';
                        }

                        if (!userData.bio) {
                            recommendationMessage += 'Please set your bio using `profile set bio [text]`.\n';
                        }
                        if (!userData.dateOfBirth) {
                            recommendationMessage += 'Please set your birthday using `profile set birthday [DD-MM-YYYY]`.\n';
                        }
                        if (!userData.relationshipPartnerId) {
                            recommendationMessage += 'Please set your relationship status using `profile set relationship @user`.';
                        }

                        const embed = this.client.embed()
                            .setColor(config.color.red)
                            .setTitle(`**${TITLE} Missing Arguments ${TITLE}**`)
                            .setDescription(recommendationMessage);

                        if (recommendationMessage) {
                            await ctx.channel.send({embeds: [embed]});
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error in profile command: ${error}`);
            return ctx.channel.send({ content: 'An error occurred while processing your request.' });
        }
    }
}

module.exports = Profile;
