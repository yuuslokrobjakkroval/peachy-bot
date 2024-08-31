const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/User.js');
const { peachTasks, transferTasks } = require('../../utils/TaskUtil.js');
const { assignTasks, completeTask } = require('../../functions/function.js');

module.exports = class Task extends Command {
    constructor(client) {
        super(client, {
            name: 'quest',
            description: {
                content: 'Manage and view tasks.',
                examples: ['quest', 'task'],
                usage: 'task\n task show\n task help',
            },
            category: 'task',
            aliases: ['quest', 'q', 'task', 't'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'show',
                    description: 'Show current tasks and progress',
                    type: 1, // SUB_COMMAND
                },
                {
                    name: 'help',
                    description: 'Show task command usage',
                    type: 1, // SUB_COMMAND
                },
                {
                    name: 'complete',
                    description: 'Complete a task',
                    type: 1, // SUB_COMMAND
                    options: [
                        {
                            name: 'task_id',
                            description: 'ID of the task to complete',
                            type: 3, // STRING
                            required: true,
                        },
                        {
                            name: 'type',
                            description: 'Type of the task (peach/transfer)',
                            type: 3, // STRING
                            required: true,
                        },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, language) {
        const subCommand = ctx.isInteraction ? ctx.interaction.options.getSubcommand() : args[0];

        if (subCommand === 'show') {
            // Handle 'show' sub-command
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user || !user.dailyTasks.length) {
                const embed = client.embed()
                    .setTitle('Your Tasks')
                    .setColor(client.color.main)
                    .setDescription('You have no tasks assigned.');
                return await ctx.sendMessage({ embeds: [embed] });
            }

            const embed = client.embed()
                .setTitle('Your Tasks')
                .setColor(client.color.main)
                .setDescription('Here are your current tasks.');

            user.dailyTasks.forEach(task => {
                const taskDetails = task.type === 'peach' ? peachTasks.find(t => t.id === task.id) : transferTasks.find(t => t.id === task.id);
                embed.addFields({
                    name: taskDetails.description,
                    value: `Progress: ${client.utils.formatNumber(task.progress)}/${client.utils.formatNumber(taskDetails.requiredAmount)}\nStatus: ${task.completed ? 'Completed' : 'Incomplete'}`,
                    inline: false,
                });
            });
            await ctx.sendMessage({ embeds: [embed] });
        } else if (subCommand === 'help') {
            // Handle 'help' sub-command
            const embed = client.embed()
                .setTitle('Task Command Help')
                .setDescription(
                    '`task` - Assign new tasks.\n' +
                    '`task show` - Show current tasks and progress.\n' +
                    '`task help` - Show this help message.\n' +
                    '`task complete <task_id> <type>` - Complete a task.'
                );
            await ctx.sendMessage({ embeds: [embed] });
        } else if (subCommand === 'complete') {
            // Handle 'complete' sub-command
            const taskId = ctx.isInteraction ? ctx.interaction.options.getString('task_id') : args[1];
            const type = ctx.isInteraction ? ctx.interaction.options.getString('type') : args[2];

            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                const embed = client.embed()
                    .setTitle('Error')
                    .setDescription('User not found.');
                return await ctx.sendMessage({ embeds: [embed] });
            }

            const embed = client.embed()
                .setTitle('Task Completed')
                .setDescription('Task completion processed. Use `task show` to check your updated tasks.');
            await ctx.sendMessage({ embeds: [embed] });
        } else {
            // Handle assigning tasks
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                const embed = client.embed()
                    .setTitle('Error')
                    .setColor(client.color.red)
                    .setDescription('User not found.');
                return await ctx.sendMessage({ embeds: [embed] });
            }

            // Assign tasks based on user's level
            if(user.dailyTasks.length === 0) {
                await assignTasks(user.userId);
                const embed = client.embed()
                    .setTitle('Tasks Assigned')
                    .setColor(client.color.main)
                    .setDescription('Tasks have been assigned to you. Use `task show` to view them.');
                await ctx.sendMessage({embeds: [embed]});
            } else {
                const embed = client.embed()
                    .setTitle(`Dear ${ctx.author.displayName}!!!`)
                    .setColor(client.color.main)
                    .setDescription('Tasks have been assigned to you already. Use `task show` to view them.');
                await ctx.sendMessage({embeds: [embed]});
            }
        }
    }
};
