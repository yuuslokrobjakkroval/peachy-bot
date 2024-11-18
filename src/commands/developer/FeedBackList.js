const { Command } = require('../../structures/index.js');
const Feedback = require('../../schemas/feedback');  // Import the Feedback schema

module.exports = class FeedbackList extends Command {
    constructor(client) {
        super(client, {
            name: 'feedbacklist',
            description: {
                content: 'List all feedback and ratings submitted by users',
                examples: ['feedbacklist'],
                usage: 'feedbacklist',
            },
            category: 'developer',
            aliases: ['flist', 'fbl'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const feedbacks = await Feedback.find().sort({ timestamp: -1 }); // Sort by timestamp, most recent first

        if (feedbacks.length === 0) {
            return client.utils.sendErrorMessage(client, ctx, 'No feedback available.', color, 60 * 60);
        }

        // Format feedback for display
        const feedbackList = feedbacks.map(fb => {
            return `**User**: <@${fb.userId}>\n**Rating**: ${fb.rating}/10\n**Feedback**: ${fb.feedback}`;
        });

        // Split feedback into chunks (10 per page)
        let chunks = client.utils.chunk(feedbackList, 10);
        if (chunks.length === 0) chunks = 1;

        const pages = [];
        for (let i = 0; i < chunks.length; i++) {
            const embed = client.embed()
                .setColor(color.main)
                .setTitle('All Feedbacks and Ratings')
                .setDescription(chunks[i].join('\n\n'))  // Join the feedbacks with line breaks
                .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
            pages.push(embed);
        }
        return await client.utils.reactionPaginate(ctx, pages);
    }
};
