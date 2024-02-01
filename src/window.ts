// Window.ts
import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import { ChessGame } from './ChessGame.js';

export class Window extends Adw.ApplicationWindow {
    public static _gridFrame: Gtk.Grid; // Als static deklarieren
    static {
        GObject.registerClass(
            {
                Template:
                    'resource:///io/github/GtkChess/window.ui',
                InternalChildren: ['gridFrame'],
            },
            this
        );
    }

    constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProperties>) {
        super(params);
        Window._gridFrame = (this as any)._gridFrame; // Hier setzen
        new ChessGame();
    }
}