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
                const translatedLetter: string | null = this.letterTranslate[pieceString];
                if (!translatedLetter) {
                    continue;
                }
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
            }
        }
        (console as any).log(_piecesList);
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

class Piece {
    private color: string;
    private x: number;
    private y: number;
    constructor(color: string, x: number, y: number) {        
        this.color = color;
        this.x = x;
        this.y = y;
    }
}

class Pawn extends Piece {
    private pieceType: string;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.pieceType = "Pawn";
    }
}

class Rook extends Piece {
    private pieceType: string;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.pieceType = "Rook";
    }
}

class Knight extends Piece {
    private pieceType: string;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.pieceType = "Knight";
    }
}

class Bishop extends Piece {
    private pieceType: string;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.pieceType = "Bishop";
    }
}

class Queen extends Piece {
    private pieceType: string;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.pieceType = "Queen";
    }
}

class King extends Piece {
    private pieceType: string;
    constructor(color: string, x: number, y: number) {
        super(color, x, y);
        this.pieceType = "King";
    }
}

export function currentPressedButtonLocation(coordinate: Record<string, number>): void {
    (console as any).log(coordinate.x, coordinate.y);
}