import { el, RedomComponent } from 'redom'

export class Login implements RedomComponent {
    el: RedomComponent | HTMLElement | SVGElement

    constructor() {
        this.el = el("div.login", [
            el("h1", "Fablecraft"),
            // el("hr"),
            el("input", { type: "email", autofocus: true }),
            el("input", { type: "password" })
        ])
    }
    // update?(item: any, index: number, data: any, context?: any): void {
    //     // throw new Error('Method not implemented.')
    // }
    // onmount?(): void {
    //     // throw new Error('Method not implemented.')
    // }
    // onremount?(): void {
    //     // throw new Error('Method not implemented.')
    // }
    // onunmount?(): void {
    //     // throw new Error('Method not implemented.')
    // }
}