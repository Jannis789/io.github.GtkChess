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
        // if a selection exists, revert it
        if (this.currentPiece) {
            const possibleMoves: Array<number[]> = this.getValidMoves(this.currentPiece); 
            possibleMoves.forEach(([x, y]: number[]) => {
                this.revertHighlightedMove(x, y);
            });
        }

        this.currentPiece = piece;                                                          // set piece as the current piece

        // highlight possible moves
        const possibleMoves: Array<number[]> = this.getValidMoves(this.currentPiece); 
        possibleMoves.forEach(([x, y]: number[]) => {
           this.highlightMove(x, y); 
        });

        // put possibleMoves in currentPossibleMoves
        this.currentPossibleMoves = this.getValidMoves(piece);
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
            attackedPiece.x = -99;                                                           // Hier muss es eine bessere Lösung geben!
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

    // muss vor einer änderung von isAttackable gespeichert werden
    const possibleMoves: Array<number[]> = piece.possibleMoves; 

    _king[currentPlayerColor].isAttackable = true;

    for (const [pieceX, pieceY] of possibleMoves) {
        // wenn eine Figur angegriffen wird, wird diese später übersprungen
        let attackablePiece: Piece | false = getPieceAt(pieceX, pieceY);
        
        // summuliert ein Zug aus der possibleMoves Array
        this.simulateMove(piece, pieceX, pieceY);

        let isValidMove: boolean = true; 

        for (const enemyPiece of enemyPieces) {
            if (attackablePiece !== enemyPiece) { // hier wird die geschlagende Figur übersprungen, sie kann ja nicht mehr schlagen
                if (enemyPiece.possibleMoves
                    .some(([x, y]) => x === kingX && y === kingY)) { // wenn irgendein möglicher Angriff die Position des Königs entspricht, ist es kein gültiger Zug
                        isValidMove = false; 
                        break;
                }
            }
        }

        if (isValidMove) {
            validMoves.push([pieceX, pieceY]); // wenn gültig darf füge es zu den validMoves hinzu
        } 
    }
    this.simulateMove(piece, startX, startY); // zuruecksetzen
    _king[currentPlayerColor].isAttackable = false; // zuruecksetzen
    return validMoves;
}
    


    simulateMove(piece: Piece, x: number, y: number): void {
        [piece.x, piece.y] = [x, y];
    }

    /*
        --!> Herangehensweise für die Prävention von ungültigen Zügen <!--

    ## König Figur bewegt sich:

    Der pieceHandler selektiert den König.
    Der König soll angreifbar gemacht werden, während die gegnerischen Figuren nicht angreifbar sein sollen. (Da diese auf ihre angreifbarkeit überprüft werden)
    Der ausgewählte König (vom pieceHandler) wird zu allen möglichen Positionen geschickt.
    nach jeder Positionsänderung: (Es sollen mehrere Rückgaben stattfinden zu den jeweiligen möglichen Positionen gehöhren, daher wird ein foreach-Loop verwendet und keine for...of-Schleife.)
    	bekomme alle möglichen angrifspositionen von den gegnerischen Figuren
    	gucke ob irgendeine angriffsposition die des bewegten Königs entspricht
    		Falls ja: wird false zurückgegeben
    		sonst: wird true zurückgegeben und die position wird als möglicher Zug makiert

    ## Andere Figur bewegt sich: ***

    Der pieceHandler selektiert eine Figur.
    Der König soll angreifbar gemacht werden, während die gegnerischen Figuren nicht angreifbar sein sollen. (Da diese überprüft werden)
    Die ausgewählte Figur (vom pieceHandler) wird zu allen möglichen Positionen geschickt.
    nach jeder Positionsänderung: (Es sollen mehrere Rückgaben stattfinden zu den jeweiligen möglichen Positionen gehöhren, daher wird ein foreach-Loop verwendet und keine for...of-Schleife.)
    	bekomme alle möglichen angrifspositionen von den gegnerischen Figuren
    	gucke ob irgendeine angriffsposition die des eignene Königs entspricht
    		Falls ja: wird false zurückgegeben
    		sonst: wird true zurückgegeben und die position wird als möglicher Zug makiert
    */
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