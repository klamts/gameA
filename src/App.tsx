import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GamePhase, Player, Question, PlayerProgress, GameMode } from './types';
import Card from './components/Card';
import Button from './components/Button';
import UsersIcon from './components/icons/UsersIcon';
import TrophyIcon from './components/icons/TrophyIcon';
import LoadingSpinner from './components/LoadingSpinner';
import MicIcon from './components/icons/MicIcon';

// IMPORTANT: Replace this with your actual Render backend URL
const SERVER_URL = "https://audio-scramble-showdown-nodejs.onrender.com";
const socket: Socket = io(SERVER_URL);

const DEFAULT_QUESTIONS = JSON.stringify([
  "https://raw.githubusercontent.com/klamts/flashcard-library/main/decks/audio/flashcard_unit2/Antarctica.mp3",
  "https://raw.githubusercontent.com/klamts/flashcard-library/main/decks/audio/flashcard_unit2/a%20doctor.mp3",
  "https://raw.githubusercontent.com/klamts/flashcard-library/main/decks/audio/flashcard_unit2/watch%20movies.mp3"
], null, 2);

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- Sub-Components ---

interface HomePageProps {
    onCreateGame: (name: string, questions: Question[], gameMode: GameMode) => void;
    onJoinGame: (name: string, roomCode: string) => void;
    isCreating: boolean;
    isJoining: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onCreateGame, onJoinGame, isCreating, isJoining }) => {
    const [playerName, setPlayerName] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [questionsJson, setQuestionsJson] = useState(DEFAULT_QUESTIONS);
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.UNSCRAMBLE);
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (!playerName.trim()) {
            setError('Please enter your name.');
            return;
        }
        try {
            const parsedData = JSON.parse(questionsJson);
            
            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                throw new Error('Input must be a non-empty JSON array.');
            }

            let questions: Question[];

            if (typeof parsedData[0] === 'string') {
                questions = parsedData.map(url => {
                    const fileNameWithExt = url.split('/').pop() || '';
                    const decodedFileName = decodeURIComponent(fileNameWithExt);
                    const answer = decodedFileName.substring(0, decodedFileName.lastIndexOf('.')) || decodedFileName;
                    if (!answer) {
                      throw new Error(`Could not determine answer from URL: ${url}`);
                    }
                    return { audioUrl: url, answer: answer.toUpperCase() };
                });
            } else if (typeof parsedData[0] === 'object' && parsedData[0] !== null) {
                if (!parsedData.every(q => q && typeof q.audioUrl === 'string' && typeof q.answer === 'string')) {
                     throw new Error('Invalid format. For object lists, each object must have "audioUrl" and "answer" string properties.');
                }
                questions = parsedData.map(q => ({...q, answer: q.answer.toUpperCase()}));
            } else {
                throw new Error('Unsupported JSON format. Provide an array of URLs (strings) or an array of {audioUrl, answer} objects.');
            }
            
            if (questions.length === 0) {
               throw new Error('No valid questions could be processed.');
            }

            setError('');
            onCreateGame(playerName, questions, gameMode);

        } catch (e: any) {
            setError(e.message || 'Invalid JSON format for questions.');
        }
    };
    
    const handleJoin = () => {
        if (!playerName.trim() || !joinRoomCode.trim()) {
            setError('Please enter your name and a room code.');
            return;
        }
        setError('');
        onJoinGame(playerName, joinRoomCode.toUpperCase());
    };

    const gameModeOptions = [
        { id: GameMode.UNSCRAMBLE, label: 'Unscramble' },
        { id: GameMode.FILL_IN_ONE, label: 'Fill 1 Blank' },
        { id: GameMode.FILL_IN_TWO, label: 'Fill 2 Blanks' },
        { id: GameMode.FILL_IN_THREE, label: 'Fill 3 Blanks' },
        { id: GameMode.PRONUNCIATION, label: 'Pronunciation' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <Card>
                <h2 className="text-3xl font-bold text-cyan-400 mb-4 text-center">Create Game</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
                    <textarea placeholder="Paste a JSON array of audio URLs here..." value={questionsJson} onChange={e => setQuestionsJson(e.target.value)} rows={5} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono text-sm"></textarea>
                    
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Game Mode</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {gameModeOptions.map(option => (
                                <button key={option.id} onClick={() => setGameMode(option.id)} className={`px-3 py-2 text-sm rounded-lg transition-colors ${gameMode === option.id ? 'bg-cyan-500 text-gray-900 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
                        {isCreating ? <LoadingSpinner className="w-6 h-6 mx-auto" /> : 'Create Game'}
                    </Button>
                </div>
            </Card>
            <Card>
                <h2 className="text-3xl font-bold text-pink-400 mb-4 text-center">Join Game</h2>
                <div className="space-y-4">
                     <input type="text" placeholder="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"/>
                     <input type="text" placeholder="Room Code" value={joinRoomCode} onChange={e => setJoinRoomCode(e.target.value.toUpperCase())} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"/>
                     <Button onClick={handleJoin} className="w-full bg-pink-500 hover:bg-pink-400 focus:ring-pink-300" disabled={isJoining}>
                        {isJoining ? <LoadingSpinner className="w-6 h-6 mx-auto" /> : 'Join Game'}
                    </Button>
                </div>
            </Card>
            {error && <p className="text-red-400 md:col-span-2 text-center mt-4">{error}</p>}
        </div>
    );
};

interface LobbyPageProps {
    roomCode: string;
    players: Player[];
    isHost: boolean;
    onStartGame: () => void;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ roomCode, players, isHost, onStartGame }) => (
    <Card className="w-full max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-300">Room Code</h2>
        <p className="text-5xl font-mono tracking-widest text-cyan-400 my-4 bg-gray-800 rounded-lg py-2 break-all">{roomCode}</p>
        <div className="my-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2"><UsersIcon /> Players ({players.length})</h3>
            <ul className="space-y-2">
                {players.map(p => (
                    <li key={p.id} className="bg-gray-700/50 rounded-lg px-4 py-2 text-lg flex items-center justify-between">
                        <span>{p.name}</span>
                        {p.isHost && <span className="text-xs font-bold text-cyan-400 bg-cyan-900/50 px-2 py-1 rounded-full">HOST</span>}
                    </li>
                ))}
            </ul>
        </div>
        {isHost ? (
            <Button onClick={onStartGame} className="w-full" disabled={players.length < 1}>Start Game</Button>
        ) : (
            <p className="text-gray-400 animate-pulse">Waiting for host to start the game...</p>
        )}
    </Card>
);


interface GamePageProps {
    questions: Question[];
    player: Player;
    gameMode: GameMode;
    onGameFinish: (finishTime: number) => void;
}

type Puzzle = {
    display: (string | null)[];
    missingIndices: number[];
    correctChars: string[];
};

const SKIP_PENALTY = 30000; // 30 seconds
const HINT_PENALTY = 30000; // 30 seconds for pronunciation hint
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Web Speech API setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
}

const createPuzzle = (answer: string, mode: GameMode): Puzzle => {
    const answerChars = answer.split('');
    const validIndices = answerChars
        .map((char, i) => (char !== ' ' ? i : -1))
        .filter(i => i !== -1);

    let blanks = 0;
    if (mode === GameMode.FILL_IN_ONE) blanks = 1;
    if (mode === GameMode.FILL_IN_TWO) blanks = 2;
    if (mode === GameMode.FILL_IN_THREE) blanks = 3;

    const missingIndices = shuffleArray(validIndices).slice(0, blanks);
    missingIndices.sort((a,b) => a - b);

    const correctChars = missingIndices.map(i => answerChars[i]);
    const display = [...answerChars];
    missingIndices.forEach(i => display[i] = null);
    
    return { display, missingIndices, correctChars };
};

const GamePage: React.FC<GamePageProps> = ({ questions, player, gameMode, onGameFinish }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [startTime] = useState(Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [penalty, setPenalty] = useState(0);

    // Unscramble & Fill-in-blank state
    const [shuffledChars, setShuffledChars] = useState<string[]>([]);
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [choiceChars, setChoiceChars] = useState<string[]>([]);
    
    // Pronunciation mode state
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);

    const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 100);
        return () => clearInterval(interval);
    }, [startTime]);

    const setupQuestion = useCallback((question: Question) => {
        setCurrentAnswer('');
        setTranscript('');

        if (gameMode === GameMode.UNSCRAMBLE) {
            setShuffledChars(shuffleArray(question.answer.replace(/ /g, '').split('')));
        } else if (gameMode === GameMode.PRONUNCIATION) {
            // Pronunciation mode setup is handled by its own UI
        } else { // Fill-in-the-blank modes
            const newPuzzle = createPuzzle(question.answer, gameMode);
            setPuzzle(newPuzzle);
            const distractors = shuffleArray(ALPHABET.split(''))
                .filter(char => !newPuzzle.correctChars.includes(char))
                .slice(0, 8 - newPuzzle.correctChars.length);
            setChoiceChars(shuffleArray([...newPuzzle.correctChars, ...distractors]));
        }

        if (gameMode !== GameMode.PRONUNCIATION && audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    }, [gameMode]);

    useEffect(() => {
      if (currentQuestion) {
        setupQuestion(currentQuestion);
      }
    }, [currentQuestion, setupQuestion]);
    
    const handleFinish = useCallback((finalPenalty: number) => {
        const baseTime = Date.now() - startTime;
        onGameFinish(baseTime + finalPenalty);
    }, [startTime, onGameFinish]);

    const handleNextQuestion = useCallback(() => {
        if (isListening) recognition?.stop();
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleFinish(penalty);
        }
    }, [currentQuestionIndex, questions.length, penalty, handleFinish, isListening]);
    
    // --- Answer Checking ---
    useEffect(() => {
        if (!currentQuestion || gameMode === GameMode.PRONUNCIATION) return;

        const isAnswerComplete = gameMode === GameMode.UNSCRAMBLE
            ? currentAnswer.length === currentQuestion.answer.replace(/ /g, '').length
            : currentAnswer.length === puzzle?.missingIndices.length;

        if (isAnswerComplete) {
            let isCorrect = false;
            if (gameMode === GameMode.UNSCRAMBLE) {
                isCorrect = currentAnswer === currentQuestion.answer.replace(/ /g, '');
            } else if (puzzle) {
                isCorrect = currentAnswer === puzzle.correctChars.join('');
            }
            
            if (isCorrect) {
                setTimeout(() => handleNextQuestion(), 200);
            } else {
                const answerBox = document.getElementById('answer-box');
                if (answerBox) {
                    answerBox.classList.add('animate-shake');
                    setTimeout(() => answerBox.classList.remove('animate-shake'), 500);
                }
            }
        }
    }, [currentAnswer, currentQuestion, gameMode, puzzle, handleNextQuestion]);

    // --- Pronunciation Logic ---
    useEffect(() => {
        if (!recognition || gameMode !== GameMode.PRONUNCIATION) return;

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscript + interimTranscript);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        return () => {
            recognition?.stop();
        }
    }, [gameMode]);

    const toggleListen = () => {
        if (isListening) {
            recognition?.stop();
        } else {
            setTranscript('');
            recognition?.start();
        }
        setIsListening(!isListening);
    };

    const handlePronunciationSubmit = () => {
        const clean = (text: string) => text.toLowerCase().replace(/[.,?\/#!$%^&*;:{}=\-_`~()]/g, "").trim();
        if (clean(transcript) === clean(currentQuestion.answer)) {
            handleNextQuestion();
        } else {
            const answerBox = document.getElementById('pronunciation-feedback');
            if (answerBox) {
                answerBox.classList.add('animate-shake');
                setTimeout(() => answerBox.classList.remove('animate-shake'), 500);
            }
        }
    };
    
    // --- Event Handlers ---
    const handleCharClick = (char: string, index: number) => {
        setCurrentAnswer(prev => prev + char);
        if (gameMode === GameMode.UNSCRAMBLE) {
            setShuffledChars(prev => prev.filter((_, i) => i !== index));
        } else {
             setChoiceChars(prev => prev.filter((_, i) => i !== index));
        }
    };
    
    const handleUndo = () => {
        if (currentAnswer.length > 0) {
            const lastChar = currentAnswer.slice(-1);
            setCurrentAnswer(prev => prev.slice(0, -1));
            if (gameMode === GameMode.UNSCRAMBLE) {
                setShuffledChars(prev => [...prev, lastChar]);
            } else {
                setChoiceChars(prev => shuffleArray([...prev, lastChar]));
            }
        }
    };
    
    const handleClear = () => {
        if (gameMode === GameMode.UNSCRAMBLE) {
            setShuffledChars(shuffleArray(currentQuestion.answer.replace(/ /g, '').split('')));
        } else if (puzzle) {
             const distractors = shuffleArray(ALPHABET.split(''))
                .filter(char => !puzzle.correctChars.includes(char))
                .slice(0, 8 - puzzle.correctChars.length);
            setChoiceChars(shuffleArray([...puzzle.correctChars, ...distractors]));
        }
        setCurrentAnswer('');
    };
    
    const handleSkip = () => {
        const newPenalty = penalty + SKIP_PENALTY;
        setPenalty(newPenalty);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleFinish(newPenalty);
        }
    };
    
    const handleHint = () => {
        if(audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setPenalty(prev => prev + HINT_PENALTY);
        }
    };

    if (!currentQuestion) {
        return <LoadingSpinner />;
    }
    
    // --- Render Logic ---
    const renderPronunciationFeedback = () => {
        if (!transcript) {
            return <span className="text-gray-500">Your spoken text will appear here...</span>;
        }

        const clean = (text: string) => text.toLowerCase().replace(/[.,?\/#!$%^&*;:{}=\-_`~()]/g,"");

        const answerWords = clean(currentQuestion.answer).split(/\s+/).filter(Boolean);
        const transcriptWords = transcript.split(/\s+/).filter(Boolean);

        return transcriptWords.map((word, index) => {
            const isCorrect = answerWords[index] === clean(word);
            const color = isCorrect ? 'text-green-400' : 'text-red-400';
            return <span key={index} className={`${color} transition-colors`}>{word} </span>;
        });
    };

    const renderGameContent = () => {
        if (gameMode === GameMode.PRONUNCIATION) {
            return (
                <div>
                    <p className="mb-2 text-gray-300 text-center">Read the following phrase aloud:</p>
                    <div id="answer-box" className="w-full bg-gray-900/50 rounded-lg p-4 mb-4 text-3xl text-center font-bold tracking-wider border-2 border-gray-600">
                       {currentQuestion.answer}
                    </div>

                    <div id="pronunciation-feedback" className="w-full bg-gray-900/50 rounded-lg min-h-[60px] p-4 text-2xl text-center border-2 border-gray-600 mb-6">
                        {renderPronunciationFeedback()}
                    </div>

                    <div className="flex justify-center items-center gap-4">
                       <Button onClick={handleHint} variant="secondary" className="bg-purple-600 hover:bg-purple-500 focus:ring-purple-400">Hint (-30s)</Button>
                       <button onClick={toggleListen} className={`p-4 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}>
                           <MicIcon className="w-8 h-8 text-gray-900" />
                       </button>
                       <Button onClick={handlePronunciationSubmit} disabled={!transcript || isListening}>Submit</Button>
                    </div>
                    <div className="flex justify-center mt-4">
                        <Button onClick={handleSkip} variant="secondary" className="bg-amber-600 hover:bg-amber-500 focus:ring-amber-400">Skip (+30s)</Button>
                    </div>
                </div>
            );
        }

        // Unscramble and Fill-in-the-blank modes
        return (
            <div>
                <div className="my-6 text-center">
                    <p className="mb-4 text-gray-300">Listen to the audio and {gameMode === GameMode.UNSCRAMBLE ? 'unscramble the letters' : 'fill in the blanks'}.</p>
                    <audio ref={audioRef} src={currentQuestion.audioUrl} controls className="mx-auto" />
                </div>
                
                {(() => { // IIFE for complex render logic
                    if (gameMode !== GameMode.UNSCRAMBLE && puzzle) {
                        let filledCount = 0;
                        return (
                            <div id="answer-box" className="w-full bg-gray-900/50 rounded-lg min-h-[60px] p-3 flex items-center justify-center flex-wrap gap-2 text-3xl font-bold tracking-widest border-2 border-gray-600">
                                {puzzle.display.map((char, index) => {
                                    if (char === null) {
                                        const filledChar = currentAnswer[filledCount] || '';
                                        filledCount++;
                                        return <div key={index} className="w-10 h-14 bg-gray-800 border-b-2 border-cyan-400 flex items-center justify-center">{filledChar}</div>;
                                    }
                                    if (char === ' ') return <div key={index} className="w-6 h-14" />;
                                    return <div key={index} className="w-10 h-14 flex items-center justify-center">{char}</div>;
                                })}
                            </div>
                        )
                    }
                    return (
                         <div id="answer-box" className="w-full bg-gray-900/50 rounded-lg min-h-[60px] p-3 flex items-center justify-center text-3xl font-bold tracking-widest mb-4 border-2 border-gray-600">
                            {currentAnswer || <span className="text-gray-500">Your Answer</span>}
                        </div>
                    );
                })()}

                <div className="flex flex-wrap gap-3 justify-center my-6">
                    {(gameMode === GameMode.UNSCRAMBLE ? shuffledChars : choiceChars).map((char, index) => (
                        <button key={index} onClick={() => handleCharClick(char, index)} className="w-12 h-12 bg-gray-700 text-2xl font-bold rounded-lg hover:bg-cyan-500 hover:text-gray-900 transition-colors">
                            {char}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <Button onClick={handleUndo} variant="secondary">Undo</Button>
                    <Button onClick={handleClear} variant="secondary">Clear</Button>
                    <Button onClick={handleSkip} variant="secondary" className="bg-amber-600 hover:bg-amber-500 focus:ring-amber-400">Skip (+30s)</Button>
                </div>
            </div>
        );
    }
    
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <style>{`
            @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
            .animate-shake { animation: shake 0.5s ease-in-out; }
            `}</style>
            <audio ref={audioRef} src={currentQuestion.audioUrl} className="hidden" />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-cyan-400">Question {currentQuestionIndex + 1} / {questions.length}</h2>
                <div className="text-2xl font-mono text-white bg-gray-800 px-3 py-1 rounded-lg">
                    {new Date(elapsedTime + penalty).toISOString().slice(14, 22)}
                </div>
            </div>

            {renderGameContent()}
            
            {penalty > 0 && <p className="text-center mt-4 text-amber-400">Total Penalty: {penalty / 1000}s</p>}
        </Card>
    );
};

interface LeaderboardPageProps {
    progress: PlayerProgress[];
    onPlayAgain: () => void;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ progress, onPlayAgain }) => {
    const sortedProgress = useMemo(() => {
        return [...progress].sort((a, b) => {
            if (a.finishTime === null) return 1;
            if (b.finishTime === null) return -1;
            return a.finishTime - b.finishTime;
        });
    }, [progress]);

    const getPodiumClass = (index: number) => {
        switch (index) {
            case 0: return "bg-gradient-to-r from-amber-400 to-yellow-500 scale-110";
            case 1: return "bg-gradient-to-r from-slate-300 to-gray-400";
            case 2: return "bg-gradient-to-r from-yellow-700 to-orange-800";
            default: return "bg-gray-700";
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto text-center">
            <TrophyIcon className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
            <h2 className="text-4xl font-bold mb-8">Final Results</h2>
            <div className="space-y-3">
                {sortedProgress.map((p, index) => (
                    <div key={p.playerId} className={`flex items-center justify-between p-4 rounded-lg shadow-lg text-gray-900 font-bold ${getPodiumClass(index)}`}>
                        <div className="flex items-center gap-4">
                            <span className="text-2xl w-8">{index + 1}</span>
                            <span className="text-xl">{p.name}</span>
                        </div>
                        <span className="text-lg font-mono">
                            {p.finishTime !== null ? new Date(p.finishTime).toISOString().slice(14, 22) : 'DNF'}
                        </span>
                    </div>
                ))}
            </div>
            <Button onClick={onPlayAgain} className="mt-8 w-full">Play Again</Button>
        </Card>
    );
};


// --- Main App Component ---

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.HOME);
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.UNSCRAMBLE);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([]);
  const [isLoading, setIsLoading] = useState({ creating: false, joining: false });
  const joiningPlayerName = useRef<string | null>(null);

  const handlePlayAgain = useCallback(() => {
      setGamePhase(GamePhase.HOME);
      setRoomCode('');
      setPlayers([]);
      setQuestions([]);
      setCurrentPlayer(null);
      setPlayerProgress([]);
      setIsLoading({ creating: false, joining: false });
      joiningPlayerName.current = null;
  }, []);

  useEffect(() => {
    socket.on('connect', () => console.log(`Connected to server with id: ${socket.id}`));
    socket.on('disconnect', () => {
      alert('Connection to server lost. Resetting app.');
      handlePlayAgain();
    });

    socket.on('room-created', (room) => {
      setRoomCode(room.roomCode);
      setPlayers(room.players);
      setQuestions(room.questions);
      setGameMode(room.gameMode || GameMode.UNSCRAMBLE);
      const hostPlayer = room.players.find((p: Player) => p.isHost);
      setCurrentPlayer(hostPlayer);
      setGamePhase(GamePhase.LOBBY);
      setIsLoading(prev => ({ ...prev, creating: false }));
    });

    socket.on('join-success', (room) => {
        setRoomCode(room.roomCode);
        setPlayers(room.players);
        setQuestions(room.questions);
        setGameMode(room.gameMode || GameMode.UNSCRAMBLE);
        const me = room.players.find((p: Player) => p.id === socket.id);
        setCurrentPlayer(me);
        setGamePhase(GamePhase.LOBBY);
        setIsLoading(prev => ({...prev, joining: false}));
    });

    socket.on('update-player-list', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('host-changed', ({ newHostId, players: updatedPlayers }) => {
        setPlayers(updatedPlayers);
        if (socket.id === newHostId) {
            alert("The host has left. You are the new host!");
        }
        const me = updatedPlayers.find(p => p.id === socket.id);
        if (me) setCurrentPlayer(me);
    });
    
    socket.on('game-started', ({ questions: serverQuestions, gameMode: serverGameMode }) => {
      setQuestions(serverQuestions);
      setGameMode(serverGameMode || GameMode.UNSCRAMBLE);
      setPlayerProgress(players.map(p => ({ playerId: p.id, name: p.name, finishTime: null })));
      setGamePhase(GamePhase.PLAYING);
    });

    socket.on('update-progress', (progress: PlayerProgress[]) => {
      setPlayerProgress(progress);
    });

    socket.on('game-finished', (leaderboard: PlayerProgress[]) => {
      setPlayerProgress(leaderboard);
      setTimeout(() => setGamePhase(GamePhase.LEADERBOARD), 500);
    });

    socket.on('error', (message: string) => {
      alert(`Error: ${message}`);
      if (message.includes('Host has left')) {
        handlePlayAgain();
      }
      setIsLoading({ creating: false, joining: false });
      joiningPlayerName.current = null;
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room-created');
      socket.off('join-success');
      socket.off('update-player-list');
      socket.off('host-changed');
      socket.off('game-started');
      socket.off('update-progress');
      socket.off('game-finished');
      socket.off('error');
    };
  }, [players, handlePlayAgain]);

  const handleCreateGame = useCallback((name: string, questionsData: Question[], mode: GameMode) => {
    setIsLoading(prev => ({ ...prev, creating: true }));
    socket.emit('createRoom', { playerName: name, questions: questionsData, gameMode: mode });
  }, []);

  const handleJoinGame = useCallback((name: string, room: string) => {
    setIsLoading(prev => ({ ...prev, joining: true }));
    setRoomCode(room);
    joiningPlayerName.current = name;
    socket.emit('joinRoom', { playerName: name, roomCode: room });
  }, []);



  const handleStartGame = useCallback(() => {
    socket.emit('startGame', { roomCode });
  }, [roomCode]);

  const handleGameFinish = useCallback((finishTime: number) => {
    if (!currentPlayer) return;
    socket.emit('playerFinished', { roomCode, finishTime });
    setPlayerProgress(prev => 
        prev.map(p => p.playerId === currentPlayer.id ? {...p, finishTime} : p)
    );
  }, [currentPlayer, roomCode]);

  const renderContent = () => {
    switch (gamePhase) {
      case GamePhase.LOBBY:
        return <LobbyPage roomCode={roomCode} players={players} isHost={currentPlayer?.isHost ?? false} onStartGame={handleStartGame} />;
      case GamePhase.PLAYING:
        return currentPlayer && <GamePage questions={questions} player={currentPlayer} onGameFinish={handleGameFinish} gameMode={gameMode} />;
      case GamePhase.LEADERBOARD:
        return <LeaderboardPage progress={playerProgress} onPlayAgain={handlePlayAgain} />;
      case GamePhase.HOME:
      default:
        return <HomePage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} isCreating={isLoading.creating} isJoining={isLoading.joining} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col items-center justify-center p-4 font-sans">
      <header className="absolute top-0 left-0 p-6">
        <h1 className="text-2xl font-bold tracking-wider">Audio Scramble <span className="text-cyan-400">Showdown</span></h1>
      </header>
      <main className="w-full flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
}
