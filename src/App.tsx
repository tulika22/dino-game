import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface GameState {
  isJumping: boolean;
  jumpHeight: number;
  score: number;
  gameOver: boolean;
  obstacles: { x: number; height: number; width: number }[];
  gameStarted: boolean;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    isJumping: false,
    jumpHeight: 0,
    score: 0,
    gameOver: false,
    obstacles: [],
    gameStarted: false,
  });

  const dinoRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastObstacleTimeRef = useRef<number>(0);
  const jumpStartTimeRef = useRef<number>(0);
  const JUMP_DURATION = 1000; // Total jump duration in milliseconds

  const jump = () => {
    if (!gameState.gameOver && gameState.gameStarted) {
      const currentTime = Date.now();
      
      if (!gameState.isJumping) {
        // Start a new jump
        jumpStartTimeRef.current = currentTime;
        setGameState(prev => ({ ...prev, isJumping: true, jumpHeight: 80 }));
      } else {
        // Increase jump height while already jumping
        const timeElapsed = currentTime - jumpStartTimeRef.current;
        if (timeElapsed < JUMP_DURATION) {
          setGameState(prev => ({ 
            ...prev, 
            jumpHeight: Math.min(prev.jumpHeight + 40, 200)
          }));
        }
      }
    }
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
      score: 0,
      obstacles: [],
      isJumping: false,
      jumpHeight: 0
    }));
    startTimeRef.current = Date.now();
    lastObstacleTimeRef.current = Date.now();
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      isJumping: false,
      jumpHeight: 0,
      score: 0,
      gameOver: false,
      obstacles: [],
    }));
    startTimeRef.current = Date.now();
    lastObstacleTimeRef.current = Date.now();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!gameState.gameStarted) {
          startGame();
        } else if (gameState.gameOver) {
          resetGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameStarted, gameState.gameOver]);

  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const gameLoop = () => {
      setGameState(prev => {
        // Update score
        const newScore = prev.score + 1;
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current;
        
        // Handle jump completion
        if (prev.isJumping) {
          const jumpTimeElapsed = currentTime - jumpStartTimeRef.current;
          if (jumpTimeElapsed >= JUMP_DURATION) {
            return { ...prev, isJumping: false, jumpHeight: 0 };
          }
        }
        
        let newObstacles = [...prev.obstacles];
        
        // Add obstacles after initial delay and then randomly
        if ((elapsedTime > 2000 && newObstacles.length === 0) || 
            (currentTime - lastObstacleTimeRef.current > 3000 && Math.random() < 0.2)) {
          
          // Random number of obstacles (1-3)
          const numObstacles = Math.floor(Math.random() * 3) + 1;
          const spacing = 200; // Space between obstacles
          
          for (let i = 0; i < numObstacles; i++) {
            // Random height between 20 and 60 pixels
            const randomHeight = Math.floor(Math.random() * 40) + 20;
            
            newObstacles.push({
              x: 780 + (i * spacing), // Space out the obstacles
              height: randomHeight,
              width: 20
            });
          }
          
          lastObstacleTimeRef.current = currentTime;
        }

        // Move obstacles
        newObstacles = newObstacles
          .map(obs => ({ ...obs, x: obs.x - 5 }))
          .filter(obs => obs.x > -50);

        // Check collisions
        const dinoElement = dinoRef.current;
        if (dinoElement) {
          const hasCollision = newObstacles.some(obs => {
            const dinoX = 50;
            const dinoWidth = 40;
            const dinoHeight = 40;
            const dinoY = -prev.jumpHeight;
            
            // Check if the dino and obstacle overlap horizontally
            const horizontalOverlap = 
              obs.x < (dinoX + dinoWidth) &&
              (obs.x + obs.width) > dinoX;
            
            // Check if the dino and obstacle overlap vertically
            const verticalOverlap = 
              dinoY >= 0 &&
              dinoY <= obs.height;
            
            return horizontalOverlap && verticalOverlap;
          });

          if (hasCollision) {
            return { ...prev, gameOver: true };
          }
        }

        return {
          ...prev,
          score: newScore,
          obstacles: newObstacles,
        };
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver]);

  return (
    <>
      <div className="game-container">
        <div className="game-area">
          <div className="score">Score: {gameState.score}</div>
          {!gameState.gameStarted && (
            <div className="start-screen">
              <h2>Dino Game</h2>
              <p>Press Space to start</p>
            </div>
          )}
          {gameState.gameOver && (
            <div className="game-over">
              <h2>Game Over!</h2>
              <p>Press Space to restart</p>
            </div>
          )}
          <div className="ground"></div>
          <div
            ref={dinoRef}
            className="dino"
            style={{ transform: `translateY(-${gameState.jumpHeight}px)` }}
          ></div>
          {gameState.obstacles.map((obstacle, index) => (
            <div
              key={index}
              className="cactus"
              style={{
                left: `${obstacle.x}px`,
                height: `${obstacle.height}px`,
                width: `${obstacle.width}px`,
              }}
            ></div>
          ))}
        </div>
      </div>
      <div className="game-guide">
        <h3>How to Play</h3>
        <ul>
          <li>Press <span className="key">Space</span> to start the game</li>
          <li>Press <span className="key">Space</span> to make the dino jump</li>
          <li>Press <span className="key">Space</span> again while in the air to jump higher</li>
          <li>Avoid hitting the obstacles</li>
          <li>Each obstacle cleared gives you 1 point</li>
        </ul>
        <h3>Tips</h3>
        <ul>
          <li>Time your jumps carefully</li>
          <li>Use higher jumps for taller obstacles</li>
          <li>Watch out for groups of obstacles</li>
        </ul>
      </div>
    </>
  );
}

export default App;
