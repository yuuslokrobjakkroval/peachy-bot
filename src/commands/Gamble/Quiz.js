const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

const questions = [
    {
        question: "តើទីក្រុងជាន់ខាងក្រោមមានអ្វី?",
        options: ["A. ភ្នំពេញ", "B. សៀមរាប", "C. បាត់ដំបង", "D. សិ​ហនូកវិល"],
        answer: "A"
    },
    {
        question: "តើប្រាសាទល្បីដែលនៅកម្ពុជា គេហៅថាអ្វី?",
        options: ["A. បូរ​បូដូរ", "B. អង្គរ​វត", "C. ពេត្រ", "D. ម៉ាជូភីចូ"],
        answer: "B"
    },
    {
        question: "ភាសាផ្លូវការនៃកម្ពុជាគឺជា​អ្វី?",
        options: ["A. ថៃ", "B. វៀតណាម", "C. ខ្មែរ", "D. លាវ"],
        answer: "C"
    },
    {
        question: "តើនត្រង់កម្ពុជា មានស្ទឹងអ្វី?",
        options: ["A. មេគង្គ", "B. យាងចេ", "C. កាំង", "D. ចៅភ្រៃយ៉ា"],
        answer: "A"
    },
    {
        question: "ប្រាក់សំរាប់ប្រើនៅកម្ពុជា គឺជា​អ្វី?",
        options: ["A. បាទ", "B. ដុង", "C. រៀល", "D. ភេស៊ូ"],
        answer: "C"
    },
    {
        question: "ព្រះមហាក្សត្រ​កម្ពុជា ដែលមានប្រសិទ្ធភាពក្នុងការកសាងអង្គរ​វត គឺជា​អ្នកណា?",
        options: ["A. ព្រះមហាក្សត្រ នរោត្តម", "B. ព្រះមហាក្សត្រ ជ័យវរ្ម័នទី៧", "C. ព្រះមហាក្សត្រ សីហនុ", "D. ព្រះមហាក្សត្រ អង្គដូង"],
        answer: "B"
    },
    {
        question: "ការលេងរាំប្រពៃណីកម្ពុជា មានឈ្មោះថា​អ្វី?",
        options: ["A. កាតាហ្វ", "B. អប្សរា", "C. ហ៊ូឡា", "D. ហ្លាមេនកូ"],
        answer: "B"
    },
    {
        question: "ឋានអប្សរាគំរូដែលនិយាយបញ្ចប់អោយបញ្ចប់រដូវសិល្បៈព្រះសម្ដេចប្រាំសិប មកឈ្មោះថា​អ្វី?",
        options: ["A. សារម្ភីពិធី", "B. បុណ្យភូមិ", "C. ពិធីទឹក", "D. បូនអំព័រ"],
        answer: "C"
    },
    {
        question: "សាសនាប្រពៃណីសំខាន់នៅកម្ពុជា គឺជា​អ្វី?",
        options: ["A. អ៊ីស្លាម", "B. គ្រីស្ទាន", "C. ព្រះពុទ្ធ", "D. ហិណ្ឌូ"],
        answer: "C"
    },
    {
        question: "តើទីក្រុងណាដែលមានល្បីពីទីផ្សារនិទាន និងប្រាសាទវីស្សិដ្ឋាន?",
        options: ["A. កំពត", "B. សៀមរាប", "C. ពោធិ៍ពែត", "D. ក្រាត"],
        answer: "B"
    },
    {
        question: "អ្វីជាការលេងសិល្បៈបតសឹកនៅកម្ពុជា?",
        options: ["A. បាតិច", "B. ឯកាត", "C. ហ្សាកការ", "D. ហុង"],
        answer: "B"
    },
    {
        question: "តើកម្ពុជាត្រូវបានដកស្រង់ជាលើកដំបូងនៃពិធីបុណ្យណាដែលមានឈ្មោះថា?",
        options: ["A. បុណ្យចូលឆ្នាំថ្មី", "B. បុណ្យភូមិ", "C. ពិធីទឹក", "D. បុណ្យសូរ"],
        answer: "A"
    },
    {
        question: "តើជាតិអភិវឌ្ឍន៍នៃភាសាអង់គ្លេសនៅកម្ពុជា គឺជា​អ្វី?",
        options: ["A. វិទ្យាសាស្ត្រ", "B. មនុស្សសាស្ត្រ", "C. សង្គមវិទ្យា", "D. សេដ្ឋកិច្ច"],
        answer: "D"
    },
    {
        question: "តើកម្ពុជាមានប្រទេសបណ្តាលកន្លែងណា?",
        options: ["A. ចិន", "B. ថៃ", "C. វៀតណាម", "D. ភីណេ"],
        answer: "B"
    }
];

class Quiz extends Command {
    constructor(client) {
        super(client, {
            name: "quiz",
            description: {
                content: "Bet on answering a quiz question correctly!",
                examples: ["quiz 1000 A"],
                usage: "QUIZ <amount> <answer>",
            },
            category: "gamble",
            aliases: ["quiz", "q"],
            cooldown: 1,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'amount',
                    description: 'The amount of money to bet',
                    type: 'INTEGER',
                    required: true,
                },
                {
                    name: 'answer',
                    description: 'Your answer choice',
                    type: 'STRING',
                    required: true,
                }
            ],
        });
    }

    async run(client, ctx, args) {
        let amount = parseInt(args[0]);
        let userAnswer = args[1].toUpperCase();

        if (isNaN(amount) || amount <= 0) {
            return ctx.sendMessage({ content: ", សូមបញ្ចូលចំនួនប្រាក់ត្រឹមត្រូវ។", ephemeral: true });
        }

        if (amount > maxBet) {
            amount = maxBet;
        }

        if (!['A', 'B', 'C', 'D'].includes(userAnswer)) {
            return ctx.sendMessage({ content: ", សូមបញ្ចូលចម្លើយត្រឹមត្រូវ៖ 'A', 'B', 'C', ឬ 'D'។", ephemeral: true });
        }

        const user = await Users.findOne({ userId: ctx.author.id });

        if (user.balance < amount) {
            return ctx.sendMessage({ content: '**🚫 | ' + ctx.author.globalName + "**, អ្នកមិនមានប្រាក់គ្រប់គ្រាន់ទេ!", ephemeral: true });
        }

        // Select a random question
        const question = questions[Math.floor(Math.random() * questions.length)];

        // Determine if the user's answer is correct
        let win = 0;
        let resultMsg = '';

        if (userAnswer === question.answer) {
            win = amount * 2; // Win if the answer is correct
            resultMsg = `ត្រឹមត្រូវ! ចម្លើយគឺជា ${question.answer}.`;
        } else {
            resultMsg = `មិនត្រឹមត្រូវទេ។ ចម្លើយគឺជា ${question.answer}.`;
        }

        // Update user balance
        await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });

        let resultMsgFull = `**${TITLE} 𝐐𝐔𝐈𝐙 ${TITLE}**\n` +
                            `**សំណួរ:** ${question.question}\n` +
                            `**ជម្រើស:**\n${question.options.join('\n')}\n` +
                            `**អ្នកបានដាក់ពិន័យ៖** \`${numeral(amount).format()}\` ${COIN}\n` +
                            `**ចម្លើយរបស់អ្នក៖** ${userAnswer}\n` +
                            `**${resultMsg}**\n` +
                            `**លទ្ធផល៖** ${win > 0 ? `អ្នកឈ្នះ \`${numeral(win).format()}\` ${COIN}!` : `អ្នកបាត់បង់ \`${numeral(amount).format()}\``}`;

        await ctx.sendMessage({ content: resultMsgFull });
    }
}

module.exports = Quiz;
