import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Star, Crown, Music } from 'lucide-react';

const KoreanRescueGame = () => {
  const [gameState, setGameState] = useState('start');
  const [gameMode, setGameMode] = useState('');
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [targetChars, setTargetChars] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [zombies, setZombies] = useState([]);
  const [groundZombies, setGroundZombies] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [princessAnimation, setPrincessAnimation] = useState('normal');
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  
  const gameLoopRef = useRef(null);
  const zombieSpawnRef = useRef(null);
  const audioContextRef = useRef(null);
  const musicIntervalRef = useRef(null);
  
  // 효과음 캐시
  const audioCache = useRef({
    explosion: null,
    danger: null,
    scream: null,
    victory: null
  });

  // 효과음 파일 경로
  const soundEffects = {
    explosion: '/sounds/explosion.mp3',
    danger: '/sounds/danger.mp3',
    scream: '/sounds/scream.mp3',
    victory: '/sounds/victory.mp3'
  };

  const sentences = [
    "나는 내가 빛나는 별인 줄 알았어요",
    "한 번도 의심한 적 없었죠",
    "몰랐어요, 난 내가 벌레라는 것을",
    "그래도 괜찮아, 난 눈부시니까",
    "그래도 괜찮아, 나는 빛날 테니까"
  ];

  const words = [
    { kr: "이너뷰티", en: "Inner Beauty", cn: "内服美容" },
    { kr: "올영세일", en: "Big Sale", cn: "超级大促" },
    { kr: "원플러스원", en: "Buy 1 Get 1", cn: "买一送一" },
    { kr: "한정기획", en: "Limited Set", cn: "限定套装" },
    { kr: "품절임박", en: "Sold Out Soon", cn: "即将售罄" },
    { kr: "올영픽", en: "Best Pick", cn: "必买推荐" }
  ];

  const zombieTypes = ['parachute', 'ghost', 'funny'];

  // MP3 효과음 재생 함수
  const playAudioSound = (type) => {
    try {
      // 캐시에서 오디오 가져오기 또는 새로 생성
      if (!audioCache.current[type]) {
        audioCache.current[type] = new Audio(soundEffects[type]);
        audioCache.current[type].volume = 0.6; // 볼륨 60%
      }
      
      const audio = audioCache.current[type];
      audio.currentTime = 0; // 처음부터 재생
      audio.play().catch(err => {
        console.log('MP3 재생 실패, 기본 효과음 사용:', err);
        playSound(type); // MP3 실패시 기본 효과음으로 폴백
      });
    } catch (error) {
      console.error('효과음 재생 오류:', error);
      playSound(type); // 오류시 기본 효과음으로 폴백
    }
  };

  // 기본 효과음 (MP3 파일이 없을 때 사용)
  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'explosion') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'danger') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'scream') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else if (type === 'victory') {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
        osc.start(audioContext.currentTime + i * 0.15);
        osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
      });
    }
  };

  const playBackgroundMusic = () => {
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      const audioContext = audioContextRef.current;
      
      const playMelody = () => {
        const notes = [262, 294, 330, 349, 392, 440, 494, 523];
        const duration = 0.25;
        const currentTime = audioContext.currentTime;
        
        notes.forEach((freq, i) => {
          try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(freq, currentTime + i * duration);
            
            gainNode.gain.setValueAtTime(0, currentTime + i * duration);
            gainNode.gain.linearRampToValueAtTime(0.1, currentTime + i * duration + 0.02);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + i * duration + duration);
            
            oscillator.start(currentTime + i * duration);
            oscillator.stop(currentTime + i * duration + duration);
          } catch (error) {
            console.error('Oscillator error:', error);
          }
        });
      };
      
      playMelody();
      musicIntervalRef.current = setInterval(() => {
        if (audioContext.state === 'running') {
          playMelody();
        }
      }, 2000);
      
    } catch (error) {
      console.error('AudioContext error:', error);
    }
  };
  
  const stopBackgroundMusic = () => {
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
  };

  const getRandomZombieEmoji = (type) => {
    if (type === 'parachute') return '🪂';
    if (type === 'ghost') return '👻';
    return '🤡';
  };

  const getYoutubeEmbedUrl = (url) => {
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch')) {
        videoId = url.split('v=')[1].split('&')[0];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : '';
    } catch (error) {
      return '';
    }
  };

  const startGame = (mode) => {
    setGameMode(mode);
    
    if (mode === 'word') {
      const word = words[Math.min(stage - 1, words.length - 1)];
      setTargetChars(word.kr.split(''));
    } else {
      const sentence = sentences[Math.min(stage - 1, sentences.length - 1)];
      setTargetChars(sentence.split(''));
    }
    
    setCorrectIndex(0);
    setZombies([]);
    setGroundZombies([]);
    setExplosions([]);
    setGameState('playing');
    setPrincessAnimation('normal');
    setShowVictoryAnimation(false);
    
    setTimeout(() => {
      playBackgroundMusic();
    }, 200);
  };

  const spawnZombie = () => {
    if (gameState !== 'playing') return;
    
    const chars = targetChars;
    const decoyChars = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차'];
    
    const isCorrectChar = Math.random() > 0.3;
    let char;
    
    if (isCorrectChar && correctIndex < chars.length) {
      const futureIndex = Math.min(correctIndex + Math.floor(Math.random() * 3), chars.length - 1);
      char = chars[futureIndex];
    } else {
      char = decoyChars[Math.floor(Math.random() * decoyChars.length)];
    }
    
    const type = zombieTypes[Math.floor(Math.random() * zombieTypes.length)];
    
    const newZombie = {
      id: Date.now() + Math.random(),
      char,
      x: Math.random() * 80 + 10,
      y: -10,
      type,
      emoji: getRandomZombieEmoji(type),
      speed: 0.3 + Math.random() * 0.4
    };
    
    setZombies(prev => [...prev, newZombie]);
  };

  const handleZombieClick = (zombie) => {
    if (gameState !== 'playing') return;
    
    if (zombie.char === targetChars[correctIndex]) {
      playAudioSound('explosion'); // MP3 효과음 사용
      
      setExplosions(prev => [...prev, { id: zombie.id, x: zombie.x, y: zombie.y }]);
      setZombies(prev => prev.filter(z => z.id !== zombie.id));
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      let points = 10;
      if (newCombo === 2) points = 40;
      if (newCombo >= 3) points = 80;
      
      setScore(prev => prev + points);
      setCorrectIndex(prev => prev + 1);
      
      if (newCombo >= 5) {
        const incorrectZombies = zombies.filter(z => 
          z.char !== targetChars[correctIndex + 1] && z.id !== zombie.id
        );
        const toRemove = incorrectZombies.slice(0, 2);
        toRemove.forEach(z => {
          playAudioSound('explosion'); // MP3 효과음 사용
          setExplosions(prev => [...prev, { id: z.id, x: z.x, y: z.y }]);
        });
        setZombies(prev => prev.filter(z => !toRemove.includes(z)));
      }
      
    } else {
      setCombo(0);
    }
  };

  useEffect(() => {
    if (correctIndex === targetChars.length && gameState === 'playing') {
      stopBackgroundMusic();
      playAudioSound('victory'); // MP3 효과음 사용
      setIsFlashing(true);
      setShowVictoryAnimation(true);
      
      setTimeout(() => {
        setIsFlashing(false);
        setGameState('victory');
      }, 2000);
    }
  }, [correctIndex, targetChars.length, gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      zombieSpawnRef.current = setInterval(() => {
        spawnZombie();
      }, 1500);
      
      gameLoopRef.current = setInterval(() => {
        setZombies(prev => {
          const updated = prev.map(z => ({
            ...z,
            y: z.y + z.speed
          }));
          
          const reached = updated.filter(z => z.y >= 85);
          const remaining = updated.filter(z => z.y < 85);
          
          reached.forEach(z => {
            if (z.char === targetChars[correctIndex]) {
              playAudioSound('danger'); // MP3 효과음 사용
              setGroundZombies(prev => [...prev, { 
                id: z.id, 
                x: z.x,
                progress: 0 
              }]);
              setPrincessAnimation('scared');
              setTimeout(() => setPrincessAnimation('normal'), 1000);
            }
          });
          
          return remaining;
        });
        
        setGroundZombies(prev => {
          const updated = prev.map(gz => ({
            ...gz,
            progress: gz.progress + 0.5
          }));
          
          const completed = updated.filter(gz => gz.progress >= 100);
          if (completed.length > 0) {
            setLives(l => {
              const newLives = l - completed.length;
              if (newLives <= 0) {
                stopBackgroundMusic();
                playAudioSound('scream'); // MP3 효과음 사용
                setPrincessAnimation('captured');
                setTimeout(() => {
                  setGameState('defeat');
                }, 1000);
              }
              return Math.max(0, newLives);
            });
          }
          
          return updated.filter(gz => gz.progress < 100);
        });
        
        setExplosions(prev => prev.filter((_, i) => i < prev.length - 1));
        
      }, 50);
      
      return () => {
        clearInterval(gameLoopRef.current);
        clearInterval(zombieSpawnRef.current);
      };
    } else if (gameState !== 'playing') {
      stopBackgroundMusic();
    }
  }, [gameState, correctIndex, targetChars]);

  const getCurrentWordInfo = () => {
    if (gameMode === 'word' && gameState === 'playing') {
      const wordIndex = Math.min(stage - 1, words.length - 1);
      return words[wordIndex];
    }
    return null;
  };

  const wordInfo = getCurrentWordInfo();

  const styles = {
    container: {
      width: '100%',
      height: '100vh',
      background: isFlashing 
        ? 'linear-gradient(to bottom, #fbbf24, #fb923c, #fbbf24)' 
        : 'linear-gradient(to bottom, #4c1d95, #3730a3, #4c1d95)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'sans-serif',
      transition: 'background 0.3s ease'
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      overflowY: 'auto'
    },
    startBox: {
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'rgba(107, 33, 168, 0.9)',
      borderRadius: '1.5rem',
      border: '4px solid #fbbf24',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    button: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#fbbf24',
      color: '#4c1d95',
      fontWeight: 'bold',
      fontSize: '1rem',
      borderRadius: '9999px',
      border: 'none',
      cursor: 'pointer',
      margin: '0.25rem'
    },
    input: {
      padding: '0.5rem',
      fontSize: '0.9rem',
      borderRadius: '0.5rem',
      border: '2px solid #fbbf24',
      width: '100%',
      marginBottom: '0.5rem'
    }
  };

  return (
    <div style={styles.container}>
      {gameState === 'start' && (
        <div style={styles.overlay}>
          <div style={styles.startBox}>
            <h1 style={{ fontSize: '2rem', color: '#fde047', marginBottom: '0.5rem' }}>
              ⚔️ 공주 구출 작전 ⚔️
            </h1>
            <p style={{ fontSize: '1rem', color: '#fef3c7', marginBottom: '1rem' }}>
              용감한 기사님, 공주를 구해주세요!
            </p>

            {!showYoutubeInput && (
              <button
                onClick={() => setShowYoutubeInput(true)}
                style={{ ...styles.button, backgroundColor: '#ef4444' }}
              >
                <Music size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                유튜브 음악
              </button>
            )}

            {showYoutubeInput && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="유튜브 URL"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  style={styles.input}
                />
                {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
                  <iframe
                    width="100%"
                    height="180"
                    src={getYoutubeEmbedUrl(youtubeUrl)}
                    frameBorder="0"
                    allow="autoplay"
                    style={{ borderRadius: '0.5rem', marginBottom: '0.5rem' }}
                  ></iframe>
                )}
                <button
                  onClick={() => setShowYoutubeInput(false)}
                  style={{ ...styles.button, backgroundColor: '#6b7280', fontSize: '0.9rem' }}
                >
                  닫기
                </button>
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#fde047', marginBottom: '0.5rem' }}>게임 선택:</p>
              <button
                onClick={() => startGame('word')}
                style={styles.button}
              >
                단어 게임 🎯
              </button>
              <button
                onClick={() => startGame('sentence')}
                style={styles.button}
              >
                문장 게임 📝
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', right: '0.5rem', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ backgroundColor: 'rgba(107, 33, 168, 0.8)', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.9rem' }}>
                <div>점수: {score}</div>
                <div>콤보: {combo} 🔥</div>
              </div>
              
              <div style={{ backgroundColor: 'rgba(153, 27, 27, 0.8)', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.9rem' }}>
                생명: {[...Array(lives)].map((_, i) => (
                  <Heart key={i} style={{ color: '#f87171', display: 'inline' }} fill="#f87171" size={16} />
                ))}
              </div>
            </div>
            
            {wordInfo && (
              <div style={{ marginTop: '0.5rem', backgroundColor: 'rgba(49, 46, 129, 0.8)', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'white' }}>
                <div style={{ color: '#fde047', fontWeight: 'bold' }}>{wordInfo.kr}</div>
                <div>EN: {wordInfo.en} | CN: {wordInfo.cn}</div>
              </div>
            )}

            <div style={{ marginTop: '0.5rem', backgroundColor: 'rgba(49, 46, 129, 0.9)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {targetChars.map((char, i) => (
                  <span 
                    key={i}
                    style={{
                      display: 'inline-block',
                      margin: '0 0.1rem',
                      color: i < correctIndex ? '#fde047' : 'white',
                      textShadow: i < correctIndex ? '0 0 10px gold' : 'none'
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {zombies.map(zombie => (
            <div
              key={zombie.id}
              onClick={() => handleZombieClick(zombie)}
              style={{
                position: 'absolute',
                cursor: 'pointer',
                left: `${zombie.x}%`,
                top: `${zombie.y}%`,
                opacity: zombie.type === 'ghost' ? 0.7 : 1
              }}
            >
              <div style={{ fontSize: '3rem' }}>{zombie.emoji}</div>
              <div style={{
                position: 'absolute',
                top: '3rem',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#1f2937',
                border: '3px solid #4b5563',
                borderRadius: '0.5rem',
                padding: '0.25rem 0.75rem'
              }}>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{zombie.char}</div>
              </div>
            </div>
          ))}

          {explosions.map(exp => (
            <div
              key={exp.id}
              style={{
                position: 'absolute',
                fontSize: '3rem',
                left: `${exp.x}%`,
                top: `${exp.y}%`
              }}
            >
              💥
            </div>
          ))}

          {groundZombies.map(gz => (
            <div
              key={gz.id}
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: `${gz.x}%`,
                fontSize: '2rem'
              }}
            >
              🧟
            </div>
          ))}

          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '2rem',
            textAlign: 'center',
            transform: princessAnimation === 'scared' ? 'scale(1.2)' : 'scale(1)',
            filter: princessAnimation === 'captured' ? 'brightness(0.3)' : 'brightness(1)'
          }}>
            <div style={{ fontSize: '3rem' }}>
              {princessAnimation === 'captured' ? '😱' : '👸'}
            </div>
            {groundZombies.length > 0 && princessAnimation !== 'captured' && (
              <div style={{ color: 'white', backgroundColor: '#ec4899', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                큰 일이예요!
              </div>
            )}
          </div>
        </>
      )}

      {gameState === 'victory' && (
        <div style={{ ...styles.overlay, background: 'linear-gradient(to bottom, #fbbf24, #fb923c)' }}>
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '1.5rem', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '2rem', color: '#6b21a8', marginBottom: '1rem' }}>
              🎉 공주 구출 성공! 🎉
            </h1>
            <div style={{ fontSize: '2.5rem', margin: '1rem 0' }}>👸🏰</div>
            <p style={{ fontSize: '1rem', color: '#7c3aed' }}>공주님이 돌아왔어요!</p>
            <div style={{ fontSize: '1.2rem', color: '#6b21a8', fontWeight: 'bold', margin: '1rem 0' }}>
              점수: {score}점
            </div>
            <div>
              <p style={{ color: '#6b21a8', marginBottom: '0.5rem' }}>다음 게임:</p>
              <button
                onClick={() => {
                  setStage(s => s + 1);
                  startGame('word');
                }}
                style={{ ...styles.button, backgroundColor: '#7c3aed', color: 'white' }}
              >
                단어 🎯
              </button>
              <button
                onClick={() => {
                  setStage(s => s + 1);
                  startGame('sentence');
                }}
                style={{ ...styles.button, backgroundColor: '#10b981', color: 'white' }}
              >
                문장 📝
              </button>
            </div>
            <button
              onClick={() => {
                setGameState('start');
                setStage(1);
                setScore(0);
                setLives(5);
                setCombo(0);
              }}
              style={{ ...styles.button, backgroundColor: '#6b7280', color: 'white', marginTop: '0.5rem' }}
            >
              처음으로
            </button>
          </div>
        </div>
      )}

      {gameState === 'defeat' && (
        <div style={{ ...styles.overlay, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(127, 29, 29, 0.9)', borderRadius: '1.5rem', border: '4px solid #dc2626', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '2rem', color: '#fca5a5', marginBottom: '1rem' }}>
              😢 공주 구출 실패 😢
            </h1>
            <div style={{ fontSize: '2.5rem', margin: '1rem 0' }}>👸💔</div>
            <p style={{ fontSize: '1rem', color: '#fca5a5' }}>안 돼...!</p>
            <div style={{ fontSize: '1rem', color: '#fca5a5', margin: '1rem 0' }}>
              점수: {score}점
            </div>
            <button
              onClick={() => startGame(gameMode)}
              style={{ ...styles.button, backgroundColor: '#eab308', color: 'black' }}
            >
              다시 도전! 💪
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KoreanRescueGame;
