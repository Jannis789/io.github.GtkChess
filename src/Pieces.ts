import Gtk from 'gi://Gtk?version=4.0';
import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';
import { Window } from "./window.js";
const _piecesList: Record<string, Piece[]> = {
    white: [],
    black: []
};
export class InitializePieces {
    private chessBoard: Array<Array<string | null>> = [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"]
    ];

    private letterTranslate: Record<string, string> = {
        'k': 'black_king',
        'q': 'black_queen',
        'r': 'black_rook',
        'b': 'black_bishop',
        'n': 'black_knight',
        'p': 'black_pawn',
        'K': 'white_king',
        'Q': 'white_queen',
        'R': 'white_rook',
        'B': 'white_bishop',
        'N': 'white_knight',
        'P': 'white_pawn'
    };

    private initPieces(): void {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pieceString: string | null = this.chessBoard[row][col];
                if (!pieceString) {
                    continue;
                }
                const translatedLetter: string = this.letterTranslate[pieceString];
                this.setPieceAt(translatedLetter, col, row);
                const isWhite: boolean = pieceString.toLowerCase() !== pieceString;
                const referenceToValue: Piece[] = isWhite ? _piecesList.white : _piecesList.black;
                const pieceColor: string = isWhite ? "white" : "black";
                switch (pieceString.toLowerCase()) {
                    case 'p':
                        referenceToValue.push(new Pawn(pieceColor, col, row));
                        break;
                    case 'r':
                        referenceToValue.push(new Rook(pieceColor, col, row));
                        break;
                    case 'n':
                        referenceToValue.push(new Knight(pieceColor, col, row));
                        break;
                    case 'b':
                        referenceToValue.push(new Bishop(pieceColor, col, row));
                        break;
                    case 'q':
                        referenceToValue.push(new Queen(pieceColor, col, row));
                        break;
                    case 'k':
                        referenceToValue.push(new King(pieceColor, col, row));
                        break;
                }
                const piece: Piece | false = getPieceAt(col, row);
                if (piece && !isWhite) {
                    piece.setAttackable();
                }
            }
        }
    }
    private getTile(x: number, y: number): Gtk.Button {
        // Assuming this is your original function
        return Window._gridFrame.get_child_at(x, y) as Gtk.Button;
    }

    private setPieceAt(pieceType: string, x: number, y: number): void {
        const button: Gtk.Button = this.getTile(x, y);

        const resourcePath: string = '/io/github/GtkChess/img/' + pieceType + '.svg';
        const file: Gio.File = Gio.File.new_for_uri('resource://' + resourcePath);
        const inputStream: Gio.InputStream = file.read(null);
        const image: Gtk.Image = new Gtk.Image();

        const pixbuf: GdkPixbuf.Pixbuf = GdkPixbuf.Pixbuf.new_from_stream_at_scale(inputStream, 400, 400, true, null);

        image.set_from_pixbuf(pixbuf);
        button.set_child(image);
    }
    constructor() {
        this.initPieces();
    }
}

function getPieceAt(x: number, y: number): Piece | false {
    for (const pieceList of Object.values(_piecesList)) {
        for (const piece of pieceList) {
            if (piece.x === x && piece.y === y) {
                return piece;
            }
        }
    }
    return false;
}

class Piece {
    public color: string;
    public x: number;
    public y: number
    public isAttackable: boolean;
    constructor(color: string, x: number, y: number) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.isAttackable = false;
    }
    isOutsideBoard(x: number, y: number): boolean {
        return (x < 0 || x > 7 || y < 0 || y > 7);
    }

    setAttackable(): void {
        this.isAttackable = true;
    }
    toggleAttackability(): void {
        this.isAttackable = !this.isAttackable;
    }

    isTileAttackable(x: number, y: number): boolean {
        const piece: Piece | false = getPieceAt(x, y);
        // Check if the target square is either occupied by an attackable piece or empty
        // and ensure that the target square is not outside the board
        return ((piece instanceof Piece && piece.isAttackable) || (piece === false)) && !this.isOutsideBoard(x, y);
    }
}

class Pawn extends Piece {
    public isMoved: boolean = false;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.color = color;
    }

    get possibleMoves(): Array<number[]> {
        const possibleMoves: Array<number[]> = [];
        const direction: number = this.color === "white" ? -1 : 1;

        if (!this.isMoved) {
            const doubleMoveY: number = this.y + (direction * 2);
            const newX: number = this.x;
            if (!this.isOutsideBoard(newX, doubleMoveY) && !getPieceAt(newX, doubleMoveY)) {
                possibleMoves.push([newX, doubleMoveY]);
            }
        }

        const newY: number = this.y + direction;

        if (!this.isOutsideBoard(this.x, newY) && !getPieceAt(this.x, newY)) {
            possibleMoves.push([this.x, newY]);
        }

        const rightAttackPiece = getPieceAt(this.x + 1, newY);
        const leftAttackPiece = getPieceAt(this.x - 1, newY);

        if (rightAttackPiece && rightAttackPiece.isAttackable) {
            possibleMoves.push([this.x + 1, newY]);
        }

        if (leftAttackPiece && leftAttackPiece.isAttackable) {
            possibleMoves.push([this.x - 1, newY]);
        }

        return possibleMoves;
    }
}

class Rook extends Piece {
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
    }
}

class Knight extends Piece {
    private knightMoves: Array<number[]>;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    }

    get possibleMoves(): Array<number[]> {
        const possibleMoves: Array<number[]> = [];

        this.knightMoves.forEach(([offsetX, offsetY]: number[]) => {
            const newX: number = this.x + offsetX;
            const newY: number = this.y + offsetY;
            if (this.isTileAttackable(newX, newY)) {
                possibleMoves.push([newX,newY]);
            }
        });
        return possibleMoves;
    }
}

class Bishop extends Piece {
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
    }
}

class Queen extends Piece {
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
    }
}

class King extends Piece {
    private kingMoves: Array<number[]>;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    }

    get possibleMoves(): Array<number[]> {
        const possibleMoves: Array<number[]> = [];
        this.kingMoves.forEach(([offsetX, offsetY]: number[]) => {
            const newX: number = this.x + offsetX;
            const newY: number = this.y + offsetY;
            if (this.isTileAttackable(newX, newY)) {
                possibleMoves.push([newX, newY]);
            }
        });
        return possibleMoves;
    }

}

export function currentPressedButtonLocation(coordinate: Record<string, number>): void {
    const piece = getPieceAt(coordinate.x, coordinate.y);
    if (piece instanceof King) {
        (console as any).log(piece.possibleMoves);
    }
}
