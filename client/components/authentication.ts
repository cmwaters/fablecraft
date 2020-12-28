import { el, svg, RedomComponent } from 'redom'
import { Config } from "../config"

export class Login implements RedomComponent {
    el: RedomComponent | HTMLElement | SVGElement

    constructor(loginFunc: (username: string, password: string) => any) {
        this.el = el("div.authentication", [
            el("h1", Config.name),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"})),
                el("input", { id: "username", type: "username", autofocus: true, placeholder: "Username" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
                el("input", { id: "password", type: "password", autofocus: true, placeholder: "Password" }),
            ]),
            el("button", "Login", { onclick: () => { 
                let usernameString = (document.getElementById("username") as HTMLInputElement).value;
                let passwordString = (document.getElementById("password") as HTMLInputElement).value;
                console.log(usernameString)
                console.log(passwordString)
                loginFunc(usernameString, passwordString) 
            }})
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

export class Signup implements RedomComponent {
    el: RedomComponent | HTMLElement | SVGElement

    constructor() {
        this.el = el("div.authentication", [
            el("h1", Config.name),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" })),
                el("input", { type: "username", autofocus: true, placeholder: "Username" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M7 1.414V4H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h5v6h2v-6h3.532a1 1 0 0 0 .768-.36l1.933-2.32a.5.5 0 0 0 0-.64L13.3 4.36a1 1 0 0 0-.768-.36H9V1.414a1 1 0 0 0-2 0zM12.532 5l1.666 2-1.666 2H2V5h10.532z" })),
                el("input", { type: "email", placeholder: "Email" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
                el("input", { type: "passoword", placeholder: "Password" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
                el("input", { type: "password", placeholder: "Confirm Password" }),
            ]),
            el("button", "Sign Up", { onclick: () => { alert("Congrats for joining") } })
        ])
    }
}