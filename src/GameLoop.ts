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
    private currentPossibleMoves: Array<number[]>;
    private currentPiece: Piece | false;
    private isInCheck: boolean;

    constructor() {
        this.currentPossibleMoves = [];
        this.isInCheck = false;
        this.currentPiece = false;
    }

    pieceHandler(piece: Piece): void {
        // Piece is allready cached
        if (this.currentPiece && this.currentPiece === piece) {
            return;
        }
        // if a selection exists, revert it
        if (this.currentPiece) {
            this.currentPossibleMoves.forEach(([x, y]: number[]) => {
                this.revertHighlightedMove(x, y);
            });
        }

        this.currentPiece = piece; // Set the new piece as the current piece                                                    // set piece as the current piece
        this.currentPossibleMoves = this.getValidMoves(piece); // store valid moves in currentPossibleMoves

        // highlight possible moves
        this.currentPossibleMoves.forEach(([x, y]: number[]) => {
            this.highlightMove(x, y);
        });
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
        let attackedPiece: Piece | false = getPieceAt(x, y);
        if (attackedPiece) {
            // entferne Instanz aus _piecesList
            _piecesList[attackedPiece.color].splice(_piecesList[attackedPiece.color].indexOf(attackedPiece), 1);                                                           // Hier muss es eine bessere Lösung geben!
        }

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

    // Diese Methode ermittelt die gültigen Züge für eine Schachfigur
    getValidMoves(piece: Piece): Array<number[]> {
        const currentEnemyColor: string = isWhitesMove ? "black" : "white";
        const currentPlayerColor: string = isWhitesMove ? "white" : "black";

        const enemyPieces = _piecesList[currentEnemyColor];
        const [kingX, kingY] = [_king[currentPlayerColor].x, _king[currentPlayerColor].y];
        const [startX, startY] = [piece.x, piece.y];

        const validMoves: Array<number[]> = [];

        const possibleMoves: Array<number[]> = piece.possibleMoves;

        _king[currentPlayerColor].isAttackable = true;

        for (const [pieceX, pieceY] of possibleMoves) {

            let attackablePiece: Piece | false = getPieceAt(pieceX, pieceY);

            this.simulateMove(piece, pieceX, pieceY);

            let isValidMove: boolean = true;
            if (piece === _king[currentPlayerColor]) {
                // Prüfe, ob der König nicht in einem bedrohten Feld landet
                if (enemyPieces
                    .some(enemyPiece => enemyPiece.possibleMoves
                        // überprüft nur angreifende Figur mit gegnerische Angriffskoordinaten, da König die angreifende Figur ist
                        .some(([x, y]) => x === pieceX && y === pieceY))) {
                    isValidMove = false;
                }
            } else {
                // Überprüfe, ob irgendein Zug die Position des Königs bedroht
                for (const enemyPiece of enemyPieces) {
                    if (attackablePiece !== enemyPiece) {
                        if (enemyPiece.possibleMoves.some(([x, y]) => x === kingX && y === kingY)) {
                            isValidMove = false;
                            break;
                        }
                    }
                }
            }

            if (isValidMove) {
                validMoves.push([pieceX, pieceY]);
            }
        }

        if (piece.constructor.name === "King") {
            (console as any).log(true);
            const playerLeftRook = isWhitesMove ? getPieceAt(0,7) : getPieceAt(0,0);
            const playerRightRook = isWhitesMove ? getPieceAt(7,7) : getPieceAt(7,0);
            if (playerLeftRook) {
                // Feld 1 bis inklusive 3 darf nicht besetzt sein
                for (let i = 1 ; i <= 3 ; i++) {
                }
            }
            if (playerRightRook) {
                // Feld 5 bis inklusive 6 darf nicht besetzt sein
                for (let i = 5 ; i <= 6 ; i++) {
                }
            }
        }
        this.simulateMove(piece, startX, startY);
        _king[currentPlayerColor].isAttackable = false;

        return validMoves;
    }




    simulateMove(piece: Piece, x: number, y: number): void {
        [piece.x, piece.y] = [x, y];
    }
    
    get checkForCheck(): boolean {
        const currentEnemyColor: string = isWhitesMove ? "black" : "white";
        const currentPlayerColor: string = isWhitesMove ? "white" : "black";
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
