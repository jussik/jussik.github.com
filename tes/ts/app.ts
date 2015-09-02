﻿module Tesp {
    export type ChangeListener = (reason: ChangeReason) => void;
    export enum ChangeReason { SourceChange, DestinationChange, MarkChange, FeatureChange, PathUpdate }

    /** Core TESPathfinder application */
    export class Application {
        loaded: Promise<Application>;
        context: Context;
        features: IFeatureList;
        world: World;
        controls: Controls;
        map: Map;
        menu: ContextMenu;

        private listeners: ChangeListener[] = [];

        constructor() {
            this.loaded = window.fetch("data/data.json")
                .then(res => res.json())
                .then(data => {
                    this.context = new Context(this);
                    this.features = Features.init();
                    this.world = new World(this, <IWorldSource><any>data);
                    this.map = new Map(this, document.getElementById("map"));
                    this.controls = new Controls(this, document.getElementById("controls"));
                    this.menu = new ContextMenu(this, document.getElementById("context-menu"));

                    document.body.onmousedown = document.body.oncontextmenu = () => {
                        // TODO: refactor into their respective classes
                        this.menu.hide();
                        this.controls.clearSearch();
                    }
                    this.toggleBodyClass("loading", false);
                    return this;
                });
        }

        /** Listen for application level changes */
        addChangeListener(listener: ChangeListener) {
            this.listeners.push(listener);
        }
        /** Inform all listeners about a new change */
        triggerChange(reason: ChangeReason) {
            this.listeners.forEach(fn => fn(reason));
        }

        /** Toggle a class attribute name in the document body */
        toggleBodyClass(name: string, enabled: boolean) {
            if (enabled) {
                document.body.classList.add(name);
            } else {
                document.body.classList.remove(name);
            }
        }
    }

    /** The current instance of the application, for debugging purposes only */
    export var app = new Application();
}