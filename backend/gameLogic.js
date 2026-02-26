const CARDS = [
    { type: 'King Black', points: 30, ability: 'trap_king' },
    { type: 'King White', points: 0, ability: 'healer' },
    { type: 'Ace Black', points: 10, ability: 'arrow_shadow' },
    { type: 'Ace White', points: 1, ability: 'arrow_light' },
    { type: 'Queen', points: 10, ability: 'see_card' },
    { type: 'Jack', points: 10, ability: 'switch_cards' },
    { type: '7 Solver', points: 0, ability: 'remove_1' },
    { type: '8 Solidarité', points: 0, ability: 'remove_2' },
    { type: '10 Toxic', points: 0, ability: 'add_card' },
    { type: '6 Dog', points: 0, ability: 'replace_card' },
    // Human cards 2-5, 9
    { type: '2', points: 2, ability: null },
    { type: '3', points: 3, ability: null },
    { type: '4', points: 4, ability: null },
    { type: '5', points: 5, ability: null },
    { type: '9', points: 9, ability: null },
];

function createDeck() {
    let deck = [];
    // For MVP, just use one of each card type, scaled to player count
    // In a real game, you'd have multiple copies like a Rami deck
    CARDS.forEach(cardBase => {
        // Add multiple copies of human cards or special cards
        const count = cardBase.ability ? 2 : 4;
        for (let i = 0; i < count; i++) {
            deck.push({ ...cardBase, id: Math.random().toString(36).substr(2, 9) });
        }
    });
    return shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function calculateTrapPoints(cards) {
    return cards.reduce((sum, card) => sum + (card.points || 0), 0);
}

module.exports = { createDeck, calculateTrapPoints, shuffle };
