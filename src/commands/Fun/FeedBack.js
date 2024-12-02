const Command = require('../../structures/Command.js');
const Feedbacks = require('../../schemas/feedBack.js');

module.exports = class Feedback extends Command {
    constructor(client) {
        super(client, {
            name: 'feedback',
            description: {
                content: 'Submit feedback about the bot or list all submitted feedback.',
                examples: ['feedback 5/10 not good', 'feedback list'],
                usage: 'feedback <rating/10> <feedback> | feedback list',
            },
            category: 'fun',
            aliases: ['suggestions', 'feedbacks', 'fbl'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'type',
                    type: 3,
                    description: 'view the feedback list.',
                    required: false,
                },
                {
                    name: 'feedback',
                    type: 3,
                    description: 'Your feedback or suggestion for the bot.',
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const feedbackMessages = language.locales.get(language.defaultLocale)?.informationMessages?.feedbackMessages;
        const type = ctx.options?.getString('type') || args[0]?.toLowerCase();

        if (type === 'list') {
            const feedbacks = await Feedbacks.find().sort({ timestamp: -1 });

            if (feedbacks.length === 0) {
                return client.utils.sendErrorMessage(client, ctx, 'No feedback available.', color, 60 * 60);
            }

            const feedbackList = feedbacks.map(fb => {
                return `**User**: <@${fb.userId}>\n**Rating**: ${fb.rating}/10\n**Feedback**: ${fb.feedback}`;
            });

            let chunks = client.utils.chunk(feedbackList, 10);
            if (chunks.length === 0) chunks = 1;

            const pages = [];
            for (let i = 0; i < chunks.length; i++) {
                const embed = client.embed()
                    .setColor(color.main)
                    .setTitle('All Feedbacks and Ratings')
                    .setDescription(chunks[i].join('\n\n'))
                    .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
                pages.push(embed);
            }

            return await client.utils.reactionPaginate(ctx, pages);
        } else {
            const userFeedback = ctx.options?.getString('feedback') || args.slice(1).join(' ');

            if (!userFeedback) {
                return client.utils.sendErrorMessage(client, ctx, feedbackMessages.noFeedbackProvided, color, 2 * 60 * 60);
            }

            const [ratingText, ...feedbackArray] = userFeedback.split(' ');
            const feedbackText = feedbackArray.join(' ');

            const ratingMatch = /^(\d{1,2})\/10$/.exec(ratingText);

            if (!ratingMatch) {
                return client.utils.sendErrorMessage(client, ctx, feedbackMessages.invalidRatingFormat, color, 2 * 60 * 60);
            }

            const rating = parseInt(ratingMatch[1], 10);

            if (rating < 1 || rating > 10) {
                return client.utils.sendErrorMessage(client, ctx, feedbackMessages.ratingOutOfBounds, color, 2 * 60 * 60);
            }

            const existingFeedback = await Feedbacks.findOne({ userId: ctx.author.id });
            if (existingFeedback) {
                existingFeedback.rating = rating;
                existingFeedback.feedback = feedbackText;
                await existingFeedback.save();
            } else {
                const newFeedback = new Feedbacks({
                    userId: ctx.author.id,
                    rating: rating,
                    feedback: feedbackText,
                });
                await newFeedback.save();
            }

            const embed = client.embed()
                .setColor(color.main)
                .setTitle(feedbackMessages.title)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', feedbackMessages.title)
                        .replace('%{mainRight}', emoji.mainRight) +
                    feedbackMessages.thankYou.replace('%{userName}', ctx.author.displayName)
                )
                .addFields([
                    { name: feedbackMessages.fields.rating, value: `${rating}/10`, inline: false },
                    { name: feedbackMessages.fields.feedback, value: feedbackText, inline: false },
                ])
                .setFooter({ text: feedbackMessages.footer });

            return ctx.sendMessage({ embeds: [embed] });
        }
    }
};
