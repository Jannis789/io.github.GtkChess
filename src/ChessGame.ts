// ChessGame.ts
import { GameBoard } from "./GameBoard.js";
import { Pieces } from "./Pieces.js";

export class ChessGame {
    constructor() {
        new GameBoard();
        new Pieces();
    }
}

