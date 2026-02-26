const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

const { createDeck, calculateTrapPoints, shuffle } = require('./gameLogic');

const THRESHOLD = 100;

function getNextTurnIdx(room) {
    let nextIdx = (room.turn + 1) % room.players.length;
    let attempts = 0;
    while (room.players[nextIdx].eliminated && attempts < room.players.length) {
        nextIdx = (nextIdx + 1) % room.players.length;
        attempts++;
    }
    return nextIdx;
}

// Game State (In-memory for MVP)
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomId, username }) => {
        socket.join(roomId);

        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                id: roomId,
                players: [],
                status: 'waiting',
                turn: 0,
                deck: [],
                discardPile: []
            });
        }

        const room = rooms.get(roomId);
        if (room.players.length < 6 && room.status === 'waiting') {
            room.players.push({
                id: socket.id,
                username,
                cards: [],
                trapPoints: 0,
                isReady: false,
                isBot: false
            });
            io.to(roomId).emit('room_update', room);
        } else {
            socket.emit('error', room.status !== 'waiting' ? 'Game already started' : 'Room is full');
        }
    });

    socket.on('add_bot', (roomId) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== 'waiting' || room.players.length >= 6) return;

        const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
        room.players.push({
            id: botId,
            username: `MysticBot_${room.players.length}`,
            cards: [],
            trapPoints: 0,
            isReady: true,
            isBot: true
        });

        io.to(roomId).emit('room_update', room);
    });

    socket.on('start_game', (roomId) => {
        const room = rooms.get(roomId);
        if (room && room.players.length >= 2) {
            room.status = 'playing';
            room.deck = createDeck();

            // Deal 4 cards to each player
            room.players.forEach(player => {
                player.cards = room.deck.splice(0, 4);
                player.trapPoints = calculateTrapPoints(player.cards);
            });

            room.discardPile.push(room.deck.pop());
            io.to(roomId).emit('game_started', room);
            io.to(roomId).emit('room_update', room);

            // Check if first player is bot
            checkAndTriggerBot(roomId);
        }
    });


    socket.on('draw_card', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== 'playing') return;

        const player = room.players[room.turn];
        if (player.id !== socket.id || player.currentDrawnCard) return;

        if (room.deck.length === 0) {
            const topDiscard = room.discardPile.pop();
            room.deck = shuffle([...room.discardPile]);
            room.discardPile = [topDiscard];
        }

        const card = room.deck.pop();
        player.currentDrawnCard = card;

        io.to(roomId).emit('room_update', room);
    });

    socket.on('discard_drawn', (roomId) => {
        const room = rooms.get(roomId);
        if (!room) return;
        const player = room.players[room.turn];
        if (player.id !== socket.id || !player.currentDrawnCard) return;

        room.discardPile.push(player.currentDrawnCard);
        player.currentDrawnCard = null;

        room.turn = getNextTurnIdx(room);
        io.to(roomId).emit('room_update', room);
        checkAndTriggerBot(roomId);
    });

    socket.on('swap_card', ({ roomId, cardIndex }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        const player = room.players[room.turn];
        if (player.id !== socket.id || !player.currentDrawnCard) return;

        const oldCard = player.cards[cardIndex];
        const newCard = player.currentDrawnCard;

        if (oldCard.points < newCard.points) {
            room.discardPile.push(newCard);
            player.currentDrawnCard = null;
        } else {
            player.cards[cardIndex] = newCard;
            room.discardPile.push(oldCard);
            player.currentDrawnCard = null;
        }

        player.trapPoints = calculateTrapPoints(player.cards);

        if (player.trapPoints >= THRESHOLD) {
            player.eliminated = true;
        }

        if (player.cards.length === 1 && !player.eliminated) {
            room.status = 'finished';
            room.winner = player.username;
        } else {
            room.turn = getNextTurnIdx(room);
        }

        io.to(roomId).emit('room_update', room);
    });

    socket.on('use_ability', ({ roomId, targetPlayerId, targetCardIndex }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        const player = room.players[room.turn];
        if (player.id !== socket.id || !player.currentDrawnCard || !player.currentDrawnCard.ability) return;

        const ability = player.currentDrawnCard.ability;
        const card = player.currentDrawnCard;

        // Simple placeholder for ability logic
        console.log(`Player ${player.username} using ability ${ability}`);

        // Discard the card after using ability
        room.discardPile.push(card);
        player.currentDrawnCard = null;

        // Ability logic (Basic implementation)
        if (ability === 'remove_1' || ability === 'remove_2') {
            // Remove cards from the current player
            const count = ability === 'remove_2' ? 2 : 1;
            for (let i = 0; i < count; i++) {
                if (player.cards.length > 1) {
                    player.cards.splice(0, 1);
                }
            }
        } else if (ability === 'add_card') {
            // Add a card to the next player (randomly pick a target or next player)
            const nextIdx = (room.turn + 1) % room.players.length;
            const target = room.players[nextIdx];
            if (room.deck.length > 0) {
                target.cards.push(room.deck.pop());
                target.trapPoints = calculateTrapPoints(target.cards);
            }
        } else if (ability === 'see_card') {
            // Reveal info to player (In a real game, this might be a temporary state)
            // For MVP, we'll send a private message/event
            socket.emit('ability_reveal', { type: 'info', message: 'You saw the truth.' });
        }

        player.trapPoints = calculateTrapPoints(player.cards);

        if (player.trapPoints >= THRESHOLD) {
            player.eliminated = true;
        }

        if (player.cards.length === 1 && !player.eliminated) {
            room.status = 'finished';
            room.winner = player.username;
        } else {
            room.turn = getNextTurnIdx(room);
        }

        io.to(roomId).emit('room_update', room);

        // Trigger bot turn if it's a bot
        checkAndTriggerBot(roomId);
    });

    const checkAndTriggerBot = (roomId) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== 'playing') return;

        const currentPlayer = room.players[room.turn];
        if (currentPlayer && currentPlayer.isBot) {
            setTimeout(() => handleBotTurn(roomId), 1500); // Thinking delay
        }
    };

    const handleBotTurn = (roomId) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== 'playing') return;

        const bot = room.players[room.turn];
        if (!bot || !bot.isBot) return;

        console.log(`Bot ${bot.username} is playing...`);

        // 1. Draw a card if not holding one
        if (!bot.currentDrawnCard) {
            if (room.deck.length === 0) {
                const topDiscard = room.discardPile.pop();
                room.deck = shuffle([...room.discardPile]);
                room.discardPile = [topDiscard];
            }
            bot.currentDrawnCard = room.deck.pop();
            io.to(roomId).emit('room_update', room);

            // Wait before next action
            setTimeout(() => handleBotTurn(roomId), 1000);
            return;
        }

        // 2. Decision logic
        const card = bot.currentDrawnCard;

        // BOTS use abilities if they have them? 
        // For now, always swap if it's a human card with points, or discard if it's high points

        if (card.ability && Math.random() > 0.3) {
            console.log(`Bot ${bot.username} uses ability ${card.ability}`);

            if (card.ability === 'remove_1' || card.ability === 'remove_2') {
                const count = card.ability === 'remove_2' ? 2 : 1;
                for (let i = 0; i < count; i++) {
                    if (bot.cards.length > 1) bot.cards.splice(0, 1);
                }
            } else if (card.ability === 'add_card') {
                const nextIdx = (room.turn + 1) % room.players.length;
                const target = room.players[nextIdx];
                if (room.deck.length > 0) {
                    target.cards.push(room.deck.pop());
                    target.trapPoints = calculateTrapPoints(target.cards);
                }
            }

            room.discardPile.push(card);
            bot.currentDrawnCard = null;
        } else {
            // Decide which hand card to swap (random check in mystery hand)
            const targetIdx = Math.floor(Math.random() * bot.cards.length);
            const oldCard = bot.cards[targetIdx];

            if (oldCard.points >= card.points) {
                // Success swap
                bot.cards[targetIdx] = card;
                room.discardPile.push(oldCard);
            } else {
                // Fail swap (discard drawn)
                room.discardPile.push(card);
            }
            bot.currentDrawnCard = null;
        }

        bot.trapPoints = calculateTrapPoints(bot.cards);

        if (bot.trapPoints >= THRESHOLD) {
            bot.eliminated = true;
        }

        if (bot.cards.length === 1 && !bot.eliminated) {
            room.status = 'finished';
            room.winner = bot.username;
        } else {
            room.turn = getNextTurnIdx(room);
        }

        io.to(roomId).emit('room_update', room);

        // Check if next player is also a bot
        checkAndTriggerBot(roomId);
    };

    socket.on('end_turn', (roomId) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players[room.turn];
        if (player.currentDrawnCard) return;

        room.turn = getNextTurnIdx(room);
        io.to(roomId).emit('room_update', room);
        checkAndTriggerBot(roomId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/health', (req, res) => {
    res.send('Server is running');
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
