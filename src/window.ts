// Window.ts
import { AboutWindow } from 'gi-types/adw1.js';
import { Application } from 'gi-types/gio2.js';
import { ApplicationWindow } from 'gi-types/gtk4.js';
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
            Window
        );
    }

    constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProperties>) {
        super(params);
        Window._gridFrame = (this as any)._gridFrame; 
        new ChessGame();
    }
}