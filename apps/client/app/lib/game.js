import * as Phaser from "phaser";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.players = {};
  }

  preload() {
    this.load.tilemapTiledJSON("map", "/assets/maps/map1.tmj");
    this.load.image("roombuilder", "/assets/tilesets/roomBuilderTileset.png");
    this.load.image("interiors", "/assets/tilesets/OfficeInteriors.png");
    this.load.spritesheet("player", "/assets/characters/spritesheet.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "map" });
    const roomBuilderTiles = map.addTilesetImage("RoomBuilder", "roombuilder");
    const interiorTiles = map.addTilesetImage("office-interiors", "interiors");

    const layers = [
      { name: "Ground", tileset: [roomBuilderTiles, interiorTiles] },
      {
        name: "Objects-behind-walls",
        tileset: [roomBuilderTiles, interiorTiles],
      },
      { name: "Walls", tileset: [roomBuilderTiles, interiorTiles] },
      {
        name: "Objects-behind-interiors",
        tileset: [roomBuilderTiles, interiorTiles],
      },
      { name: "Interiors", tileset: [roomBuilderTiles, interiorTiles] },
      { name: "Objects", tileset: [roomBuilderTiles, interiorTiles] },
      { name: "Objects-2", tileset: [roomBuilderTiles, interiorTiles] },
      { name: "Objects-3", tileset: [roomBuilderTiles, interiorTiles] },
      { name: "Corners", tileset: [roomBuilderTiles, interiorTiles] },
    ];
    this.mapLayers = {};

    layers.forEach(({ name, tileset }) => {
      const layer = map.createLayer(name, tileset, 0, 0);

      this.mapLayers[name] = layer;
    });

    layers.forEach(({ name, tileset }) => {
      const layer = this.mapLayers[name];
      if (layer) {
        layer.setCollisionByProperty({ collides: true });
        if (tileset.includes([roomBuilderTiles, interiorTiles])) {
          layer.setCollisionBetween(1, 200);
        } else {
          layer.setCollisionBetween(1, 200);
        }
      }
    });

    this.player = this.physics.add.sprite(300, 300, "player"); // Start at (300, 300)
    this.cameras.main.startFollow(this.player);

    const initialPlayerData = {
      x: 300,
      y: 300,
      id: socket.id,
    };

    socket.emit("playerJoin", initialPlayerData);

    socket.on("updatePlayers", (players) => {
      for (let id in this.players) {
        if (!players[id]) {
          this.players[id].destroy();
          delete this.player[id];
        }
      }

      for (let id in players) {
        if (!this.players[id]) {
          const playerData = players[id];
          const newPlayer = this.physics.add.sprite(400, 400, "player");
          this.players[id] = newPlayer;
          console.log(this.players);
        } else {
          const playerData = players[id];
          this.players[id].setPosition(playerData.x, playerData.y);
        }
      }
    });

    layers.forEach(({ name }) => {
      const layer = this.mapLayers[name];
      if (layer) {
        this.physics.add.collider(this.player, layer);
      }
    });

    const animationFrames = {
      "walk-left": { start: 126, end: 129 },
      "walk-right": { start: 112, end: 117 },
      "walk-up": { start: 118, end: 123 },
      "walk-down": { start: 130, end: 135 },
      "idle-left": { start: 2, end: 2 },
      "idle-right": { start: 0, end: 0 },
      "idle-up": { start: 1, end: 1 },
      "idle-down": { start: 3, end: 3 },
    };
    Object.keys(animationFrames).forEach((key) => {
      const { start, end } = animationFrames[key];
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("player", { start, end }),
        frameRate: key.startsWith("walk") ? 8 : 1,
        repeat: key.startsWith("walk") ? -1 : 0,
      });
    });

    var help = this.add.text(16, 16, "Arrow keys to move", {
      fontSize: "14px",
      padding: { x: 10, y: 5 },
      backgroundColor: "#000000",
      fill: "#ffffff",
    });

    help.setScrollFactor(0);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.lastDirection = "down";
  }

  update() {
    const speed = 150;
    this.player.setVelocity(0);

    // Player movement logic
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play("walk-left", true);
      this.lastDirection = "left";
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play("walk-right", true);
      this.lastDirection = "right";
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      this.player.anims.play("walk-up", true);
      this.lastDirection = "up";
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      this.player.anims.play("walk-down", true);
      this.lastDirection = "down";
    } else {
      switch (this.lastDirection) {
        case "left":
          this.player.anims.play("idle-left", true);
          break;
        case "right":
          this.player.anims.play("idle-right", true);
          break;
        case "up":
          this.player.anims.play("idle-up", true);
          break;
        case "down":
          this.player.anims.play("idle-down", true);
          break;
      }
    }
    const playerData = { x: this.player.x, y: this.player.y, id: socket.id };
    socket.emit("movePlayer", playerData);
  }
}

const createGame = () => {
  return new Phaser.Game({
    type: Phaser.AUTO,
    physics: {
      default: "arcade",
      arcade: {
        debug: true,
        gravity: { y: 0 },
      },
    },
    width: 600,
    height: 400,
    scene: GameScene,
    parent: "phaser-container",
  });
};

export default createGame;
