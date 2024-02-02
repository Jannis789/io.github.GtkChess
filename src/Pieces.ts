import Gtk from 'gi://Gtk?version=4.0';
import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';
import { Window } from "./window.js";


export class Pieces {
    private chessBoard: Array<Array<string | null>> = [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"]
    ]

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
    }
    constructor() {
        this._initPieces();
    }
    getTile(x: number, y: number) {
        return Window._gridFrame.get_child_at(x, y) as Gtk.Button;    
    }

    _initPieces() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pieceString: string | null = this.chessBoard[row][col]; 
                const translatedLetter: string | null = pieceString ? this.letterTranslate[pieceString] : null;
                if (translatedLetter) {
                    this.setPieceAt(translatedLetter, col, row);
                }
            }
        }
    }

    setPieceAt(pieceType: string,x: number, y: number): void {
        const button: Gtk.Button = this.getTile(x,y);

        const resourcePath: string = '/io/github/GtkChess/img/' + pieceType + '.svg';
        const file: Gio.File = Gio.File.new_for_uri('resource://' + resourcePath);
        const inputStream: Gio.InputStream = file.read(null);
        const image: Gtk.Image = new Gtk.Image();

        const pixbuf: GdkPixbuf.Pixbuf = GdkPixbuf.Pixbuf.new_from_stream_at_scale(inputStream, 400, 400, true, null);

        image.set_from_pixbuf(pixbuf);
        button.set_child(image);
    }
}

export function currentPressedButtonLocation(vars: Record<string, number>): void {
  (console as any).log(vars.x, vars.y);
}