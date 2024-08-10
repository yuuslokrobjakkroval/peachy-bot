const { Command } = require("../../structures");
const { gif, SimpleEmbed, getUser, ButtonStyle, createCanvas, loadImage, labelButton, twoButton, getCollectionButton } = require('../../functions/function');
const moment = require('moment-timezone');

class Profile extends Command {
    constructor(client) {
        super(client, {
            name: "profile",
            description: {
                content: "Manage your profile or update your relationship status.",
                examples: ["profile set about me I love coding!", "profile set relationship @user"],
                usage: "PROFILE <set> <aboutme/relationship> [details]",
            },
            category: "social",
            aliases: ["profile", "pf"],
            cooldown: 1,
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
                    description: 'The type of setting (about me/relationship)',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'aboutme', value: 'aboutme' },
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

            if (args[0]) {
                // If the command is to set 'aboutme'
                if (args[0] === 'set' && args[1] === 'aboutme') {
                    const command = ctx?.message?.content;
                    const text = `${command?.slice(command.indexOf(args[2]))}`;
                    if (text.length > 50) {
                        return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> your about me is more than 30 letters.`)]});
                    }
                    userData.about_me = text;
                    await userData.save();
                    return ctx.channel.send({embeds: [SimpleEmbed(`Now <@${user.id}> has changed their about me to **${text}**`)]});

                    // If the command is to set 'relationship'
                } else if (args[0] === 'set' && args[1] === 'relationship') {
                    const mention = ctx.message.mentions.users.first();
                    if (mention) {
                        if (mention.id === userData.relationship_partner_id) {
                            return ctx.channel.send({embeds: [SimpleEmbed(`<@${user.id}> and <@${mention.id}> are already in a relationship❤️`)]});
                        }

                        const embed = this.client.embed()
                            .setAuthor({
                                name: `<@${user.id}>, you and <@${mention.id}> are about to get married`,
                                iconURL: user.displayAvatarURL()
                            })
                            .setColor("Random")
                            .setDescription(`💝💖💘 God bless the two of you ❤️💞💓\n\n<@${mention.id}>, do you agree with <@${user.id}>?`)
                            .setTimestamp();

                        const confirmButton = labelButton('confirm_button', '✅ Confirm', ButtonStyle.Success);
                        const cancelButton = labelButton('cancel_button', '❎ Cancel', ButtonStyle.Danger);
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
                                    userData.relationship_partner_id = mention.id;
                                    userData.date_of_start_relationship = dateOfStart;
                                    partnerData.relationship_partner_id = user.id;
                                    partnerData.date_of_start_relationship = dateOfStart;

                                    await Promise.all([userData.save(), partnerData.save()]);

                                    messageEmbed.edit({
                                        embeds: [SimpleEmbed(`💓💞❤️💘** Congratulations! You are now a couple**💖💝❣️💗\n **Husband**: <@${user.id}> ==> **Wife**: <@${mention.id}>`)],
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
                    // Display profile information
                    const username = user.username;
                    const aboutMe = userData.about_me || 'Not set';
                    let relationshipStatus = "Single";

                    if (userData.relationship_partner_id) {
                        try {
                            const partner = await client.users.fetch(userData.relationship_partner_id);
                            relationshipStatus = partner.username;
                        } catch (error) {
                            console.error(`Error fetching partner data: ${error}`);
                            relationshipStatus = "Single";
                        }
                    }

                    const avatarURL = user.displayAvatarURL({extension: 'png', size: 256});

                    // Create canvas for profile image
                    const width = 480;
                    const height = 250;
                    const canvas = createCanvas(width, height);
                    const ctxCanvas = canvas.getContext('2d');

                    // Draw background
                    let backgroundImage;
                    if(userData.gender === 'male'){
                        backgroundImage =  gif.profile_male_background;
                    } else if (userData.gender === 'female') {
                        backgroundImage =  gif.profile_female_background;
                    } else {
                        backgroundImage =  gif.profile_no_gender_background;
                    }

                    try {
                        const background = await loadImage(backgroundImage);
                        ctxCanvas.drawImage(background, 0, 0, width, height);
                    } catch (error) {
                        console.error(`Error loading background image: ${error}`);
                    }

                    // Draw user avatar
                    try {
                        const avatar = await loadImage(avatarURL);
                        const avatarSize = 100;
                        ctxCanvas.drawImage(avatar, 20, 20, avatarSize, avatarSize);
                    } catch (error) {
                        console.error(`Error loading user avatar: ${error}`);
                    }

                    // Draw partner avatar if in a relationship
                    if (userData.relationship_partner_id) {
                        try {
                            console.log(userData)
                            const partner = await client.users.fetch(userData.relationship_partner_id);
                            const partnerAvatarURL = partner.displayAvatarURL({extension: 'png', size: 256});
                            const partnerAvatar = await loadImage(partnerAvatarURL);
                            const avatarSize = 100;
                            ctxCanvas.drawImage(partnerAvatar, 360, 20, avatarSize, avatarSize);
                            ctxCanvas.font = '20px sans-serif';
                            ctxCanvas.fillStyle = '#ffffff';
                            ctxCanvas.fillText(userData.date_of_start_relationship, 188, 245);
                        } catch (error) {
                            console.error(`Error loading partner avatar: ${error}`);
                        }
                    }

                    // Draw username
                    ctxCanvas.font = '28px sans-serif';
                    ctxCanvas.fillStyle = '#FF0000';
                    ctxCanvas.fillText(username, 140, 50);

                    // Draw "About Me"
                    ctxCanvas.font = '20px sans-serif';
                    ctxCanvas.fillStyle = '#FF0000';
                    ctxCanvas.fillText(`About Me:`, 140, 90);
                    ctxCanvas.fillText(aboutMe, 140, 120);

                    // Draw "Relationship Status"
                    ctxCanvas.font = '20px sans-serif';
                    ctxCanvas.fillStyle = '#FF0000';
                    ctxCanvas.fillText(`Relationship Status:`, 140, 160);
                    ctxCanvas.fillText(relationshipStatus, 140, 190);

                    // Convert canvas to buffer and send as attachment
                    const buffer = canvas.toBuffer();
                    const attachment = {files: [{attachment: buffer, name: 'profile.png'}]};
                    await ctx.channel.send(attachment);
                }
            } catch(error){
                // Log the full error stack to understand where it came from
                console.error(`Error in profile command: ${error.stack}`);

                // Provide feedback to the user if possible
                ctx.channel.send({content: 'An error occurred while processing the command. Please try again later.'});
            }
        }

}

module.exports = Profile;
