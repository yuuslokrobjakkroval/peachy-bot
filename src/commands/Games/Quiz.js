const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const questions = require('../../assets/json/khmerQuestions.json');

module.exports = class Quiz extends Command {
    constructor(client) {
        super(client, {
            name: 'quiz',
            description: {
                content: 'Play a trivia/quiz game.',
                examples: ['quiz'],
                usage: 'quiz',
            },
            category: 'games',
            aliases: ['q'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx) {
        const user = await Users.findOne({ userId: ctx.author.id });
        if (user.balance.coin < 1000) {
            return ctx.sendMessage({
                embeds: [
                    client.embed()
                        .setTitle('Insufficient Balance')
                        .setColor(client.color.red)
                        .setDescription(`You need at least 1000 coins to play the Quiz game. Your current balance is ${user.balance.coin} coins.`)
                ]
            });
        }

        user.balance.coin -= 1000;
        await user.save();

        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        const emojiOptions = [
            client.emoji.letter.a,
            client.emoji.letter.b,
            client.emoji.letter.c,
            client.emoji.letter.d
        ];
        const emojiMap = {
            'a': emojiOptions[0]?.name || emojiOptions[0],
            'b': emojiOptions[1]?.name || emojiOptions[1],
            'c': emojiOptions[2]?.name || emojiOptions[2],
            'd': emojiOptions[3]?.name || emojiOptions[3],
        };

        const embed = client.embed()
            .setTitle(`${client.emoji.mainLeft} 𝐑𝐀𝐍𝐃𝐎𝐌 𝐐𝐔𝐄𝐒𝐓𝐈𝐎𝐍! ${client.emoji.mainRight}`)
            .setColor(client.color.main)
            .setDescription(randomQuestion.question)
            .addFields(randomQuestion.options.map((option, index) => ({
                name: `${emojiOptions[index]} Option ${index + 1}`,
                value: option,
                inline: false,
            })))
            .setFooter({ text: 'Please react with the corresponding emoji for your answer.' });

        const message = await ctx.sendMessage({ embeds: [embed] });

        await new Promise(resolve => setTimeout(resolve, 5000));

        for (const emoji of emojiOptions) {
            await message.react(emoji);
        }

        const filter = (reaction, user) => {
            const reactionEmoji = reaction.emoji.toString();
            const validReactions = Object.values(emojiMap);
            return validReactions.includes(reactionEmoji) && user.id === ctx.author.id;
        };

        const collector = message.createReactionCollector({ filter, time: 5000, max: 1 });

        collector.on('collect', async (reaction) => {
            const reactionEmoji = reaction.emoji.toString();
            const answerIndex = Object.keys(emojiMap).findIndex(key => emojiMap[key] === reactionEmoji);
            const selectedAnswer = randomQuestion.options[answerIndex];
            const correctAnswer = randomQuestion.answer;
            try {
                if (selectedAnswer === correctAnswer) {
                    await Users.updateOne(
                        { userId: ctx.author.id },
                        { $inc: { 'profile.xp': 30 } }
                    );
                    const correctEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐂𝐎𝐑𝐑𝐄𝐂𝐓 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                        .setColor(client.color.green)
                        .setDescription(`${client.emoji.congratulation} You got it right! The correct answer was: **${correctAnswer}**.\nYou've earned 30 XP.`);
                    ctx.editMessage({ embeds: [correctEmbed] });
                } else {
                    const wrongEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐖𝐑𝐎𝐍𝐆 𝐀𝐍𝐒𝐖𝐄𝐑! ${client.emoji.mainRight}`)
                        .setColor(client.color.red)
                        .setDescription(`❌ Sorry, that's not correct. The correct answer was: **${correctAnswer}**.`);
                    ctx.editMessage({ embeds: [wrongEmbed] });
                }
                await message.reactions.removeAll();
            } catch (error) {
                console.error('Failed to remove all reactions:', error);
            }
        });

        collector.on('end', async (collected) => {
            try {
                if (collected.size === 0) {
                    const timeoutEmbed = client.embed()
                        .setTitle(`${client.emoji.mainLeft} 𝐓𝐈𝐌𝐄 𝐈𝐒 𝐔𝐏! ${client.emoji.mainRight}`)
                        .setColor(client.color.orange)
                        .setDescription('⏳ Time is up! No answer was provided.');
                    ctx.editMessage({ embeds: [timeoutEmbed], components: [] });
                }
                await message.reactions.removeAll();
            } catch (error) {
                console.error('Failed to remove all reactions:', error);
            }
        });
    }
};