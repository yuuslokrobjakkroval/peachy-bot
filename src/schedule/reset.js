const Users = require("../schemas/User");

function resetDailyTransfer() {
    console.log('func exec')
    Users.updateMany(
        { },
        {
           $set: { 'dailyLimits.lastReset': new Date(), 'dailyLimits.transferUsed': 0, 'dailyLimits.receiveUsed': 0 }
        }
    )
}
module.exports = { resetDailyTransfer }
