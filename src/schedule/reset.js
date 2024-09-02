const cron = require('node-cron')
const Users = require('../schemas/user.js');
const config = require('../config.js');
const { connect, connection } = require('mongoose');

async function connectMongodb() {
    if ([1, 2, 99].includes(connection.readyState)) return;
    await connect(config.database);
}

async function resetDailyTransfer() {
    console.log('func exec')
    try{
        connectMongodb();

        await Users.updateMany(
            { },
            {
                $set: { 'dailyLimits.lastReset': new Date(), 'dailyLimits.transferUsed': 0, 'dailyLimits.receiveUsed': 0 }
            }
        ).exec()
        console.log('END:: reset daily limit')
    } catch(e) {
        console.log('error: ', e)
    }
}

const resetDailyLimit = cron.schedule(process.env.SCHEDULE_RESET_DAILY_LIMIT, async () => {
    console.log('Cron job Reset Daily Transfer executed at:', new Date().toLocaleString());
    try{
        await resetDailyTransfer()

    } catch(e){
        console.log(e)
    }
})


async function resetDailyTasks() {
    console.log('func exec')
    try{
        connectMongodb();

        await Users.updateMany(
            { },
            {
                $set: { 'quest': [] }
            }
        ).exec()
        console.log('END:: reset daily task')
    } catch(e) {
        console.log('error: ', e)
    }
}

const resetDailyTask = cron.schedule(process.env.SCHEDULE_RESET_DAILY_TASK, async () => {
    console.log('Cron job Reset Daily Transfer executed at:', new Date().toLocaleString());
    try{
        await resetDailyTasks()
    } catch(e){
        console.log(e)
    }
})

module.exports = { resetDailyLimit, resetDailyTask };
