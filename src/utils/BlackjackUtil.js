const cardsf = [
    '<:flipcard:1285273700941299842>',

    '<a:asf:1285239867235897397>',
    '<a:2sf:1285239558606160024>',
    '<a:3sf:1285239586687029328>',
    '<a:4sf:1285239608342478930>',
    '<a:5sf:1285239646724427899>',
    '<a:6sf:1285239669197504575>',
    '<a:7sf:1285239754710978591>',
    '<a:8sf:1285239777246969917>',
    '<a:9sf:1285239806208770078>',
    '<a:10sf:1285239833719214130>',
    '<a:jsf:1285239902794944593>',
    '<a:qsf:1285239936349634620>',
    '<a:ksf:1285239922940317799>',

    '<a:acf:1285238453763571776>',
    '<a:2cf:1285238197793722368>',
    '<a:3cf:1285238224683532340>',
    '<a:4cf:1285238257885515818>',
    '<a:5cf:1285238280467648579>',
    '<a:6cf:1285238295915397130>',
    '<a:7cf:1285238317188644916>',
    '<a:8cf:1285238357290516521>',
    '<a:9cf:1285238376177340498>',
    '<a:10cf:1285238404782620753>',
    '<a:jcf:1285238501620584581>',
    '<a:qcf:1285238544968716383>',
    '<a:kcf:1285238524316221452>',

    '<a:ahf:1285239418697023538>',
    '<a:2hf:1285238915455913984>',
    '<a:3hf:1285238953229684736>',
    '<a:4hf:1285239188198920202>',
    '<a:5hf:1285239230297018418>',
    '<a:6hf:1285239264514150420>',
    '<a:7hf:1285239287901847552>',
    '<a:8hf:1285239312388194345>',
    '<a:9hf:1285239349772025988>',
    '<a:10hf:1285239379245269022>',
    '<a:jhf:1285239447000191139>',
    '<a:qhf:1285239515656491110>',
    '<a:khf:1285239475634700421>',

    '<a:adf:1285238804399263786>',
    '<a:2df:1285238576367403152>',
    '<a:3df:1285238598718980116>',
    '<a:4df:1285238621267562587>',
    '<a:5df:1285238653068644392>',
    '<a:6df:1285238693212196940>',
    '<a:7df:1285238711352688680>',
    '<a:8df:1285238732747833397>',
    '<a:9df:1285238750045147198>',
    '<a:10df:1285238775114367117>',
    '<a:jdf:1285238831758708746>',
    '<a:qdf:1285238882098741269>',
    '<a:kdf:1285238859369549824>',
];
const config = require('../config');
const random = require('random-number-csprng');
const gif = require("./Gif");

exports.randCard = randCard;
async function randCard(deck, type) {
    let card = deck.splice(await random(0, deck.length - 1), 1)[0];
    return { card: card, type: type };
}

exports.initDeck = initDeck;
function initDeck(deck, player, dealer) {
    for (let i = 0; i < player.length; i++) deck.splice(deck.indexOf(player[i].card), 1);
    for (let i = 0; i < dealer.length; i++) deck.splice(deck.indexOf(dealer[i].card), 1);
    return deck;
}

exports.generateEmbed = generateEmbed;
function generateEmbed(author, client, dealer, player, bet, end, winnings) {
    const thumbnailWin = [
        gif.moneyThrowing,
        gif.moneyCrypto,
        gif.printMoney,
        gif.richPudgy,
        gif.throwingMoney
    ];
    const thumbnailLose = [
        gif.bunnyAngry,
        gif.peachAngry,
        gif.phoneAngry,
        gif.catAngry,
        gif.yierAngry,
        gif.tigerAngry
    ];
    let color = config.color.main;
    let thumbnail = author.displayAvatarURL({ dynamic: true, size: 1024 });
    let description = '';
    let dealerValue = cardValue(dealer);
    let playerValue = cardValue(player);

    if (end === 'w') {
        color = config.color.primary;
        thumbnail = client.utils.getRandomElement(thumbnailWin);
        description = `**\nYou won \`${client.utils.formatNumber(winnings)}\` ${client.emoji.coin}**`;
    } else if (end === 'l') {
        color = config.color.danger;
        thumbnail = client.utils.getRandomElement(thumbnailLose);
        description = `**\nYou lost \`${client.utils.formatNumber(bet)}\` ${client.emoji.coin}**`;
    } else if (end === 'tb') {
        color = config.color.tied;
        thumbnail = author.displayAvatarURL({ dynamic: true, size: 1024 });
        description = '**\nYou both bust!**';
    } else if (end === 't') {
        color = config.color.tied;
        thumbnail = author.displayAvatarURL({ dynamic: true, size: 1024 });
        description = '**\nYou tied!**';
    } else dealerValue.points = dealerValue.shownPoints + '+?';

    return {
        color: color,
        description: `### ${client.emoji.main} 𝐌𝐀𝐆𝐈𝐂 𝐁𝐋𝐀𝐂𝐊𝐉𝐀𝐂𝐊 ${client.emoji.main}\n` +
            `The winner is the one who's closest to 21.\n` +
            `**DEALER \`[${dealerValue.points}]\`**\n` +
            `# \n${dealerValue.display}\n` +
            `**\n${author.displayName} \`[${playerValue.points}]${playerValue.ace ? '*' : ''}\`**\n` +
            `# ${playerValue.display}\n` +
            `${description}`,
        thumbnail: {
            url: thumbnail,
        },
        footer: {
            text: !!end ? 'Game Over' : 'Game in progress',
        },
    };
}

exports.cardValue = cardValue;
function cardValue(deck) {
    let text = '';
    let points = 0;
    let unhiddenPoints = 0;
    let aces = 0;
    for (let i = 0; i < deck.length; i++) {
        let value = deck[i].card % 13;

        if (deck[i].type == 'f') text += cardsf[deck[i].card] + ' ';
        else if (deck[i].type == 'c') text += cardsf[deck[i].card] + ' ';
        else text += cardsf[0] + ' ';

        if (value >= 10 || value == 0) {
            points += 10;
            if (deck[i].type == 'f' || deck[i].type == 'c') unhiddenPoints += 10;
        } else if (value > 1) {
            points += value;
            if (deck[i].type == 'f' || deck[i].type == 'c') unhiddenPoints += value;
        } else {
            if (deck[i].type == 'f' || deck[i].type == 'c') unhiddenPoints++;
            points++;
            aces++;
        }
    }

    let usedAces = 0;
    for (let i = 0; i < aces; i++) {
        points += 10;
        if (points > 21) {
            usedAces++;
            points -= 10;
        }
    }

    let ace = false;
    if (aces > 0 && usedAces < aces) ace = true;

    return {
        display: text,
        points: points,
        shownPoints: unhiddenPoints,
        ace: ace,
    };
}

