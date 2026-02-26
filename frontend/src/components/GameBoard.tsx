import React from 'react'
import PlayerAvatar from './PlayerAvatar'
import Card from './Card'

interface GameBoardProps {
    room: any;
    socket: any;
}

const GameBoard: React.FC<GameBoardProps> = ({ room, socket }) => {
    const me = room.players.find((p: any) => p.id === socket.id);
    const otherPlayers = room.players.filter((p: any) => p.id !== socket.id);
    const isMyTurn = room.players[room.turn]?.id === socket.id;

    const [statusMsg, setStatusMsg] = React.useState('');

    React.useEffect(() => {
        const handleReveal = ({ message }: { message: string }) => {
            setStatusMsg(message);
            setTimeout(() => setStatusMsg(''), 3000);
        };

        socket.on('ability_reveal', handleReveal);
        socket.on('error', handleReveal); // Also show generic errors as status

        return () => {
            socket.off('ability_reveal', handleReveal);
            socket.off('error', handleReveal);
        };
    }, [socket]);

    const handleStartGame = () => {
        socket.emit('start_game', room.id);
    };

    const handleAddBot = () => {
        socket.emit('add_bot', room.id);
    };

    const handleDrawCard = () => {
        socket.emit('draw_card', { roomId: room.id });
    };

    const handleDiscardDrawn = () => {
        socket.emit('discard_drawn', room.id);
    };

    const handleSwapCard = (index: number) => {
        if (!me?.currentDrawnCard) return;
        socket.emit('swap_card', { roomId: room.id, cardIndex: index });
    };

    const handleUseAbility = () => {
        if (!me?.currentDrawnCard?.ability) return;
        socket.emit('use_ability', { roomId: room.id });
    };

    return (
        <div className="relative w-full h-[80vh] bg-stone-950 rounded-[4rem] border border-stone-800 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
            {statusMsg && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-[100] bg-amber-900/90 border border-amber-500 text-amber-100 px-8 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    {statusMsg}
                </div>
            )}
            {/* Table Surface */}
            <div className="absolute inset-[10%] rounded-[100%] bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800/50 shadow-2xl" />

            {/* Other Players */}
            <div className="absolute inset-0">
                {otherPlayers.map((player: any, index: number) => {
                    const angle = (index + 1) * (360 / (otherPlayers.length + 1));
                    const radius = 35;
                    const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180));
                    const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180));

                    return (
                        <div
                            key={player.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, top: `${y}%` }}
                        >
                            <PlayerAvatar
                                username={player.username}
                                isTurn={room.players[room.turn]?.id === player.id}
                                trapPoints={player.trapPoints}
                                cardCount={player.cards.length}
                                eliminated={player.eliminated}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Center Area (Deck & Discard & Drawn) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8 items-center">
                <div className="flex flex-col items-center">
                    <Card
                        card={null}
                        faceDown={true}
                        onClick={isMyTurn && !me?.currentDrawnCard ? handleDrawCard : undefined}
                        className={isMyTurn && !me?.currentDrawnCard ? 'hover:border-amber-500 scale-110 shadow-amber-900/20' : 'opacity-50'}
                    />
                    <span className="text-stone-500 text-[10px] uppercase tracking-widest mt-3">Deck</span>
                </div>

                {me?.currentDrawnCard && (
                    <div className="flex flex-col items-center animate-in zoom-in fade-in duration-300">
                        <Card card={me.currentDrawnCard} className="border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-125" />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleDiscardDrawn}
                                className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-[10px] font-bold uppercase"
                            >
                                Discard
                            </button>
                            {me.currentDrawnCard.ability && (
                                <button
                                    onClick={handleUseAbility}
                                    className="px-3 py-1 bg-amber-900/20 hover:bg-amber-900/40 text-amber-400 border border-amber-900/50 rounded-lg text-[10px] font-bold uppercase"
                                >
                                    Ability
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {room.discardPile.length > 0 && (
                    <div className="flex flex-col items-center">
                        <Card card={room.discardPile[room.discardPile.length - 1]} className="opacity-80 scale-90" />
                        <span className="text-stone-500 text-[10px] uppercase tracking-widest mt-3">Discard</span>
                    </div>
                )}

                {room.status === 'waiting' && me && (
                    <div className="absolute -bottom-40 flex flex-col items-center gap-4">
                        {room.players.length >= 2 && (
                            <button
                                onClick={handleStartGame}
                                className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-2xl transition-all animate-pulse uppercase tracking-widest text-sm"
                            >
                                Begin the Ritual
                            </button>
                        )}
                        {room.players.length < 6 && (
                            <button
                                onClick={handleAddBot}
                                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700 rounded-xl text-xs uppercase tracking-widest transition-all"
                            >
                                + Summon Bot
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* My Area (Bottom) */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4">
                <div className="flex flex-col items-center">
                    <div className="flex gap-[-1rem] justify-center mb-10">
                        {me?.cards.map((card: any, idx: number) => (
                            <div
                                key={card.id || idx}
                                className={`transition-transform duration-300 ${me?.currentDrawnCard ? 'hover:-translate-y-8 cursor-pointer' : ''}`}
                                style={{ marginLeft: idx === 0 ? 0 : '-1.5rem' }}
                                onClick={() => handleSwapCard(idx)}
                            >
                                {/* Hand cards are face down according to fixandcheck */}
                                <Card card={card} faceDown={true} className={me?.currentDrawnCard ? 'border-amber-900/50 hover:border-amber-500' : ''} />
                            </div>
                        ))}
                    </div>

                    <PlayerAvatar
                        username={me?.username || 'You'}
                        isTurn={isMyTurn}
                        trapPoints={me?.trapPoints || 0}
                        cardCount={me?.cards.length || 0}
                        eliminated={me?.eliminated}
                    />
                </div>
            </div>

            {/* Status Bar */}
            <div className="absolute top-8 left-8 flex flex-col gap-1">
                <div className="text-amber-600 text-[10px] font-serif italic tracking-widest uppercase">Mystic Table</div>
                <div className="text-stone-400 text-sm font-serif">
                    {room.status === 'playing' ? (
                        <>Current Seer: <span className="text-amber-200">{room.players[room.turn]?.username === me?.username ? 'You' : room.players[room.turn]?.username}</span></>
                    ) : room.status === 'finished' ? (
                        <>Winner: <span className="text-amber-500 font-bold">{room.winner}</span></>
                    ) : 'Waiting for Seekers...'}
                </div>
            </div>
        </div>
    )
}

export default GameBoard
