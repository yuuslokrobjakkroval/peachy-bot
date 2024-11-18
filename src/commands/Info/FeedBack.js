const Command = require('../../structures/Command.js');
const Feedbacks = require('../../schemas/feedback');  // Import the Feedback schema

module.exports = class Feedback extends Command {
    constructor(client) {
        super(client, {
            name: 'feedback',
            description: {
                content: 'Submit feedback about the bot with a rating.',
                examples: ['feedback 5/10 not good'],
                usage: 'feedback <rating/10> <feedback>',
            },
            category: 'info',
            aliases: ['suggestions', 'feedbacks'],
            cooldown: 5,
            args: true,  // Users must provide feedback
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'feedback',
                    type: 3,
                    description: 'Your feedback or suggestion for the bot.',
                    required: true,
                }
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const feedbackMessages = language.locales.get(language.defaultLocale)?.informationMessages?.feedbackMessages;

        // Get the feedback from the command args or the slash command input
        const userFeedback = args.join(' ') || ctx.options.getString('feedback');  // Slash command input or message argument

        if (!userFeedback) {
            return client.utils.sendErrorMessage(client, ctx, feedbackMessages.noFeedbackProvided, color, 2 * 60 * 60);
        }

        // Parse the rating and feedback from the user input
        const [ratingText, ...feedbackArray] = userFeedback.split(' '); // Separate the first part (rating) from the rest (feedback)
        const feedbackText = feedbackArray.join(' ');  // Join the remaining parts as the feedback message

        // Validate rating format (e.g., 5/10)
        const ratingMatch = /^(\d{1,2})\/10$/.exec(ratingText);  // Match ratings like 5/10, 9/10, etc.

        if (!ratingMatch) {
            return client.utils.sendErrorMessage(client, ctx, feedbackMessages.invalidRatingFormat, color, 2 * 60 * 60);
        }

        // Extract the numeric rating
        const rating = parseInt(ratingMatch[1], 10);  // Extract the number before "/10"

        // Ensure the rating is within valid bounds (1-10)
        if (rating < 1 || rating > 10) {
            return client.utils.sendErrorMessage(client, ctx, feedbackMessages.ratingOutOfBounds, color, 2 * 60 * 60);  // If the rating is out of bounds
        }

        // Check if the user has already provided feedback
        const existingFeedback = await Feedbacks.findOne({ userId: ctx.author.id });
        if (existingFeedback) {
            existingFeedback.rating = rating;
            existingFeedback.feedback = feedbackText;
            await existingFeedback.save()
        } else {
            const newFeedback = new Feedbacks({
                userId: ctx.author.id,
                rating: rating,
                feedback: feedbackText,
            });
            await newFeedback.save()

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
};
