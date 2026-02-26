import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import GameBoard from './components/GameBoard'

// Connect to backend
const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000')

function App() {
    const [roomId, setRoomId] = useState('')
    const [username, setUsername] = useState('')
    const [roomData, setRoomData] = useState<any>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        socket.on('room_update', (data) => {
            setRoomData(data)
        })

        socket.on('error', (msg) => {
            setError(msg)
            setTimeout(() => setError(''), 3000)
        })

        return () => {
            socket.off('room_update')
            socket.off('error')
        }
    }, [])

    const joinRoom = () => {
        if (roomId && username) {
            socket.emit('join_room', { roomId, username })
        }
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-serif">
            {/* Header */}
            <header className="p-6 flex justify-between items-center border-b border-stone-900 bg-stone-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-600 rounded-lg transform rotate-45 flex items-center justify-center shadow-lg shadow-amber-900/40">
                        <span className="text-white text-xl font-bold -rotate-45">M</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tighter text-amber-500 uppercase">Mystic Traps</h1>
                </div>

                {roomData && (
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-stone-500 uppercase tracking-widest text-[10px]">Room Code</span>
                        <span className="bg-stone-900 px-3 py-1 rounded border border-stone-800 font-mono text-amber-500">{roomData.id}</span>
                    </div>
                )}
            </header>

            <main className="flex-grow flex items-center justify-center p-6 relative">
                {/* Error Toast */}
                {error && (
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-[100] bg-red-900/90 border border-red-500 text-white px-6 py-2 rounded-full shadow-2xl animate-bounce">
                        {error}
                    </div>
                )}

                {!roomData ? (
                    <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                        <div className="bg-stone-900/50 p-8 rounded-[2rem] border border-stone-800 backdrop-blur-sm shadow-2xl">
                            <h2 className="text-3xl font-bold mb-2 text-center text-amber-100">Enter the Realms</h2>
                            <p className="text-stone-500 text-center mb-8 text-sm italic">"Only those who manage their fate shall prevail."</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1 ml-2">Mystic Name</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. ShadowCaster"
                                        className="w-full p-4 bg-stone-950/80 rounded-2xl border border-stone-800 outline-none focus:border-amber-600 transition-all font-sans"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1 ml-2">Realm Code</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. ROOM-123"
                                        className="w-full p-4 bg-stone-950/80 rounded-2xl border border-stone-800 outline-none focus:border-amber-600 transition-all font-sans"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={joinRoom}
                                    className="w-full py-4 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 rounded-2xl font-bold text-amber-100 transition-all shadow-xl shadow-amber-950/20 active:scale-95 uppercase tracking-widest"
                                >
                                    Summon Table
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-stone-900/30 rounded-2xl border border-stone-800/50">
                                <span className="block text-amber-600 font-bold text-xl mb-1">2-6</span>
                                <span className="text-stone-500 text-[10px] uppercase tracking-widest">Players</span>
                            </div>
                            <div className="p-4 bg-stone-900/30 rounded-2xl border border-stone-800/50">
                                <span className="block text-amber-600 font-bold text-xl mb-1">1</span>
                                <span className="text-stone-500 text-[10px] uppercase tracking-widest">Winner</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-6xl animate-in fade-in duration-700">
                        <GameBoard room={roomData} socket={socket} />
                    </div>
                )}
            </main>

            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-900/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-900/40 blur-[150px] rounded-full pointer-events-none" />
        </div>
    )
}

export default App
