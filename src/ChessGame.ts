// ChessGame.ts
import { GameBoard } from "./GameBoard.js";
import { InitializePieces } from "./Pieces.js";

export class ChessGame {
    constructor() {
        new GameBoard();
        new InitializePieces();
        // new GameLogic();
        // oder new GameLoop();
    }
}

