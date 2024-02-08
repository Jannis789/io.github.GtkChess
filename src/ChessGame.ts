// ChessGame.ts
import { GameBoard } from "./GameBoard.js";
import { InitializePieces } from "./Pieces.js";
import { GameLoop } from "./GameLoop.js";

export let GameLoopInstance: GameLoop;
export class ChessGame {
    constructor() {
        new GameBoard();
        new InitializePieces();
        GameLoopInstance = new GameLoop();
    }
}

