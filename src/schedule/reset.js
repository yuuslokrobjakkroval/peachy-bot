const Users = require("../schemas/user");

// Function to reset daily transfer limits
function resetDailyTransfer() {
    console.log('Resetting daily transfer limits...');
    Users.updateMany(
        {},
        {
            $set: { 'dailyLimits.lastReset': new Date(), 'dailyLimits.transferUsed': 0, 'dailyLimits.receiveUsed': 0 }
        }
    ).then(result => console.log(`Daily transfer limits reset for ${result.modifiedCount} users.`))
        .catch(err => console.error('Error resetting daily transfer limits:', err));
}

// Function to reset daily tasks
async function resetDailyTasks() {
    await Users.updateMany(
        {},
        { $set: { 'dailyTasks': [] } }
    );
}

module.exports = { resetDailyTransfer, resetDailyTasks };
