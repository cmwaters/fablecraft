import { RedomComponent, el } from "redom";

export class Panel implements RedomComponent {
    el: HTMLElement;

    constructor() {
        this.el = el("Hello World")
    }
    
    hasFocus(): boolean {
        throw new Error("Method not implemented.");
    }
    focus(): void {
        throw new Error("Method not implemented.");
    }
    blur(): void {
        throw new Error("Method not implemented.");
    }

}