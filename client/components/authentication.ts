import { el, svg, RedomComponent } from 'redom'
import { Config } from "../config"

export class Login implements RedomComponent {
    el: RedomComponent | HTMLElement | SVGElement
    error: HTMLElement

    constructor(callback: (username: string, password: string) => void) {
        this.error = el("div.error")
        this.el = el("div.authentication", { onkeydown: (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                let { username, password } = this.getAndVerify()
                callback(username, password)
            }
            if (this.error.style.display !== "none") {
                this.error.style.display = "none"
            }
        }}, [
            el("h1", Config.name),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"})),
                el("input", { id: "username", type: "username", autofocus: true, placeholder: "Username" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
                el("input", { id: "password", type: "password", autofocus: true, placeholder: "Password" }),
            ]),
            this.error,
            el("button", "Login", { onclick: () => { 
                let { username, password } = this.getAndVerify()
                callback(username, password)
            }})
        ])
    }
    update(error: any): void {
        console.log("Login: " + error)
        this.error.style.display = "block";
        this.error.innerText = error
    }

    getAndVerify() {
        let username = (document.getElementById("username") as HTMLInputElement).value;
        let password = (document.getElementById("password") as HTMLInputElement).value;
        console.log(username)
        console.log(password)
        return { username, password}
    }
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

    constructor(callback: (username: string, email: string, password: string) => void) {
        this.el = el("div.authentication", { style: { height: "400px" }}, [
            el("h1", Config.name),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" })),
                el("input", { id: "username", type: "username", autofocus: true, placeholder: "Username" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z" })),
                el("input", { id: "email", type: "email", placeholder: "Email" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
                el("input", { id: "password", type: "password", placeholder: "Password" }),
            ]),
            el(".field", [
                svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
                el("input", { id: "confirm-password", type: "password", placeholder: "Confirm Password" }),
            ]),
            el("button", "Sign Up", { onclick: () => { 
                let {username, password, email} = this.getAndVerify()
                alert("Congrats for joining")
                callback(username, password, email)
            }, onkeydown: () => {
                alert("Hello World ")
            }})
        ])
    }

    getAndVerify(): any {
        let usernameString = (document.getElementById("username") as HTMLInputElement).value;
        let passwordString = (document.getElementById("password") as HTMLInputElement).value;
        let confirmPasswordString = (document.getElementById("confirm-password") as HTMLInputElement).value;
        let emailString = (document.getElementById("email") as HTMLInputElement).value;
        return {usernameString, emailString, passwordString}
    }
}