"use client";

import { useEffect } from "react";
import createGame from "../../lib/game";

const Game = () => {
  useEffect(() => {
    const game = createGame();
    return () => game.destroy(true); // Cleanup game instance
  }, []);

  return (
    <div className=" grid  place-items-center h-screen">
      <div id="phaser-container"></div>
    </div>
  );
};

export default Game;
