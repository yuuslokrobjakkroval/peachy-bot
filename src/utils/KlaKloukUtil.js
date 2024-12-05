const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const kkEmoji = {
    lion: '<:KKLION:1314104873704230932>',
    angpav: '<:KKANGPAV:1314104882390896711>',
    tiger: '<:KKTIGER:1314104892272545822>',
    cow: '<:KKCOW:1314104900933648404>',
    crab: '<:KKCRAB:1314104909695680602>',
    trey: '<:KKFISH:1314104949067612220>',
    clear: '<:CLEAR:1314218233284395049>',
    cancel: '<:CANCEL:1314217717217234964>',
    start: '<a:START:1314216911734571111>',
}

const kkGif = {
    kda: 'https://i.imgur.com/9BYyire.png',
    ball: 'https://i.imgur.com/Es6GcJj.gif',
    secondBall: 'https://i.imgur.com/6uW6Qng.gif',
    thirdBall: 'https://i.imgur.com/IDI6x8f.gif',
    klok: 'https://i.imgur.com/4QHXX7H.gif'
}

const kkImage= {
    lion: 'https://i.imgur.com/fh16rxb.png', // tick
    angpav: 'https://i.imgur.com/h2eqBAU.png', // tick
    tiger: 'https://i.imgur.com/EaIw3tM.png', // tick
    cow: 'https://i.imgur.com/07gO3iy.png', // tick
    crab: 'https://i.imgur.com/Pi3Xjna.png',
    trey: 'https://i.imgur.com/dGzUdmn.png', // tick
}

exports.klakloukStarting = klakloukStarting;

async function klakloukStarting(client, ctx, color, emoji, user, userCoin, betCoin, generalMessages, klaKloukMessages, activeGames) {
    const startEmbed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', klaKloukMessages.title)
                    .replace('%{mainRight}', emoji.mainRight) +
                klaKloukMessages.startGame
                    .replace('%{betCoin}', client.utils.formatNumber(betCoin))
                    .replace('%{coinEmote}', emoji.coin)
            )
            .setImage(kkGif.kda)
            .setFooter({
                text: generalMessages.gameStart.replace('%{user}', ctx.author.displayName),
                iconURL: kkGif.ball
            });

        // Creating the buttons with initial SECONDARY style
        const b1 = client.utils.emojiButton('lion', kkEmoji.lion, 2);
        const b2 = client.utils.emojiButton('angpav', kkEmoji.angpav, 2);
        const b3 = client.utils.emojiButton('tiger', kkEmoji.tiger, 2);
        const b4 = client.utils.emojiButton('clear', kkEmoji.clear, 2);

        const b5 = client.utils.emojiButton('cow', kkEmoji.cow, 2);
        const b6 = client.utils.emojiButton('crab', kkEmoji.crab, 2);
        const b7 = client.utils.emojiButton('trey', kkEmoji.trey, 2);
        const b8 = client.utils.emojiButton('start', kkEmoji.start, 3);
        const b9 = client.utils.emojiButton('cancel', kkEmoji.cancel, 4);

        const firstRow = client.utils.createButtonRow(b1, b2, b3, b4);
        const secondRow = client.utils.createButtonRow(b5, b6, b7, b8, b9);

        const KK = client.utils.getRandomNumber(1, 6);
        const KK2 = client.utils.getRandomNumber(1, 6);
        const KK3 = client.utils.getRandomNumber(1, 6);

        let D1 = '';
        let D2 = '';
        let D3 = '';

        let P1 = '';
        let P2 = '';
        let P3 = '';

        let G1 = '';
        let G2 = '';
        let G3 = '';

        if (KK === 1) {
            D1 = kkImage.lion;
            P1 = kkEmoji.lion;
            G1 = 'lion';
        } else if (KK === 2) {
            D1 = kkImage.angpav;
            P1 = kkEmoji.angpav;
            G1 = 'angpav';
        } else if (KK === 3) {
            D1 = kkImage.tiger;
            P1 = kkEmoji.tiger;
            G1 = 'tiger';
        } else if (KK === 4) {
            D1 = kkImage.cow;
            P1 = kkEmoji.cow;
            G1 = 'cow';
        } else if (KK === 5) {
            D1 = kkImage.crab;
            P1 = kkEmoji.crab;
            G1 = 'crab';
        } else if (KK === 6) {
            D1 = kkImage.trey
            P1 = kkEmoji.trey
            G1 = 'trey';
        }

        if (KK2 === 1) {
            D2 = kkImage.lion;
            P2 = kkEmoji.lion;
            G2 = 'lion';
        } else if (KK2 === 2) {
            D2 = kkImage.angpav;
            P2 = kkEmoji.angpav;
            G2 = 'angpav';
        } else if (KK2 === 3) {
            D2 = kkImage.tiger;
            P2 = kkEmoji.tiger;
            G2 = 'tiger';
        } else if (KK2 === 4) {
            D2 = kkImage.cow;
            P2 = kkEmoji.cow;
            G2 = 'cow';
        } else if (KK2 === 5) {
            D2 = kkImage.crab;
            P2 = kkEmoji.crab;
            G2 = 'crab';
        } else if (KK2 === 6) {
            D2 = kkImage.trey
            P2 = kkEmoji.trey
            G2 = 'trey';
        }

        if (KK3 === 1) {
            D3 = kkImage.lion;
            P3 = kkEmoji.lion;
            G3 = 'lion';
        } else if (KK3 === 2) {
            D3 = kkImage.angpav;
            P3 = kkEmoji.angpav;
            G3 = 'angpav';
        } else if (KK3 === 3) {
            D3 = kkImage.tiger;
            P3 = kkEmoji.tiger;
            G3 = 'tiger';
        } else if (KK3 === 4) {
            D3 = kkImage.cow;
            P3 = kkEmoji.cow;
            G3 = 'cow';
        } else if (KK3 === 5) {
            D3 = kkImage.crab;
            P3 = kkEmoji.crab;
            G3 = 'crab';
        } else if (KK3 === 6) {
            D3 = kkImage.trey
            P3 = kkEmoji.trey
            G3 = 'trey';
        }

        const msg = await ctx.channel.send({embeds: [startEmbed], components: [firstRow, secondRow]});

        const collector = msg.createMessageComponentCollector({
            filter: async int => {
                if (int.user.id === ctx.author.id) return true;
                else {
                    await int.reply({
                        ephemeral: true,
                        content: `This button is controlled by **${ctx.author.displayName}**!`
                    });
                    return false;
                }
            },
            time: 60000,
        });

    let selectedButton = [];
    collector.on('collect', async int => {
        try {
            const buttonCost = betCoin;
            const maxSelectable = Math.floor(userCoin / buttonCost);
            if (int.customId !== 'cancel' && int.customId !== 'clear' && int.customId !== 'start') {
                const selected = [...firstRow.components, ...secondRow.components].find(b => b.data.custom_id === int.customId);
                if (!selectedButton.includes(int.customId)) {
                    if (selectedButton.length >= maxSelectable) {
                        return int.followUp({
                            content: klaKloukMessages.notEnoughCoins
                                .replace('%{coin}', client.utils.formatNumber(userCoin))
                                .replace('%{coinEmote}', emoji.coin)
                                .replace('%{needed}', client.utils.formatNumber((selectedButton.length + 1) * buttonCost))
                                .replace('%{coinEmote}', emoji.coin),
                            ephemeral: true,
                        });
                    }
                    selectedButton.push(int.customId);
                    selected.setStyle(1);
                } else {
                    selectedButton.splice(selectedButton.indexOf(int.customId), 1);
                    selected.setStyle(2);
                }
                await int.deferUpdate();
                msg.edit({components: [firstRow, secondRow]});
            } else if (int.customId === 'cancel') {
                selectedButton = [];
                activeGames.delete(ctx.author.id);
                msg.delete();
            } else if (int.customId === 'clear') {
                selectedButton = [];
                [...firstRow.components, ...secondRow.components].forEach(button => {
                    if (button.data.custom_id !== 'clear' && button.data.custom_id !== 'cancel' && button.data.custom_id !== 'start') {
                        button.setStyle(2);
                    }
                });
                await int.deferUpdate();
                msg.edit({components: [firstRow, secondRow]});
            }  else if (int.customId === 'start') {
                if (selectedButton.length === 0) {
                    return int.reply({content: klaKloukMessages.notSelected, ephemeral: true});
                } else {
                    const selectButtonEmojis = selectedButton.map(id => kkEmoji[id]).join(" \`|\` ");
                    const totalCoin = betCoin * selectedButton.length;
                    const progressEmbed = client.embed()
                        .setColor(color.main)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', klaKloukMessages.title)
                                .replace('%{mainRight}', emoji.mainRight) +
                            klaKloukMessages.selected
                                .replace('%{selectedButton}', selectButtonEmojis)
                                .replace('%{betCoin}', client.utils.formatNumber(betCoin))
                                .replace('%{coinEmote}', emoji.coin)
                                .replace('%{totalCoin}', client.utils.formatNumber(totalCoin))
                                .replace('%{coinEmote}', emoji.coin)
                        )
                        .setImage(kkGif.klok)
                        .setFooter({
                            text: generalMessages.gameInProgress.replace('%{user}', ctx.author.displayName),
                            iconURL: kkGif.ball
                        });

                    msg.edit({embeds: [progressEmbed], components: []});

                    await client.utils.getSleep(3000);
                    const canvas = createCanvas(384, 128);
                    const ctxCanvas = canvas.getContext('2d');
                    const [img1, img2, img3] = await Promise.all([loadImage(D1), loadImage(D2), loadImage(D3)]);
                    ctxCanvas.drawImage(img1, 0, 0, 128, 128);
                    ctxCanvas.drawImage(img2, 128, 0, 128, 128);
                    ctxCanvas.drawImage(img3, 256, 0, 128, 128);

                    const imageBuffer = canvas.toBuffer('image/png');
                    const attachment = new AttachmentBuilder(imageBuffer, {name: 'result.png'});

                    let winKK = 0;
                    if (selectedButton.includes(G1)) winKK += 1;
                    if (selectedButton.includes(G2)) winKK += 1;
                    if (selectedButton.includes(G3)) winKK += 1;

                    const totalBet = betCoin * selectedButton.length;
                    let winCash = 0;

                    if (winKK > 0) {
                        // Handle Win
                        if (selectedButton.length === 1) {
                            winCash = betCoin * winKK * 2;
                        } else if (selectedButton.length === 2) {
                            if (winKK === 1) {
                                winCash = totalBet;
                            } else {
                                winCash = betCoin * winKK;
                            }
                        } else {
                            winCash = betCoin * winKK;
                        }
                        userCoin += winCash - totalBet;
                        user.balance.coin = userCoin;
                        await user.save();

                        const embed = client.embed()
                            .setColor(color.success)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', klaKloukMessages.title)
                                    .replace('%{mainRight}', emoji.mainRight) +
                                `𝑫𝒆𝒂𝒍𝒆𝒓 𝑹𝒆𝒔𝒖𝒍𝒕\n` +
                                `## ${P1} \`|\` ${P2} \`|\` ${P3} \n` +
                                `\n\n${ctx.author.displayName} 𝑪𝒉𝒐𝒐𝒔𝒆\n` +
                                `## ${selectedButton.map(id => kkEmoji[id]).join(" \`|\` ")} \n` +
                                `\n\n𝑩𝒆𝒕 ***${client.utils.formatNumber(totalBet)}*** ${emoji.coin}\n` +
                                `𝑾𝒐𝒏 ***${client.utils.formatNumber(winCash)}*** ${emoji.coin}`
                            )
                            .setImage('attachment://result.png')
                            .setFooter({
                                text: `${generalMessages.gameOver.replace('%{user}', ctx.author.displayName)}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });
                        activeGames.delete(ctx.author.id);
                        await msg.edit({embeds: [embed], components: [], files: [attachment]});
                    } else {
                        // Handle Lose
                        userCoin -= totalBet;
                        user.balance.coin = userCoin;
                        await user.save();

                        const embed = client.embed()
                            .setColor(color.danger)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', klaKloukMessages.title)
                                    .replace('%{mainRight}', emoji.mainRight) +
                                `𝑫𝒆𝒂𝒍𝒆𝒓 𝑹𝒆𝒔𝒖𝒍𝒕\n` +
                                `## ${P1} \`|\` ${P2} \`|\` ${P3} \n` +
                                `\n\n${ctx.author.displayName} 𝑪𝒉𝒐𝒐𝒔𝒆\n` +
                                `## ${selectedButton.map(id => kkEmoji[id]).join(" \`|\` ")} \n` +
                                `\n\n𝑩𝒆𝒕 ***${client.utils.formatNumber(totalBet)}*** ${emoji.coin}\n` +
                                `𝑳𝒐𝒔𝒕 ***${client.utils.formatNumber(totalBet)}*** ${emoji.coin}`
                            )
                            .setImage('attachment://result.png')
                            .setFooter({
                                text: `${generalMessages.gameOver.replace('%{user}', ctx.author.displayName)}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        activeGames.delete(ctx.author.id);
                        await msg.edit({embeds: [embed], components: [], files: [attachment]});
                    }
                }
            }
        } catch (error) {
            console.error('Error processing interaction:', error);
        }
    });

    collector.on('end', async collected => {
        if (collected.size === 0) {
            activeGames.delete(ctx.author.id);
            const embed = client.embed()
                .setColor(color.warning)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', klaKloukMessages.title)
                        .replace('%{mainRight}', emoji.mainRight) +
                    `⏳ **Time is up** !!! You didn't click the button start in the game.`
                )
                .setFooter({
                    text: `${ctx.author.displayName}, ${generalMessages.pleaseStartAgain}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            msg.edit({embeds: [embed], components: []});
        }
    });
}
