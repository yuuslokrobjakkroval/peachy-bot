const { Command } = require("../../structures");
const { gif, SimpleEmbed, getUser, ButtonStyle, createCanvas, loadImage, emojiButton, twoButton, getCollectionButton,
    formatCapitalize
} = require('../../functions/function');
const moment = require('moment-timezone');
const config = require('../../config');
const { TITLE, RELATIONSHIPHEART, YES, NO , CATCAKE, HEARTCAKE} = require('../../utils/Emoji');
const CAKE = [CATCAKE, HEARTCAKE]

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
                const aboutMe = userData.bio || 'Not Set';
                const birthday = moment(userData.dateOfBirth, 'DD-MM-YYYY').format('DD-MMM-YYYY') || 'Not Set';
                let relationshipStatus;

                if (userData.relationshipPartnerId) {
                    try {
                        const partner = await client.users.fetch(userData.relationshipPartnerId);
                        relationshipStatus = partner.username;
                    } catch (error) {
                        console.error(`Error fetching partner data: ${error}`);
                        relationshipStatus = "Single";
                    }
                } else {
                    relationshipStatus = 'Not set';
                }

                const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });

                // Create canvas for profile image
                const width = 1600;
                const height = 860;
                const canvas = createCanvas(width, height);
                const ctxCanvas = canvas.getContext('2d');

                // Define heights for the upper and lower parts
                const upperPartHeight = 560;
                const lowerPartHeight = height - upperPartHeight;

                // Draw upper part background (image)
                let backgroundImage;
                if(userData.gender === 'male'){
                    backgroundImage = gif.profile_male_background;
                } else if (userData.gender === 'female') {
                    backgroundImage = gif.profile_female_background;
                } else {
                    backgroundImage = gif.profile_no_gender_background;
                }

                try {
                    const background = await loadImage(backgroundImage);
                    ctxCanvas.drawImage(background, 0, 0, width, upperPartHeight);
                } catch (error) {
                    console.error(`Error loading background image: ${error}`);
                }

                // Draw user avatar
                try {
                    const avatar = await loadImage(avatarURL);
                    const avatarSize = 512;
                    const radius = avatarSize / 2;

                    ctxCanvas.save();
                    ctxCanvas.beginPath();
                    ctxCanvas.arc(width / 2, upperPartHeight / 2, radius, 0, Math.PI * 2);
                    ctxCanvas.clip();

                    ctxCanvas.drawImage(avatar, (width - avatarSize) / 2, (upperPartHeight - avatarSize) / 2, avatarSize, avatarSize);

                    ctxCanvas.restore();
                } catch (error) {
                    console.error(`Error loading user avatar: ${error}`);
                }

                try {
                    const lowerPartBackground = await loadImage(gif.lower_profile_background);
                    ctxCanvas.drawImage(lowerPartBackground, 0, upperPartHeight, width, lowerPartHeight);
                } catch (error) {
                    console.error(`Error loading lower part background image: ${error}`);
                }

                // Draw partner avatar if in a relationship
                if (userData.relationshipPartnerId) {
                    try {
                        const partner = await client.users.fetch(userData.relationshipPartnerId);
                        const partnerAvatarURL = partner.displayAvatarURL({ extension: 'png', size: 256 });
                        const partnerAvatar = await loadImage(partnerAvatarURL);
                        const partnerAvatarSize = 564;
                        ctxCanvas.drawImage(partnerAvatar, (width - partnerAvatarSize) / 2, upperPartHeight + 20, partnerAvatarSize, partnerAvatarSize);
                        ctxCanvas.font = '20px sans-serif';
                        ctxCanvas.fillStyle = '#ffffff';
                        ctxCanvas.fillText(userData.dateOfStartRelationShip, 188, upperPartHeight + 245);
                    } catch (error) {
                        console.error(`Error loading partner avatar: ${error}`);
                    }
                }

                // Draw username
                ctxCanvas.font = '48px sans-serif';
                ctxCanvas.fillStyle = '#FF0000';
                ctxCanvas.fillText(username, 140, upperPartHeight + 50);

                // Draw "Bio"
                ctxCanvas.font = '36px sans-serif';
                ctxCanvas.fillStyle = '#FF0000';
                ctxCanvas.fillText(`Bio: ${aboutMe}`, 140, upperPartHeight + 90);

                // Draw "Birthday"
                ctxCanvas.font = '36px sans-serif';
                ctxCanvas.fillStyle = '#FF0000';
                ctxCanvas.fillText(`Birthday: ${birthday}`, 140, upperPartHeight + 150);

                // Draw "Relationship"
                ctxCanvas.fontpx= '36px sans-serif';
                ctxCanvas.fillStyle = '#FF0000';
                ctxCanvas.fillText(`Relationship: ${relationshipStatus}`, 140, upperPartHeight + 190);

                // Convert canvas to buffer and send as attachment
                const buffer = canvas.toBuffer();
                const attachment = { files: [{ attachment: buffer, name: 'profile.png' }] };
                await ctx.channel.send(attachment);

            } else {
                // Existing command logic for 'set' bio/birthday/relationship
                if (args[0] && args[1]) {
                    if (args[0] === 'set' && args[1] === 'bio') {
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
                        await ctx.channel.send({ embeds: [embed] });

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
                        await ctx.channel.send({ embeds: [embed] });

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
                        await ctx.channel.send({ embeds: [embed] });

                    } else if (args[0] === 'set' && args[1] === 'relationship') {
                        const mention = ctx.message.mentions.users.first();
                        if (mention) {
                            if (mention.id === userData.relationshipPartnerId) {
                                return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> and <@${mention.id}> are already in a relationship ${RELATIONSHIPHEART}`)]});
                            }

                            const embed = this.client.embed()
                                .setAuthor({
                                    name: `<@${user.id}>, you and <@${mention.id}> are about to get married`,
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
                                        userData.relationshipPartnerId = mention.id;
                                        userData.dateOfStartRelationShip = dateOfStart;
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
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> please mention your partner.`)]});
                        }
                    }
                } else {
                    let recommendationMessage = '';

                    recommendationMessage += 'Invalid command usage.\nPlease use `profile` to view your profile.\nPlease use `profile set` to update your details.\n';

                    if (!userData.bio) {
                        recommendationMessage += 'Please set your bio using `profile set bio [text]`.\n';
                    }
                    if (!userData.dateOfBirth) {
                        recommendationMessage += 'Please set your birthday using `profile set birthday [DD-MM-YYYY]`.\n';
                    }
                    if (!userData.relationshipPartnerId) {
                        recommendationMessage += 'Please set your relationship status using `profile set relationship @user`.';
                    }

                    const embed =this.client.embed()
                            .setColor(config.color.red)
                            .setTitle(`**${TITLE} Missing Arguments ${TITLE}**`)
                            .setDescription(recommendationMessage);

                    if (recommendationMessage) {
                        await ctx.channel.send({ embeds: [embed] });
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
