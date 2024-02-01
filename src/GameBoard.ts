import Gtk from 'gi://Gtk?version=4.0';
import { Window } from "./window.js";
export class GameBoard {
    private _gridFrame: Gtk.Grid;
    private _cssProvider: Gtk.CssProvider;
    constructor() {
        this._gridFrame = Window._gridFrame;
        this._cssProvider = new Gtk.CssProvider();
        this._cssProvider.load_from_resource('/io/github/GtkChess/styles.css');
        this._initBoard();
    }
    _initBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {

                const button: Gtk.Button = new Gtk.Button;
                button.set_hexpand(true);
                button.set_vexpand(true);

                const context: Gtk.StyleContext = button.get_style_context();

                context.add_class((col % 2 === row % 2) ? 'dark_tile' : 'light_tile');

                const className: string =
                        (col === 0 && row === 0) ? 'border_tl' :
                            (col === 7 && row === 0) ? 'border_tr' :
                                (col === 0 && row === 7) ? 'border_bl' :
                                    (col === 7 && row === 7) ? 'border_br' : 'no_border';

                context.add_class(className);

                context.add_provider(this._cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);


                this._gridFrame.attach(button, col, row, 1, 1);

            }
        }
    }
}
