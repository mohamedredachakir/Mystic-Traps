import React from 'react'

interface CardProps {
    card: {
        type: string;
        points: number;
        ability: string | null;
    } | null;
    faceDown?: boolean;
    onClick?: () => void;
    className?: string;
}

const Card: React.FC<CardProps> = ({ card, faceDown = false, onClick, className = '' }) => {
    return (
        <div
            onClick={onClick}
            className={`relative w-24 h-36 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-amber-900/50 hover:shadow-2xl ${className} ${faceDown
                    ? 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border-stone-700'
                    : 'bg-stone-100 border-amber-600'
                }`}
        >
            {faceDown ? (
                <div className="absolute inset-0 flex items-center justify-center p-2">
                    <div className="w-full h-full border border-stone-700 rounded-lg flex items-center justify-center bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-900/10 to-transparent">
                        <div className="text-amber-600/20 text-4xl mt-[-8px]">✧</div>
                    </div>
                </div>
            ) : (
                <div className="p-2 h-full flex flex-col justify-between text-stone-900">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-lg">{card?.type === 'King Black' ? 'K' : card?.type === 'King White' ? 'K' : card?.type}</span>
                        <span className="text-xs font-serif italic text-stone-500">{card?.points}pts</span>
                    </div>

                    <div className="flex-grow flex items-center justify-center">
                        <div className="text-2xl text-amber-700">✦</div>
                    </div>

                    <div className="text-[10px] leading-tight text-center font-medium opacity-70">
                        {card?.ability?.replace('_', ' ').toUpperCase()}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Card
