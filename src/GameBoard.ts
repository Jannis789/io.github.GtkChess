import Gtk from 'gi://Gtk?version=4.0';
import { Window } from "./window.js";
import { currentPressedButtonLocation } from "./GameLoop.js";

export class GameBoard {
    private _gridFrame: Gtk.Grid;
    static _cssProvider: Gtk.CssProvider;
    constructor() {
        this._gridFrame = Window._gridFrame;
        GameBoard._cssProvider = new Gtk.CssProvider();
        GameBoard._cssProvider.load_from_resource('/io/github/GtkChess/styles.css');
        this._initBoard();
    }
    _initBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {

                const button: Gtk.Button = new Gtk.Button;
                button.connect('clicked', () => {
                    currentPressedButtonLocation({ x: col, y: row });
                });
                button.set_hexpand(true);
                button.set_vexpand(true);

                const context: Gtk.StyleContext = button.get_style_context();
                
                const tileClass: string = (col % 2 === row % 2) ? 'dark_tile' : 'light_tile';

                const borderClass: string = 
                    (col === 0 && row === 0) ? 'border_tl' :
                    (col === 7 && row === 0) ? 'border_tr' :
                    (col === 0 && row === 7) ? 'border_bl' :
                    (col === 7 && row === 7) ? 'border_br' :
                    'no_border';

                context.add_class(tileClass);
                context.add_class(borderClass);

                context.add_provider(GameBoard._cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);

                this._gridFrame.attach(button, col, row, 1, 1);

            }
        }
    }

    static removeTile(x: number, y: number): void {
        GameBoard.getTile(x, y).set_child(null);
    }

    static getTile(x: number, y: number): Gtk.Button {
        // Assuming this is your original function
        return Window._gridFrame.get_child_at(x, y) as Gtk.Button;
    }
}

