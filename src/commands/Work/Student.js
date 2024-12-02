const { Command } = require('../../structures/index.js');
const chance = require('chance').Chance();
const moment = require('moment');
const questions = require('../../assets/json/khmerQuestions.json');
const globalEmoji = require('../../utils/Emoji');

module.exports = class StudentClaim extends Command {
    constructor(client) {
        super(client, {
            name: 'student',
            description: {
                content: 'Claim your student rewards by answering a quiz question. Can be claimed every 4 hours.',
                examples: ['student'],
                usage: 'student',
            },
            category: 'work',
            aliases: ['sclaim', 'studentclaim'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const studentMessages = language.locales.get(language.defaultLocale)?.workMessages?.studentMessages;

        try {
            // Fetch user data
            const user = await client.utils.getUser(ctx.author.id);
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const cooldownTime = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
            const isCooldownExpired = await client.utils.checkCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

            if (!isCooldownExpired) {
                // Handle cooldown
                const lastCooldownTimestamp = await client.utils.getCooldown(ctx.author.id, this.name.toLowerCase());
                const remainingTime = Math.ceil((lastCooldownTimestamp + cooldownTime - Date.now()) / 1000);
                const duration = moment.duration(remainingTime, 'seconds');
                const hours = Math.floor(duration.asHours());
                const minutes = Math.floor(duration.asMinutes() % 60);
                const seconds = Math.floor(duration.asSeconds() % 60);

                const cooldownMessage = studentMessages.cooldown
                    .replace('%{hours}', hours)
                    .replace('%{minutes}', minutes)
                    .replace('%{seconds}', seconds);

                const cooldownEmbed = client.embed()
                    .setColor(color.danger)
                    .setDescription(cooldownMessage);

                return ctx.sendMessage({ embeds: [cooldownEmbed] });
            }

            // Prompt a random quiz question
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            const emojiOptions = [
                emoji.letter.a ? emoji.letter.a : globalEmoji.letter.a,
                emoji.letter.b ? emoji.letter.b : globalEmoji.letter.b,
                emoji.letter.c ? emoji.letter.c : globalEmoji.letter.c,
                emoji.letter.d ? emoji.letter.d : globalEmoji.letter.d
            ]
            const emojiMap = {
                'a': emojiOptions[0]?.name || emojiOptions[0],
                'b': emojiOptions[1]?.name || emojiOptions[1],
                'c': emojiOptions[2]?.name || emojiOptions[2],
                'd': emojiOptions[3]?.name || emojiOptions[3],
            };

            const embed = client.embed()
                .setTitle(`𝐐𝐔𝐈𝐙 𝐓𝐈𝐌𝐄!`)
                .setColor(color.main)
                .setDescription(randomQuestion.question)
                .addFields(randomQuestion.options.map((option, index) => ({
                    name: `${emojiOptions[index]} Option ${index + 1}`,
                    value: option,
                    inline: false,
                })))
                .setFooter({ text: 'React with the corresponding emoji for your answer.' });

            const message = await ctx.sendMessage({ embeds: [embed] });

            // React with options
            for (const emoji of emojiOptions) {
                await message.react(emoji);
            }

            // Collect user response
            const filter = (reaction, user) => {
                const reactionEmoji = reaction.emoji.toString();
                const validReactions = Object.values(emojiMap);
                return validReactions.includes(reactionEmoji) && user.id === ctx.author.id;
            };

            const collector = message.createReactionCollector({ filter, time: 15000, max: 1 });

            collector.on('collect', async (reaction) => {
                const reactionEmoji = reaction.emoji.toString();
                const answerIndex = Object.keys(emojiMap).findIndex(key => emojiMap[key] === reactionEmoji);
                const selectedAnswer = randomQuestion.options[answerIndex];
                const correctAnswer = randomQuestion.answer;

                if (selectedAnswer === correctAnswer) {
                    // Award coins and XP for correct answer
                    const baseCoins = chance.integer({ min: 5000, max: 10000 });
                    const baseExp = chance.integer({ min: 30, max: 40 });

                    user.balance.coin += baseCoins;
                    user.profile.xp += baseExp;
                    await user.save();

                    // Update cooldown
                    await client.utils.updateCooldown(ctx.author.id, this.name.toLowerCase(), cooldownTime);

                    const successEmbed = client.embed()
                        .setTitle(`𝐂𝐎𝐑𝐑𝐄𝐂𝐓 𝐀𝐍𝐒𝐖𝐄𝐑!`)
                        .setColor(color.main)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', "𝐒𝐓𝐔𝐃𝐄𝐍𝐓 𝐂𝐋𝐀𝐈𝐌")
                                .replace('%{mainRight}', emoji.mainRight) +
                            studentMessages.success
                                .replace('%{coinEmote}', emoji.coin)
                                .replace('%{coin}', client.utils.formatNumber(baseCoins))
                                .replace('%{expEmote}', emoji.exp)
                                .replace('%{exp}', client.utils.formatNumber(baseExp))
                        )
                        .setFooter({ text: `Requested by ${ctx.author.displayName}`, iconURL: ctx.author.displayAvatarURL() });

                    return ctx.sendMessage({ embeds: [successEmbed] });
                } else {
                    // Inform user they got the answer wrong
                    const wrongEmbed = client.embed()
                        .setTitle(`𝐖𝐑𝐎𝐍𝐆 𝐀𝐍𝐒𝐖𝐄𝐑!`)
                        .setColor(color.danger)
                        .setDescription(`❌ Sorry, that's not correct. The correct answer was: **${correctAnswer}**.\nYou earned no rewards.`);

                    return ctx.sendMessage({ embeds: [wrongEmbed] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = client.embed()
                        .setTitle(`𝐓𝐈𝐌𝐄 𝐈𝐒 𝐔𝐏!`)
                        .setColor(color.warning)
                        .setDescription('⏳ Time is up! No answer was provided. Better luck next time.');

                    return ctx.sendMessage({ embeds: [timeoutEmbed] });
                }
            });
        } catch (error) {
            console.error('Error processing Student Claim command:', error);
            return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        }
    }
};
