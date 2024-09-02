const levels = [];
let level = 1;
let send = 500000;
let receive = 1000000;

for (let i = 0; i < 99; i++) {
    levels.push({ level, send, receive });
    level++;
    send = Math.round(send * 0.5);
    receive = Math.round(receive * 0.75);
}

levels.push({ level: 100, send: 150000000, receive: 200000000 });

module.exports = levels;
