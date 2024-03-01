// GameLoop.ts
import { _piecesList, _king, Rook, Piece, getPieceAt, setPieceAt } from "./Pieces.js";
import { GameBoard } from "./GameBoard.js";
import { GameLoopInstance } from "./ChessGame.js";
import Gtk from 'gi://Gtk?version=4.0';

export let isWhitesMove: boolean = true;

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
    private castlingPositions: Array<number[]>;
    constructor() {
        this.currentPossibleMoves = [];
        this.castlingPositions = [];
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

        this.currentPiece = piece; // Set the new piece as the current piece                             
        this.currentPossibleMoves = this.getValidMoves(piece); // store valid moves in currentPossibleMoves
    
        // highlight possible moves
        this.currentPossibleMoves.forEach(([x, y]: number[]) => {
            this.highlightMove(x, y);
        });
    }

    performCastling(x: number, y: number): void {
        this.castlingPositions.forEach(([castlingX, castlingY]: number[]) => {
            const playerKing: Piece = _king[isWhitesMove ? "white" : "black"];
            if (castlingX === x && castlingY === y && playerKing === this.currentPiece) {
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
                playerKing.isMoved = true;
            }
        });
    }

    tileHandler(x: number, y: number): void {
        const currentPiece: Piece | false = this.currentPiece;
        if (!currentPiece || !this.currentPossibleMoves.some(([possibleX, possibleY]) => possibleX === x && possibleY === y)) {
            return;
        }
        if (this.castlingPositions) { // castling validation
            this.performCastling(x, y);
        }
        this.movePieceTo(currentPiece, x, y);
        const enemyKing = _king[isWhitesMove ? "black" : "white"];
        const checked = currentPiece.possibleMoves.some(([x,y]) => enemyKing.x === x && enemyKing.y === y);
        this.changeTurn();
        if (checked) { // wird erst nach der nächsten Runde überprüft
            const playerPieces = _piecesList[isWhitesMove ? "white" : "black"];
            if (!playerPieces.some(piece => this.getValidMoves(piece).length !== 0)) {
                (console as any).log("checkmate");
            } else {
                (console as any).log("check");
            }
        }
    }
    
    movePieceTo(piece: Piece, x: number, y: number): void {
        GameBoard.removeTile(piece.x, piece.y);                                             // remove old Piece
    
        const attackedPiece: Piece | false = getPieceAt(x, y);
        
        if (attackedPiece) {
            _piecesList[attackedPiece.color] = _piecesList[attackedPiece.color]
                                               .filter((piece: Piece) => piece !== attackedPiece);
        }
    
        if (piece instanceof Piece && !piece.isMoved) {
            piece.isMoved = true;
        }
    
        [piece.x, piece.y] = [x, y];                                                        // set new Coordinates
        const pieceStr: string = `${piece.color}_${piece.constructor.name.toLowerCase()}`;  // constructs the image path
        setPieceAt(pieceStr, x, y);                                                         // sets the image to the new coordinates
    
        this.currentPossibleMoves.forEach(([possibleX, possibleY]: number[]) => {
            this.revertHighlightedMove(possibleX, possibleY);
        });
        this.currentPossibleMoves = [];
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

        const possibleMoves: Array<number[]> = piece.possibleMoves;

        if (this.currentPiece === _king[currentPlayerColor]) {
            this.castlingPositions = _king[currentPlayerColor].getCastlingPositions(piece);
        }

        _king[currentPlayerColor].isAttackable = true;

        for (const [pieceX, pieceY] of possibleMoves) {

            let attackablePiece: Piece | false = getPieceAt(pieceX, pieceY);

            this.simulateMove(piece, pieceX, pieceY);

            let isValidMove: boolean = true;
            if (piece !== _king[currentPlayerColor]) { // für alle anderen Figuren bis auf den König
                isValidMove = !enemyPieces
                // muss ignoriert werden, da in jener Iteration die Figur geschlagen sein wird
                .filter(enemyPiece => attackablePiece !== enemyPiece)
                // keine der gegnerischen möglichen Positionen sollen zum König führen 
                .some(enemyPiece => enemyPiece.possibleMoves
                    .some(([x, y]) => x === kingX && y === kingY));
            } else { // nur für den König

                isValidMove = !enemyPieces
                    // .filter(enemyPiece => attackablePiece !== enemyPiece) // optional da geschlagene Figur vom König (welchen es zum beschützen gilt) geschlagen wird
                    // keine der gegnerischen Züge soll den König besiegen können
                    .some(enemyPiece => enemyPiece.possibleMoves
                        .some(([x, y]) => x === pieceX && y === pieceY));

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