const { cooldown, gif, SimpleEmbed, getUser, ButtonStyle, createCanvas, loadImage, labelButton, twoButton, getCollectionButton } = require('../../functions/function');
const moment = require('moment-timezone');
const { Command } = require("../../structures");

const cooldowns = new Map();
let CDT = 60_000;
let getId = [];
let cdId = [];
let prem = [];

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
            aliases: ["profile", "pf", 'p'],
            cooldown: 3,
            args: true,
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
                    description: 'The type of setting (aboutme/relationship)',
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

    async run(client, message, args) {
        try {
            const user = message.author;
            const userData = await getUser(user.id);

            // if (userData?.premium?.premium_bool && !prem.includes(user.id)) {
            //     prem.push(user.id);
            // }

            if (cooldown(user.id, getId, cdId, CDT, message, cooldowns, prem)) {
                return;
            }

            const action = args[0];
            const type = args[1];
            const details = args.slice(2).join(' ');

            if (action === 'set') {
                if (type === 'aboutme') {
                    if (details.length > 30) {
                        return message.channel.send({ embeds: [SimpleEmbed(`<@${user.id}> Your about me is more than 30 letters.`)] });
                    }
                    userData.about_me = details;
                    await userData.save();
                    return message.channel.send({ embeds: [SimpleEmbed(`Now <@${user.id}> has changed about me to **${details}**`)] });
                } else if (type === 'relationship') {
                    await handleRelationshipUpdate(message, user, userData, details);
                }
            } else {
                await sendProfileCard(message, user, userData, client);
            }

        } catch (error) {
            console.error(`An error occurred: ${error}`);
            message.channel.send({ content: 'An error occurred while processing your request.' });
        }
    }
}

async function handleRelationshipUpdate(message, user, userData, details) {
    const mention = message.mentions.users.first();
    if (mention) {
        if (mention.id === userData.relationship_partner_id) {
            return message.channel.send({ embeds: [SimpleEmbed(`<@${user.id}> and <@${mention.id}> are already married❤️`)] });
        }

        const embed = new customEmbed()
            .setAuthor({ name: `${user.username}, you and ${mention.username} are about to get married`, iconURL: user.displayAvatarURL() })
            .setColor("RANDOM")
            .setDescription(`💝💖💘God will bless both of you❤️💞💓\n\n<@${mention.id}>, do you agree with <@${user.id}>?`)
            .setTimestamp();

        const confirmButton = labelButton('confirm_button', '✅ Confirm', ButtonStyle.Success);
        const cancelButton = labelButton('cancel_button', '❎ Cancel', ButtonStyle.Danger);
        const allButtons = twoButton(confirmButton, cancelButton);

        const messageEmbed = await message.channel.send({ embeds: [embed], components: [allButtons] });

        const collector = getCollectionButton(messageEmbed, 30000);

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                confirmButton.setDisabled(true);
                cancelButton.setDisabled(true);
                messageEmbed.edit({ embeds: [embed.setColor('#3D3D3D')], components: [allButtons] });
            }
        });

        collector.on('collect', async (interaction) => {
            if (interaction.member.user.id !== mention.id) {
                await interaction.reply({ content: 'This button is not for you!', ephemeral: true });
                return;
            }

            if (interaction.customId === 'confirm_button') {
                try {
                    const partnerData = await getUser(mention.id);
                    const now = moment.tz('Asia/Phnom_Penh');
                    const dateOfStartRelationships = now.format('DD-MM-YYYY');
                    userData.relationship_partner_id = mention.id;
                    userData.date_of_start_relationship = dateOfStartRelationships;
                    partnerData.relationship_partner_id = user.id;
                    partnerData.date_of_start_relationship = dateOfStartRelationships;
                    await userData.save();
                    await partnerData.save();
                    messageEmbed.edit({ embeds: [SimpleEmbed(`💓💞❤️💘Congratulations, you are now a couple! 💖💝❣️💗\n**Husband**: <@${user.id}> ==> **Wife**: <@${mention.id}>`)], components: [] });
                } catch (error) {
                    console.error(`Error while updating relationship: ${error}`);
                }
            } else if (interaction.customId === 'cancel_button') {
                messageEmbed.edit({ embeds: [SimpleEmbed(`<@${mention.id}> has rejected. Sad!`)], components: [] });
            }
        });
    } else {
        return message.channel.send({ embeds: [SimpleEmbed(`<@${user.id}> Please mention your lover.`)] });
    }
}

async function sendProfileCard(message, user, userData, client) {
    const username = user.username;
    const aboutMe = userData.about_me;
    let relationshipStatus = "Single";

    if (userData.relationship_partner_id) {
        const partner = await client.users.fetch(userData.relationship_partner_id);
        relationshipStatus = partner.username;
    }

    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
    const canvas = createCanvas(480, 250);
    const ctx = canvas.getContext('2d');

    const backgroundImage = userData.relationship_partner_id ? gif.profile_background_with_relationship : gif.profile_background;
    const background = await loadImage(backgroundImage);
    ctx.drawImage(background, 0, 0, 480, 250);

    const avatar = await loadImage(avatarURL);
    ctx.drawImage(avatar, 20, 20, 100, 100);

    if (userData.relationship_partner_id) {
        const partner = await client.users.fetch(userData.relationship_partner_id);
        const partnerAvatar = await loadImage(partner.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(partnerAvatar, 360, 20, 100, 100);
        ctx.fillText(userData.date_of_start_relationship, 188, 245);
    }

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(username, 140, 50);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('About Me:', 140, 90);
    ctx.fillText(aboutMe, 140, 120);

    ctx.fillText('Relationship Status:', 140, 160);
    ctx.fillText(relationshipStatus, 140, 190);

    const buffer = canvas.toBuffer();
    const attachment = { files: [{ attachment: buffer, name: 'profile.png' }] };
    message.channel.send(attachment);
}

module.exports = Profile;
