const { Command } = require('../../structures');
const Users = require('../../schemas/user');

module.exports = class GuessNumber extends Command {
    constructor(client) {
        super(client, {
            name: 'guessnumber',
            description: {
                content: 'Guess the number game. Try to guess the number between 1 and 100.',
                examples: ['guessnumber'],
                usage: 'guessnumber',
            },
            category: 'games',
            aliases: ['gn'],
            cooldown: 10,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const guessNumberMessages = language.locales.get(language.defaultLocale)?.gameMessages?.guessNumberMessages;
        const congratulations = [emoji.congratulation, emoji.peachCongratulation, emoji.gomaCongratulation];
        client.utils.getUser(ctx.author.id).then(user => {
            const { coin } = user.balance;
            if (coin < 1000) {
                return ctx.sendMessage({
                    embeds: [
                        client.embed()
                            .setTitle(guessNumberMessages.insufficientBalance.title)
                            .setColor(color.danger)
                            .setDescription(`${guessNumberMessages.insufficientBalance.description} ${user.balance.coin} coins.`)
                    ]
                });
            }

            user.balance.coin -= 1000;
            user.save();

            const numberToGuess = Math.floor(Math.random() * 100) + 1;
            console.log(numberToGuess)
            let hearts = 3;
            let incorrectGuesses = 0;

            const embed = client.embed()
                .setColor(color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`# ${emoji.mainLeft} 𝐆𝐔𝐄𝐒𝐒 𝐓𝐇𝐄 𝐍𝐔𝐌𝐁𝐄𝐑! ${emoji.mainRight}\n${guessNumberMessages.description}`)
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            ctx.sendMessage({ embeds: [embed] });

            const filter = response => {
                const guess = parseInt(response.content);
                return !isNaN(guess) && guess >= 1 && guess <= 100 && response.author.id === ctx.author.id;
            };

            const collector = ctx.channel.createMessageCollector({ filter, time: 30000 });

            collector.on('collect', async response => {
                const guess = parseInt(response.content);
                if (guess === numberToGuess) {
                    const coinEarned = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
                    const xpEarned = Math.floor(Math.random() * 51) + 30;

                    user.balance.coin = coin + coinEarned;
                    user.profile.xp = xpEarned;

                    user.save().then(() => {
                        const resultEmbed = client.embed()
                            .setColor(color.success)
                            .setDescription(`# ${emoji.mainLeft} 𝐂𝐎𝐑𝐑𝐄𝐂𝐓 𝐀𝐍𝐒𝐖𝐄𝐑! ${emoji.mainRight}\n${guessNumberMessages.correct.description} ${client.utils.getRandomElement(congratulations)} !!!\nYou guessed the number correctly: **${numberToGuess}**.\nYou've earned ${client.utils.formatNumber(coinEarned)} ${emoji.coin} and ${xpEarned} XP.`)
                            .setFooter({
                                text: `${ctx.author.displayName}, your game is over`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        ctx.sendMessage({ embeds: [resultEmbed] });
                        collector.stop();
                    })
                } else {
                    hearts -= 1;
                    incorrectGuesses += 1;
                    let resultEmbed;

                    if (hearts > 0) {
                        let hint = '';
                        if (incorrectGuesses === 1) {
                            hint = guess < numberToGuess ? guessNumberMessages.hint.bigger : guessNumberMessages.hint.smaller;
                        } else if (incorrectGuesses === 2) {
                            const rangeSize = Math.floor(Math.random() * 16) + 5;
                            const minRange = Math.max(1, numberToGuess - rangeSize);
                            const maxRange = Math.min(100, numberToGuess + rangeSize);
                            hint = `${guessNumberMessages.hint.range} **${minRange}** and **${maxRange}**.`;
                        }

                        resultEmbed = client.embed()
                            .setColor(color.danger)
                            .setDescription(`# ${emoji.mainLeft} 𝐖𝐑𝐎𝐍𝐆 𝐀𝐍𝐒𝐖𝐄𝐑! ${emoji.mainRight}\n${guessNumberMessages.incorrect.description} **${hearts}** hearts left. ${hint}`)
                            .setFooter({
                                text: `Reply to ${ctx.author.displayName}`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        await ctx.sendMessage({ embeds: [resultEmbed] });
                    } else {
                        resultEmbed = client.embed()
                            .setTitle(`${emoji.mainLeft} 𝐆𝐀𝐌𝐄 𝐎𝐕𝐄𝐑! ${emoji.mainRight}`)
                            .setColor(color.danger)
                            .setDescription(`${guessNumberMessages.gameOver.description} **${numberToGuess}**.`)
                            .setFooter({
                                text: `${ctx.author.displayName}, your game is over`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        await ctx.sendMessage({ embeds: [resultEmbed] });
                        collector.stop();
                    }
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = client.embed()
                        .setTitle(`${emoji.mainLeft} 𝐓𝐈𝐌𝐄 𝐈𝐒 𝐔𝐏! ${emoji.mainRight}`)
                        .setColor(color.warning)
                        .setDescription(guessNumberMessages.timeout.description)
                        .setFooter({
                            text: `${ctx.author.displayName}, please start again`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    ctx.sendMessage({ embeds: [timeoutEmbed] });
                }
            });
        })
    }
};
