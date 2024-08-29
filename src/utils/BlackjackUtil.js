const cardsf = [
    '<:BLACKCARD:1276803581877424148>',
    '<a:asf:1276804042517123093>',
    '<a:2sf:1276804049202839552>',
    '<a:3sf:1276804057499041842>',
    '<a:4sf:1276804065019301978>',
    '<a:5sf:1276804072057602120>',
    '<a:6sf:1276804100457234443>',
    '<a:7sf:1276804108593922140>',
    '<a:8sf:1276804118043820077>',
    '<a:9sf:1276804130085670943>',
    '<a:10sf:1276804137182560296>',
    '<a:jsf:1276804146535862355>',
    '<a:qsf:1276804152726519808>',
    '<a:ksf:1276804159773081654>',

    '<a:acf:1276803891962314763>',
    '<a:2cf:1276803902934614086>',
    '<a:3cf:1276803910522372127>',
    '<a:4cf:1276803917996490782>',
    '<a:5cf:1276803925336657920>',
    '<a:6cf:1276803935088279693>',
    '<a:7cf:1276803941082075206>',
    '<a:8cf:1276803951907307560>',
    '<a:9cf:1276803961441226763>',
    '<a:10cf:1276803985130393610>',
    '<a:jcf:1276803996421586944>',
    '<a:qcf:1276804009461678153>',
    '<a:kcf:1276804016730542131>',

    '<a:ahf:1276803605516783616>',
    '<a:2hf:1276803618418331681>',
    '<a:3hf:1276803628442583040>',
    '<a:4hf:1276803640048357477>',
    '<a:5hf:1276803649904836720>',
    '<a:6hf:1276803657337409586>',
    '<a:7hf:1276803663611826237>',
    '<a:8hf:1276803668741718048>',
    '<a:9hf:1276803677268738129>',
    '<a:10hf:1276803687846772817>',
    '<a:jhf:1276803692196266054>',
    '<a:qhf:1276803715038445610>',
    '<a:khf:1276803738782269511>',

    '<a:adf:1276803780104683551>',
    '<a:2df:1276803791533899877>',
    '<a:3df:1276803797993390184>',
    '<a:4df:1276803805945528354>',
    '<a:5df:1276803811566157899>',
    '<a:6df:1276803818151084092>',
    '<a:7df:1276803822672674920>',
    '<a:8df:1276803832029904917>',
    '<a:9df:1276803837411459216>',
    '<a:10df:1276803842910191669>',
    '<a:jdf:1276803848014397501>',
    '<a:qdf:1276803861591494769>',
    '<a:kdf:1276803868314964081>',
];

const config = require('../config');
const random = require('random-number-csprng');

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
    let color = config.color.main;
    let footer = 'game in progress';
    let dealerValue = cardValue(dealer);
    let playerValue = cardValue(player);
    if (end == 'w') {
        color = 65280;
        footer = 'You won ' + winnings.toLocaleString() + ' coins!';
    } else if (end == 'l') {
        color = 16711680;
        footer = 'You lost ' + bet.toLocaleString() + ' coins!';
    } else if (end == 'tb') {
        color = 6381923;
        footer = 'You both bust!';
    } else if (end == 't') {
        color = 6381923;
        footer = 'You tied!';
    } else dealerValue.points = dealerValue.shownPoints + '+?';

    let embed = {
        title: '<a:Dom:1264200823542517812> 𝐁𝐋𝐀𝐂𝐊𝐉𝐀𝐂𝐊 <a:Dom:1264200823542517812>',
        color: color,
        description: "The winner is the one who's closest to 21.",
        fields: [
            {
                name: 'Dealer **`[' + dealerValue.points + ']`**',
                value: dealerValue.display,
                inline: true,
            },
            {
                name: author.displayName + ' **`[' + playerValue.points + ']' + (playerValue.ace ? '*' : '') + '`**',
                value: playerValue.display,
                inline: true,
            },
        ],
        footer: {
            text: footer,
            iconURL: client.utils.emojiToImage('<a:TRex49:1206171448666890250>'),
        },
    };

    return embed;
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

