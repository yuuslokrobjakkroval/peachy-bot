const cardsf = [
    '<:BACKSF:1281843966266048583>',
    // '<:BACKCF:1281843924062703679>',
    // '<:BACKHF:1281843958846328842>',
    // '<:BACKDF:1281843932430471169>',

    '<a:asf:1281795959122165760>',
    '<a:2sf:1281795969632960552>',
    '<a:3sf:1281795977317187625>',
    '<a:4sf:1281796867520462849>',
    '<a:5sf:1281796875850088488>',
    '<a:6sf:1281796885824278549>',
    '<a:7sf:1281796893755838494>',
    '<a:8sf:1281796905336311808>',
    '<a:9sf:1281796911090630717>',
    '<a:10sf:1281796919626170368>',
    '<a:jsf:1281796927700205589>',
    '<a:qsf:1281796935434371102>',
    '<a:ksf:1281796944141746247>',

    '<a:acf:1281795702200078378>',
    '<a:2cf:1281795708424421416>',
    '<a:3cf:1281795719472349237>',
    '<a:4cf:1281795725516079166>',
    '<a:5cf:1281795736945819770>',
    '<a:6cf:1281795743098736690>',
    '<a:7cf:1281795745732890656>',
    '<a:8cf:1281795754897309736>',
    '<a:9cf:1281795760156971018>',
    '<a:10cf:1281795767719432222>',
    '<a:jcf:1281795774803345542>',
    '<a:qcf:1281795799390486528>',
    '<a:kcf:1281795809783840799>',

    '<a:ahf:1281796992086835222>',
    '<a:2hf:1281797003403067463>',
    '<a:3hf:1281797009476681738>',
    '<a:4hf:1281797018871795754>',
    '<a:5hf:1281797029491773501>',
    '<a:6hf:1281797045148975104>',
    '<a:7hf:1281797093526081587>',
    '<a:8hf:1281797105056219167>',
    '<a:9hf:1281797114464305265>',
    '<a:10hf:1281797120419958784>',
    '<a:jhf:1281797127080775771>',
    '<a:qhf:1281797150304505896>',
    '<a:khf:1281797162870640680>',

    '<a:adf:1281795831401287681>',
    '<a:2df:1281795838489788508>',
    '<a:3df:1281795846211633172>',
    '<a:4df:1281795850242097193>',
    '<a:5df:1281795862191669280>',
    '<a:6df:1281795871825989733>',
    '<a:7df:1281795880294416384>',
    '<a:8df:1281795890834837518>',
    '<a:9df:1281795895293116480>',
    '<a:10df:1281795903996432438>',
    '<a:jdf:1281795913269907597>',
    '<a:qdf:1281795921117708299>',
    '<a:kdf:1281795928159944899>',
];
const random = require('random-number-csprng');
const DEALER = '<:DEALERBLACKJACK:1283852034784886885>';
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
async function generateEmbed(author, client, color, emoji, dealer, player, bet, end, winnings) {
    let description = '';
    let endColor = '';
    let dealerValue = cardValue(dealer);
    let playerValue = cardValue(player);

    if (end == 'w') {
        endColor = color.success;
        description = `**You bet \`${client.utils.formatNumber(bet)}\` ${emoji.coin}**\n**You won \`${client.utils.formatNumber(winnings)}\` ${emoji.coin}**`;
    } else if (end == 'l') {
        endColor = color.danger;
        description = `**You bet \`${client.utils.formatNumber(bet)}\` ${emoji.coin}**\n**You lost \`${client.utils.formatNumber(bet)}\` ${emoji.coin}**`;
    } else if (end == 'tb') {
        endColor = color.blue;
        description = '**You both bust!**';
    } else if (end == 't') {
        endColor = color.blue;
        description = '**You tied!**';
    } else {
        endColor = color.main;
        dealerValue.points = dealerValue.shownPoints + '+?';
    }

    return {
        color: endColor,
        description: `# ${emoji.mainLeft} 𝐁𝐋𝐀𝐂𝐊𝐉𝐀𝐂𝐊 ${emoji.mainRight}\n` +
            `The winner is the one who's closest to 21.\n` +
            `## **DEALER ${DEALER} \`[${dealerValue.points}]\`**\n` +
            `# \n${dealerValue.display}\n` +
            `## **${author.displayName} \`[${playerValue.points}]${playerValue.ace ? '*' : ''}\`**\n` +
            `# ${playerValue.display}\n` +
            `${description}`,
        thumbnail: {
            url: author.displayAvatarURL({ dynamic: true, size: 1024 }),
        },
        footer: {
            text: !!end ? `${author.displayName}! your game is over.` : `${author.displayName}, your game is in progress!`,
            iconURL: author.displayAvatarURL(),
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

