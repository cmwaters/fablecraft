import { el, svg, RedomComponent, mount } from 'redom'
import { Config } from "../config"

export class Login implements RedomComponent {
    el: RedomComponent | HTMLElement | SVGElement
    errorBar: HTMLElement
    callback: (username: string, password: string) => void
    active: boolean = false
    navbar: HTMLElement
    incognitoButton: HTMLElement
    signUpButton: HTMLElement

    constructor(parent: HTMLElement, callback: (username: string, password: string) => void, active = false) {
        this.callback = callback;
        this.errorBar = el("div.error")
        this.el = el("div.authentication", [
            el("h1", Config.name),
            usernameField,
            passwordField,
            this.errorBar,
            el("button", "Login", { onclick: () => { 
                let { username, password } = this.getUserNameAndPassword()
                this.callback(username, password)
            }})
        ])

        mount(parent, this.el)
        this.active = active
    }
    
    error(error: any): void {
        console.log("Login: " + error)
        this.errorBar.style.display = "block";
        this.errorBar.innerText = error
    }

    hasFocus(): boolean {
        return this.active
    }

    focus() {

    }

    blur() {

    }

    key(key: string, shiftMode: boolean, ctrlMode: boolean): void {
        if (key === "Enter") {
            let { username, password } = this.getUserNameAndPassword()
            this.callback(username, password)
        }
        if (this.errorBar.style.display !== "none") {
            this.errorBar.style.display = "none"
        }
    }

    getUserNameAndPassword() {
        let username = (document.getElementById("username") as HTMLInputElement).value;
        let password = (document.getElementById("password") as HTMLInputElement).value;
        return { username, password}
    }
}

export class Signup implements RedomComponent {
    el: RedomComponent | HTMLElement | SVGElement
    errorBar: HTMLElement
    callback: (username: string, email: string, password: string, confirmPassword: string) => void

    constructor(parent: HTMLElement, callback: (username: string, email: string, password: string, confirmPassword: string) => void) {
        this.callback = callback;
        this.errorBar = el("div.error")
        this.el = el("div.authentication", { style: { height: "400px" }}, [
            el("h1", Config.name),
            usernameField,
            emailField,
            passwordField,
            confirmPassword,
            this.errorBar,
            el("button", "Sign Up", { onclick: () => { 
                let {username, email, password, confirmPassword} = this.getValues()
                this.callback(username, email,  password, confirmPassword)
            }, onkeydown: () => {
                alert("Hello World ")
            }})
        ])
        mount(parent, this.el)
    }

    error(error: any): void {
        console.log("Sign up: " + error)
        this.errorBar.style.display = "block";
        this.errorBar.innerText = error
    }

    key(key: string, shiftMode: boolean, ctrlMode: boolean): void {
        if (key === "Enter") {
            let {username, email, password, confirmPassword} = this.getValues()
            this.callback(username, email,  password, confirmPassword)
        }
        if (this.errorBar.style.display !== "none") {
            this.errorBar.style.display = "none"
        }
    }

    getValues(): any {
        let usernameString = (document.getElementById("username") as HTMLInputElement).value;
        let passwordString = (document.getElementById("password") as HTMLInputElement).value;
        let confirmPasswordString = (document.getElementById("confirm-password") as HTMLInputElement).value;
        let emailString = (document.getElementById("email") as HTMLInputElement).value;
        return {usernameString, emailString, passwordString, confirmPasswordString}
    }
}

export class Navbar implements RedomComponent {
    el: HTMLElement;

    constructor(parent: HTMLElement, name: string, onclick: () => void) {
        this.el = el(".navbar", [
            el("button", name, { onclick: () => {
                onclick()
            }})
        ])
        mount(parent, this.el)
    }

    add(name, onclick: () => void) {
        this.el.appendChild(el("button", name, { style: { borderLeft: "1px solid black"}, onclick: () => {
            onclick()
        }}))
    }
}

const usernameField: HTMLElement = el(".field", [
    svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"})),
    el("input", { id: "username", type: "username", autofocus: true, placeholder: "Username" }),
])

const passwordField: HTMLElement = el(".field", [
    svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
    el("input", { id: "password", type: "password", autofocus: true, placeholder: "Password" }),
])

const confirmPassword: HTMLElement = el(".field", [
    svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" })),
    el("input", { id: "confirm-password", type: "password", placeholder: "Confirm Password" }),
])

const emailField: HTMLElement = el(".field", [
    svg("svg", { viewBox: "0 0 16 16", fill: "#bbb" }, svg("path", { d: "M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z" })),
    el("input", { id: "email", type: "email", placeholder: "Email" }),
])