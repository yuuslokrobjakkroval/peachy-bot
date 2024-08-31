// tasks.js

const peachTasks = [
    // Level 1
    {
        id: 'p01',
        description: 'Peach 3 times',
        coinReward: 5000,
        expReward: 200,
        requiredAmount: 3,
        requiredLevel: 1,
    },

    // Level 2
    {
        id: 'p02',
        description: 'Peach 5 times',
        coinReward: 5000,
        expReward: 300,
        requiredAmount: 5,
        requiredLevel: 2,
    },
];

const transferTasks = [
    // Level 1
    {
        id: 't01',
        description: 'Transfer 50,000',
        coinReward: 10000,
        expReward: 200,
        requiredAmount: 50000,
        requiredLevel: 1,
    },

    // Level 2
    {
        id: 't02',
        description: 'Transfer 70,000',
        coinReward: 30000,
        expReward: 300,
        requiredAmount: 70000,
        requiredLevel: 2,
    },
];

module.exports = { peachTasks, transferTasks};
