import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Star, Zap, Crown } from 'lucide-react';

const KoreanRescueGame = () => {
  const [gameState, setGameState] = useState('start');
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [currentSentence, setCurrentSentence] = useState('');
  const [targetChars, setTargetChars] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [zombies, setZombies] = useState([]);
  const [groundZombies, setGroundZombies] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [princessAnimation, setPrincessAnimation] = useState('normal');
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const gameLoopRef = useRef(null);
  const zombieSpawnRef = useRef(null);
  const bgMusicRef = useRef(null);
  const audioContextRef = useRef(null);
  const musicIntervalRef = useRef(null);

  // 효과음 오디오 객체들
  const audioCache = useRef({
    explosion: null,
    danger: null,
    scream: null,
    victory: null
  });

  console.log('Music playing:', isMusicPlaying); // 디버깅용

  const sentences = [
    "한글은 세상을 밝힌다",
    "공주님을 구해주세요",
    "말모이 왕국을 지켜라",
    "한글의 힘은 위대하다",
    "용기있는 기사여 나아가라"
  ];

  const zombieTypes = ['parachute', 'ghost', 'funny'];
  
  // Web Audio API로 효과음 생성
  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'explosion') {
      // 폭발음 (펑!)
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'danger') {
      // 큰 일이예요! (경고음)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'scream') {
      // 으악! (비명)
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else if (type === 'victory') {
      // 승리 멜로디
      const notes = [523, 659, 784, 1047]; // C, E, G, C (한 옥타브 위)
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

  // 배경 음악 (간단한 루프)
  const playBackgroundMusic = () => {
    console.log('playBackgroundMusic 호출됨'); // 디버깅
    
    // 기존 음악 정리
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    
    // AudioContext 생성
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext 생성됨:', audioContextRef.current.state);
      }
      
      // AudioContext resume (필수!)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('AudioContext resumed');
        });
      }
      
      const audioContext = audioContextRef.current;
      let isPlaying = true; // 재생 상태 추적
      
      const playMelody = () => {
        if (!isPlaying) return; // 중단되었으면 재생 안 함
        
        console.log('멜로디 재생');
        
        const notes = [262, 294, 330, 349, 392, 440, 494, 523]; // C, D, E, F, G, A, B, C
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
            console.error('오실레이터 생성 오류:', error);
          }
        });
      };
      
      // 즉시 한 번 재생
      playMelody();
      setIsMusicPlaying(true);
      
      // 2초마다 반복 (음악 길이와 맞춤)
      musicIntervalRef.current = setInterval(() => {
        if (audioContext.state === 'running') {
          playMelody();
        } else {
          console.log('AudioContext 상태:', audioContext.state);
        }
      }, 2000);
      
      console.log('배경음악 인터벌 설정됨');
      
      // cleanup 함수 반환
      return () => {
        isPlaying = false;
        if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current);
        }
      };
      
    } catch (error) {
      console.error('AudioContext 생성 오류:', error);
    }
  };
  
  // 배경 음악 정지
  const stopBackgroundMusic = () => {
    console.log('stopBackgroundMusic 호출됨');
    
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    setIsMusicPlaying(false);
  };

  // 효과음 URL (공개 CDN 사용 - 실제 사용시 다운로드한 파일 경로로 변경)
  const soundEffects = {
    explosion: '/sounds/explosion.mp3',  // 다운로드한 파일
    danger: '/sounds/danger.mp3',
    scream: '/sounds/scream.mp3',
    victory: '/sounds/victory.mp3'
  };

  // 효과음 재생 함수 (오디오 파일 사용)
  const playAudioSound = (type) => {
    try {
      // 캐시에서 오디오 가져오기 또는 새로 생성
      if (!audioCache.current[type]) {
        audioCache.current[type] = new Audio(soundEffects[type]);
        audioCache.current[type].volume = 0.5; // 볼륨 50%
      }
      
      const audio = audioCache.current[type];
      audio.currentTime = 0; // 처음부터 재생
      audio.play().catch(err => console.log('오디오 재생 오류:', err));
    } catch (error) {
      console.error('효과음 재생 실패:', error);
      // 실패시 Web Audio API로 폴백
      playSound(type);
    }
  };

  const getRandomZombieEmoji = (type) => {
    if (type === 'parachute') return '🪂';
    if (type === 'ghost') return '👻';
    return '🤡';
  };

  const startGame = () => {
    console.log('게임 시작!'); // 디버깅
    
    const sentence = sentences[Math.min(stage - 1, sentences.length - 1)];
    setCurrentSentence(sentence);
    setTargetChars(sentence.split(''));
    setCorrectIndex(0);
    setZombies([]);
    setGroundZombies([]);
    setExplosions([]);
    setGameState('playing');
    setConsecutiveErrors(0);
    setPrincessAnimation('normal');
    setShowVictoryAnimation(false);
    
    // 배경 음악 시작 (즉시)
    setTimeout(() => {
      console.log('배경음악 시작 타이머 실행');
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
      speed: 0.3 + Math.random() * 0.4,
      isCorrect: char === chars[correctIndex]
    };
    
    setZombies(prev => [...prev, newZombie]);
  };

  const handleZombieClick = (zombie) => {
    if (gameState !== 'playing') return;
    
    if (zombie.char === targetChars[correctIndex]) {
      // 정답! 폭발음 (실제 효과음 사용)
      playAudioSound('explosion');
      
      setExplosions(prev => [...prev, { id: zombie.id, x: zombie.x, y: zombie.y }]);
      setZombies(prev => prev.filter(z => z.id !== zombie.id));
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      setConsecutiveErrors(0);
      
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
          playAudioSound('explosion');
          setExplosions(prev => [...prev, { id: z.id, x: z.x, y: z.y }]);
        });
        setZombies(prev => prev.filter(z => !toRemove.includes(z)));
      }
      
    } else {
      setCombo(0);
      const newErrors = consecutiveErrors + 1;
      setConsecutiveErrors(newErrors);
      
      let penalty = 1;
      if (newErrors === 2) penalty = 4;
      if (newErrors >= 3) penalty = 8;
      
      setScore(prev => Math.max(0, prev - penalty));
    }
  };

  useEffect(() => {
    if (correctIndex === targetChars.length && gameState === 'playing') {
      // 문장 완성! 배경 음악 정지
      stopBackgroundMusic();
      
      // 승리 사운드와 애니메이션 (실제 효과음 사용)
      playAudioSound('victory');
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
      // 좀비 스폰
      zombieSpawnRef.current = setInterval(() => {
        spawnZombie();
      }, 1500);
      
      // 게임 루프
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
              // 정답 좀비가 땅에 떨어짐 - 큰 일이예요! (실제 효과음)
              playAudioSound('danger');
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
                // 게임 오버 - 배경 음악 정지 및 비명 소리 (실제 효과음)
                stopBackgroundMusic();
                playAudioSound('scream');
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
      
      // cleanup
      return () => {
        clearInterval(gameLoopRef.current);
        clearInterval(zombieSpawnRef.current);
        // 게임이 끝날 때만 음악 정지 (playing이 아닐 때)
      };
    } else if (gameState !== 'playing') {
      // playing이 아닌 다른 상태로 변경될 때 음악 정지
      stopBackgroundMusic();
    }
  }, [gameState, correctIndex, targetChars]);

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
    starContainer: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden'
    },
    star: {
      position: 'absolute',
      color: '#fef08a',
      opacity: 0.5
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    startBox: {
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'rgba(107, 33, 168, 0.9)',
      borderRadius: '1.5rem',
      border: '4px solid #fbbf24',
      maxWidth: '600px'
    },
    button: {
      padding: '1rem 3rem',
      backgroundColor: '#fbbf24',
      color: '#4c1d95',
      fontWeight: 'bold',
      fontSize: '1.5rem',
      borderRadius: '9999px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      marginTop: '2rem'
    },
    topUI: {
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      right: '1rem',
      zIndex: 10
    },
    topBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    scoreBox: {
      backgroundColor: 'rgba(107, 33, 168, 0.8)',
      padding: '1rem',
      borderRadius: '0.5rem',
      color: 'white'
    },
    sentenceBox: {
      marginTop: '1rem',
      backgroundColor: 'rgba(49, 46, 129, 0.9)',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      textAlign: 'center'
    },
    zombie: {
      position: 'absolute',
      cursor: 'pointer',
      transition: 'transform 0.2s'
    },
    zombieShield: {
      position: 'absolute',
      top: '4rem',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1f2937',
      border: '4px solid #4b5563',
      borderRadius: '0.5rem',
      padding: '0.5rem 1rem'
    },
    explosion: {
      position: 'absolute',
      fontSize: '4rem',
      animation: 'explode 0.5s ease-out forwards'
    },
    groundZombie: {
      position: 'absolute',
      bottom: '1rem',
      fontSize: '2.5rem',
      animation: 'crawl 1s infinite'
    },
    princess: {
      position: 'absolute',
      bottom: '2rem',
      right: '3rem',
      textAlign: 'center',
      transition: 'all 0.3s ease'
    },
    princessBubble: {
      color: 'white',
      backgroundColor: '#ec4899',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      marginTop: '0.5rem'
    },
    victoryBox: {
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '1.5rem',
      maxWidth: '600px'
    },
    defeatBox: {
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'rgba(127, 29, 29, 0.9)',
      borderRadius: '1.5rem',
      border: '4px solid #dc2626',
      maxWidth: '600px'
    },
    cloudCarriage: {
      position: 'absolute',
      fontSize: '5rem',
      animation: showVictoryAnimation ? 'descend 2s ease-out forwards' : 'none',
      top: '-100px',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    firework: {
      position: 'absolute',
      fontSize: '3rem',
      animation: 'firework 1s ease-out infinite'
    }
  };

  return (
    <div style={styles.container}>
      {/* 별 배경 */}
      <div style={styles.starContainer}>
        {[...Array(50)].map((_, i) => (
          <Star 
            key={i} 
            style={{
              ...styles.star,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`
            }}
            size={Math.random() * 10 + 5}
          />
        ))}
      </div>

      {/* 시작 화면 */}
      {gameState === 'start' && (
        <div style={styles.overlay}>
          <div style={styles.startBox}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fde047', marginBottom: '1rem' }}>
              ⚔️ 말모이 왕국 ⚔️
            </h1>
            <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '1.5rem' }}>
              한글 구출 작전
            </h2>
            <div style={{ fontSize: '1.25rem', color: '#fef3c7', lineHeight: '2' }}>
              <p>🧙‍♂️ 흑마도사 '자모 파괴자'가 한글을 부쉈어요!</p>
              <p>👸 공주님이 성탑에 갇혔습니다!</p>
              <p>🛡️ 좀비들의 방패에서 한글을 순서대로 찾아</p>
              <p>✨ 문장을 복원하세요!</p>
            </div>
            <button
              onClick={startGame}
              style={styles.button}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              게임 시작! 🎮
            </button>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#fef3c7' }}>
              🔊 소리와 함께 즐기세요!
            </div>
          </div>
        </div>
      )}

      {/* 게임 화면 */}
      {gameState === 'playing' && (
        <>
          {/* 상단 UI */}
          <div style={styles.topUI}>
            <div style={styles.topBar}>
              <div style={styles.scoreBox}>
                <div style={{ color: '#fde047', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  점수: {score}점
                </div>
                <div style={{ color: '#f9a8d4', fontSize: '1.1rem' }}>
                  콤보: {combo} 🔥
                </div>
                <div style={{ color: 'white', fontSize: '1.1rem' }}>
                  스테이지: {stage}
                </div>
                <div style={{ color: isMusicPlaying ? '#4ade80' : '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  🔊 {isMusicPlaying ? '음악 재생중' : '음악 대기중'}
                </div>
              </div>
              
              <div style={{ ...styles.scoreBox, backgroundColor: 'rgba(153, 27, 27, 0.8)' }}>
                <div style={{ color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  생명력: {[...Array(lives)].map((_, i) => (
                    <Heart key={i} style={{ color: '#f87171' }} fill="#f87171" size={24} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* 문장 표시 */}
            <div style={styles.sentenceBox}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                {targetChars.map((char, i) => (
                  <span 
                    key={i}
                    style={{
                      display: 'inline-block',
                      margin: '0 0.25rem',
                      color: i < correctIndex ? '#fde047' : 'white',
                      textShadow: i < correctIndex ? '0 0 10px gold' : 'none',
                      animation: i < correctIndex ? 'glow 0.5s ease-in' : 'none'
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 승리 애니메이션 - 구름 마차 */}
          {showVictoryAnimation && (
            <>
              <div style={styles.cloudCarriage}>
                ☁️👸☁️
              </div>
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i}
                  style={{
                    ...styles.firework,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                >
                  ✨
                </div>
              ))}
            </>
          )}

          {/* 좀비들 */}
          {zombies.map(zombie => (
            <div
              key={zombie.id}
              onClick={() => handleZombieClick(zombie)}
              style={{
                ...styles.zombie,
                left: `${zombie.x}%`,
                top: `${zombie.y}%`,
                opacity: zombie.type === 'ghost' ? 0.7 : 1
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '4rem' }}>{zombie.emoji}</div>
              <div style={styles.zombieShield}>
                <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{zombie.char}</div>
              </div>
            </div>
          ))}

          {/* 폭발 효과 */}
          {explosions.map(exp => (
            <div
              key={exp.id}
              style={{
                ...styles.explosion,
                left: `${exp.x}%`,
                top: `${exp.y}%`
              }}
            >
              💥
            </div>
          ))}

          {/* 바닥 좀비들 */}
          {groundZombies.map(gz => (
            <div
              key={gz.id}
              style={{
                ...styles.groundZombie,
                left: `${gz.x}%`
              }}
            >
              🧟
            </div>
          ))}

          {/* 공주 */}
          <div style={{
            ...styles.princess,
            transform: princessAnimation === 'scared' ? 'scale(1.2) translateY(-10px)' : 'scale(1)',
            filter: princessAnimation === 'captured' ? 'brightness(0.3)' : 'brightness(1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {princessAnimation === 'captured' ? '😱' : '👸'}
            </div>
            {groundZombies.length > 0 && princessAnimation !== 'captured' && (
              <div style={styles.princessBubble}>
                큰 일이예요!
              </div>
            )}
          </div>
        </>
      )}

      {/* 승리 화면 */}
      {gameState === 'victory' && (
        <div style={{ ...styles.overlay, background: 'linear-gradient(to bottom, #fbbf24, #fb923c)' }}>
          <Sparkles style={{ position: 'absolute', color: '#fef3c7', animation: 'pulse 2s infinite' }} size={100} />
          <div style={styles.victoryBox}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#6b21a8', marginBottom: '1rem' }}>
              🎉 문장 복원 완료! 🎉
            </h1>
            <div style={{ fontSize: '4rem', margin: '1rem 0' }}>
              <Crown size={80} style={{ color: '#fbbf24', display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: '4rem', margin: '1rem 0' }}>👸🏰</div>
            <p style={{ fontSize: '1.5rem', color: '#7c3aed', margin: '0.5rem 0' }}>"기사님, 감사합니다!"</p>
            <p style={{ fontSize: '1.25rem', color: '#8b5cf6', margin: '0.5rem 0' }}>"한글의 힘이 돌아왔어요!"</p>
            <div style={{ fontSize: '2rem', color: '#6b21a8', fontWeight: 'bold', margin: '1.5rem 0' }}>
              최종 점수: {score}점
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setStage(s => s + 1);
                  startGame();
                }}
                style={{ ...styles.button, backgroundColor: '#7c3aed', color: 'white' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
              >
                다음 스테이지 →
              </button>
              <button
                onClick={() => {
                  setGameState('start');
                  setStage(1);
                  setScore(0);
                  setLives(5);
                  setCombo(0);
                }}
                style={{ ...styles.button, backgroundColor: '#4b5563', color: 'white' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4b5563'}
              >
                처음으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실패 화면 */}
      {gameState === 'defeat' && (
        <div style={{ ...styles.overlay, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div style={styles.defeatBox}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fca5a5', marginBottom: '1rem' }}>
              😢 문장 복원 실패... 😢
            </h1>
            <div style={{ fontSize: '4rem', margin: '1rem 0' }}>👸💔</div>
            <p style={{ fontSize: '1.5rem', color: '#fca5a5', margin: '0.5rem 0' }}>"안 돼...!"</p>
            <div style={{ fontSize: '1.5rem', color: '#fca5a5', margin: '1.5rem 0' }}>
              점수: {score}점
            </div>
            <button
              onClick={startGame}
              style={{ ...styles.button, backgroundColor: '#eab308', color: 'black' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#facc15'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#eab308'}
            >
              다시 도전하기! 💪
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes crawl {
          0%, 100% {
            transform: translateY(-5px);
          }
          50% {
            transform: translateY(5px);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glow {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes descend {
          0% { 
            top: -100px; 
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% { 
            top: 30%; 
            opacity: 1;
          }
        }
        @keyframes firework {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 1; 
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
          }
          100% { 
            transform: scale(0.5) rotate(360deg); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
};

export default KoreanRescueGame;
