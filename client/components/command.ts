import { el, svg, RedomComponent } from 'redom'
import { ViewComponent } from './view_component'

export class CommandLine implements RedomComponent, ViewComponent {
    el: HTMLElement
    terminal: Terminal;
    card: CardNavigator;
    story: StoryNavigator;
    user: UserNavigator;
    private index: number = 0; // 0 means inactive

    constructor(username: string, currentStory: string, currentCard: number) {
        this.terminal = new Terminal()
        this.card = new CardNavigator(currentCard)
        this.story = new StoryNavigator(currentStory)
        this.user = new UserNavigator(username)

        this.el = el("div.cli", [
            this.user.icon,
            this.user.txt,
            this.story.icon,
            this.story.txt,
            this.card.icon,
            this.card.card,
            this.terminal.icon,
            this.terminal.txt,
        ])
    }

    hasFocus(): boolean {
        return (this.index > 0)
    }

    focus(): void {
        switch (this.index % 4) {
            case 0:
                this.user.blur()
                this.terminal.focus()
                break;
            case 1: 
                this.terminal.blur()
                this.card.focus()
                break;
            case 2:
                this.card.blur()
                this.story.focus()
                break;
            case 3:
                this.story.blur()
                this.user.focus()
                break
        }
        this.index++
    }

    blur(): void {
        this.terminal.blur()
        this.card.blur()
        this.story.blur()
        this.user.blur()
        this.index = 0
    }
}

export class Terminal implements RedomComponent, ViewComponent {
    el: HTMLElement;
    txt: HTMLInputElement;
    icon: SVGElement;
    private active: boolean = false;
    private commands: Command[] = [];

    constructor() {
        this.txt = el("input")
        this.icon = svg("svg", { viewBox: "0 0 16 16", fill: "#333", class: "img" }, [
            svg("path", { d: "M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z" }),
            svg("path", { d: "M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12z" })
        ])
        this.el = el("div", [
            this.icon,
            this.txt
        ])
    }

    onclick(func: () => void) {
        this.txt.onclick = func
        this.icon.onclick = func
    }

    hasFocus(): boolean {
        return this.active
    }

    focus(): void {
        this.active = true;
        this.icon.children[0].setAttribute('d', "M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm9.5 5.5h-3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm-6.354-.354a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146z")
        this.icon.children[1].remove()
        this.txt.focus()
    }

    blur(): void {
        this.active = false
        this.icon.children[0].setAttribute("d", "M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z")
        this.icon.appendChild(svg("path", { d: "M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12z" }))
        this.txt.blur()
        this.txt.value = "";
    }

    setCommands(commands: Command[]) {
        this.commands = commands;
    }

}

export type Command = {
    name: string;
    aliases: string[];
    cmd: () => void
}

export class CardNavigator implements RedomComponent, ViewComponent {
    el: HTMLElement;
    card: HTMLElement;
    icon: SVGElement;
    private active: boolean = false;

    constructor(cardIdx: number) {
        this.icon = svg("svg", { viewBox: "0 0 16 16", fill: "#333", class: "img" }, svg("path", { d: "M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" }))
        this.card = el("div", "#" + cardIdx )
        this.el = el("div", [
            this.icon,
            this.card
        ])
    }

    hasFocus(): boolean {
        return this.active
    }

    focus(): void {
        this.icon.children[0].setAttribute("d", "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z")
    }

    blur(): void {
        this.icon.children[0].setAttribute("d", "M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z")
    }

}

export class StoryNavigator implements RedomComponent, ViewComponent {
    el: HTMLElement;
    txt: HTMLElement;
    icon: SVGElement;
    private active: boolean = false;

    constructor(storyName: string) {
        this.icon = svg("svg", { viewBox: "0 0 16 16", fill: "#333", class: "img" }, svg("path", { d: "M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" }))
        this.txt = el("div", storyName)
        this.el = el("div", [
            this.icon,
            this.txt
        ])
    }

    hasFocus(): boolean {
        return this.active
    }

    focus(): void {
        this.icon.children[0].setAttribute("d", "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z")
    }

    blur(): void {
        this.icon.children[0].setAttribute("d", "M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z")
    }

}

export class UserNavigator implements RedomComponent, ViewComponent {
    el: HTMLElement;
    txt: HTMLElement;
    icon: SVGElement;
    private active: boolean = false;

    constructor(username: string) {
        this.icon = svg("svg", { viewBox: "0 0 16 16", fill: "#333", class: "img" }, svg("path", { d: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" }))
        this.txt = el("div", username)
        this.el = el("div", [
            this.icon,
            this.txt
        ])
    }

    hasFocus(): boolean {
        return this.active
    }

    focus(): void {
        this.icon.children[0].setAttribute("d", "M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z")
    }

    blur(): void {
        this.icon.children[0].setAttribute("d", "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z")
    }

}

