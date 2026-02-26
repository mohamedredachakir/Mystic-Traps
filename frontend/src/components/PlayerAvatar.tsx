import React from 'react'

interface PlayerAvatarProps {
    username: string;
    isTurn: boolean;
    trapPoints: number;
    cardCount: number;
    eliminated?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ username, isTurn, trapPoints, cardCount, eliminated = false }) => {
    return (
        <div className={`flex flex-col items-center p-4 transition-all ${eliminated ? 'grayscale opacity-40' : (isTurn ? 'scale-110' : 'opacity-80')}`}>
            <div className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center mb-2 overflow-hidden ${eliminated ? 'border-red-900' : (isTurn ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'border-stone-700')
                } bg-stone-800`}>
                <span className="text-3xl font-bold text-amber-100">{eliminated ? '💀' : username[0].toUpperCase()}</span>
                {isTurn && !eliminated && (
                    <div className="absolute inset-0 border-4 border-amber-500/30 animate-pulse rounded-full" />
                )}
            </div>
            <div className="text-center">
                <h3 className={`font-bold text-lg ${eliminated ? 'text-red-500 line-through' : 'text-white'}`}>{username}</h3>
                <div className="flex gap-2 justify-center mt-1">
                    {!eliminated && (
                        <>
                            <span className="px-2 py-0.5 bg-stone-800 rounded text-xs border border-stone-700 text-stone-300">
                                🎴 {cardCount}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs border ${trapPoints > THRESHOLD * 0.75 ? 'bg-red-900/40 border-red-700 text-red-200' : 'bg-stone-800 border-stone-700 text-amber-400'
                                }`}>
                                ⚠️ {trapPoints}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const THRESHOLD = 100;

export default PlayerAvatar
