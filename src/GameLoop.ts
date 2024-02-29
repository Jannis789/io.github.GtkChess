// GameLoop.ts
import { _piecesList, _king, Piece, Pawn, Rook, getPieceAt, setPieceAt } from "./Pieces.js";
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
    private castlingPositions: Array<number[]>;
    constructor() {
        this.currentPossibleMoves = [];
        this.castlingPositions = [];
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
                    if (this.castlingPositions) { // castling validation
                        this.castlingPositions.forEach(([castlingX, castlingY]: number[]) => {
                            if (castlingX === x && castlingY === y && _king[isWhitesMove ? "white" : "black"] === this.currentPiece) {
                                const leftRook: Piece | false = getPieceAt(0, castlingY)
                                const rightRook: Piece | false = getPieceAt(7, castlingY);
                                if (castlingX === 1 && leftRook instanceof Rook) {
                                    this.movePieceTo(leftRook, 2, castlingY);
                                    leftRook.isMoved = true;
                                }
                                if (castlingX === 6 && rightRook instanceof Rook) {
                                    this.movePieceTo(rightRook, 5, castlingY);
                                    rightRook.isMoved = true;
                                }
                                _king[isWhitesMove ? "white" : "black"].isMoved = true;
                            }
                        });
                    }
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

        const enemyPieces: Piece[] = _piecesList[currentEnemyColor];
        const [kingX, kingY]: number[] = [_king[currentPlayerColor].x, _king[currentPlayerColor].y];
        const [startX, startY]: number[] = [piece.x, piece.y];

        const validMoves: Array<number[]> = [];

        // gebe richtige castling position wieder
        if (piece === _king[currentPlayerColor] && !_king[currentPlayerColor].isMoved) {
            const playerLeftRook: Piece | false = isWhitesMove ? getPieceAt(0,7) : getPieceAt(0,0);
            const playerRightRook: Piece | false = isWhitesMove ? getPieceAt(7,7) : getPieceAt(7,0);

            if (playerLeftRook instanceof Rook && playerLeftRook.isMoved === false) {
                if ([1, 2, 3].every(i => !getPieceAt(i, piece.y))) {
                    validMoves.push([1, piece.y]);
                    this.castlingPositions.push([1, piece.y]);
                }
            }
            if (playerRightRook instanceof Rook && playerRightRook.isMoved === false) {
                if ([5, 6].every(i => !getPieceAt(i, piece.y))) {
                    validMoves.push([6, piece.y]);
                    this.castlingPositions.push([6, piece.y]);
                }
            }
        }

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
                    if (attackablePiece !== enemyPiece && 
                        enemyPiece.possibleMoves
                            .some(([x, y]) => x === kingX && y === kingY)) {
                                isValidMove = false;
                                break;
                    }
                }
            }

            if (isValidMove) {
                validMoves.push([pieceX, pieceY]);
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