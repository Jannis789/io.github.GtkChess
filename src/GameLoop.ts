import { _piecesList, _king, Piece, Pawn, getPieceAt, setPieceAt } from "./Pieces.js";
import { GameBoard } from "./GameBoard.js";
import { GameLoopInstance } from "./ChessGame.js";
import Gtk from 'gi://Gtk?version=4.0';


let isWhitesMove: boolean = true;

export function currentPressedButtonLocation(coordinate: Record<string, number>): void {
    const piece = getPieceAt(coordinate.x, coordinate.y);
    if (piece instanceof Piece && piece.color === (isWhitesMove ? "white" : "black")) {
        GameLoopInstance.pieceHandler(piece);
    } else {
        GameLoopInstance.tileHandler(coordinate.x, coordinate.y);
    }
}

export class GameLoop {
    private _cssProvider: Gtk.CssProvider = GameBoard._cssProvider;
    private currentPiece: Piece | false = false;
    private currentPossibleMoves: Array<number[]> = [];
    private isInCheck = false;

    constructor() {
        this._cssProvider;
    }

    pieceHandler(piece: Piece): void {
        // if a selection exists, revert it
        if (this.currentPiece) {
            const possibleMoves: Array<number[]> = this.currentPiece.possibleMoves; 
            possibleMoves.forEach(([x, y]: number[]) => {
                this.revertHighlightedMove(x, y);
            });
        }

        this.currentPiece = piece;                                                          // set piece as the current piece

        // highlight possible moves
        const possibleMoves: Array<number[]> = this.currentPiece.possibleMoves; 
        possibleMoves.forEach(([x, y]: number[]) => {
           this.highlightMove(x, y); 
        });

        // put possibleMoves in currentPossibleMoves
        this.currentPossibleMoves = possibleMoves;
    }

    tileHandler(x: number, y: number): void {
        if (this.currentPossibleMoves.length > 0) {
            for (const [possibleX, possibleY] of this.currentPossibleMoves) {
                if (this.currentPiece && x === possibleX && y === possibleY) {
                    this.movePieceTo(this.currentPiece, x, y);
                    this.changeTurn();
                    return;
                } 
            }
        }
    }


    movePieceTo(piece: Piece, x: number, y: number): void {
        GameBoard.removeTile(piece.x, piece.y);                                             // remove old Piece

        // if piece is instance of Pawn, set isMoved to true to change the movement behavior
        if (piece instanceof Pawn && piece.isMoved === false) {
            piece.isMoved = true;
        }

        [piece.x, piece.y] = [x, y];                                                        // set new Coordinates
        const pieceStr: string = piece.color + "_" + piece.constructor.name.toLowerCase();  // cunstructs the image path
        setPieceAt(pieceStr, x, y);                                                         // sets the image to the new coordinates

        // revert highlighted moves
        if (this.currentPossibleMoves.length > 0) { 
            this.currentPossibleMoves.forEach(([possibleX, possibleY]: number[]) => {
                this.revertHighlightedMove(possibleX, possibleY);
            });
        }

        // clear currentPossibleMoves
        this.currentPossibleMoves = [];
        if (this.checkForCheck) {
            this.isInCheck = true;
            (console as any).log("CHECK");
        }
    }

    changeTurn(): void {
        isWhitesMove = !isWhitesMove;                                                       // switch turn to next player's turn
        for (const pieceList of Object.values(_piecesList)) {                               // toggle attackability
            for (const piece of pieceList) {
                piece.toggleAttackability();
            }
        }
    }

    get checkForCheck(): boolean {
        const currentEnemyColor = isWhitesMove ? "black" : "white";
        const currentPlayerColor = isWhitesMove ? "white" : "black";
        for (const piece of _piecesList[currentPlayerColor]) {
            for (const [possibleX, possibleY] of piece.possibleMoves) {
                if ((possibleX === _king[currentEnemyColor].x && possibleY === _king[currentEnemyColor].y)) {
                    return true;
                }
            }
        }
        return false;
    }
    highlightMove(x: number, y: number): void {
        const button: Gtk.Button = GameBoard.getTile(x, y);
        const context: Gtk.StyleContext = button.get_style_context();
        context.add_class('possible_move');
    }
    revertHighlightedMove(x: number, y: number): void {
        const button: Gtk.Button = GameBoard.getTile(x, y);
        const context: Gtk.StyleContext = button.get_style_context();
        context.remove_class('possible_move');
    }
}