import React from "react";
import Game from "./utils/game";

const Dashboard = () => {
  return (
    <div className="grid h-full place-items-center">
      <div>
        <Game />
      </div>
    </div>
  );
};

export default Dashboard;
