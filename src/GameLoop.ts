import { Piece, getPieceAt } from "./Pieces.js";
import { GameBoard } from "./GameBoard.js";
import { GameLoopInstance } from "./ChessGame.js";
import Gtk from 'gi://Gtk?version=4.0';


export function currentPressedButtonLocation(coordinate: Record<string, number>): void {
    const piece = getPieceAt(coordinate.x, coordinate.y);
    if (piece instanceof Piece) {
        GameLoopInstance.pieceHandler(piece);
    }
}

export class GameLoop {
    private _cssProvider: Gtk.CssProvider = GameBoard._cssProvider;
    private currentPiece: Piece | false = false;
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

        this.currentPiece = piece; // set piece to the current piece

        // highlight possible moves
        const possibleMoves: Array<number[]> = this.currentPiece.possibleMoves; 
        possibleMoves.forEach(([x, y]: number[]) => {
           this.highlightMove(x, y); 
        });
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