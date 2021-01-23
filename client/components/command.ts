import { el, svg, RedomComponent, mount } from 'redom'
import { ViewComponent } from './view_component'

export class CommandLine implements RedomComponent, ViewComponent {
    el: HTMLElement;
    txt: HTMLInputElement;
    icon: SVGElement;
    private active: boolean = false;
    private commands: Command[] = [];

    constructor(parent: HTMLElement) {
        this.txt = el("input")
        this.icon = svg("svg", { viewBox: "0 0 16 16", fill: "#333", class: "img" }, [
            svg("path", { d: "M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z" }),
            svg("path", { d: "M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12z" })
        ])
        this.el = el("div.cli",
            el("div.cli-inner", [
                this.icon,
                this.txt  
            ])
        )
        mount(parent, this.el)
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

    key(key: string, shiftMode: boolean, ctrlMode: boolean) {
        
    }

}

export type Command = {
    name: string;
    aliases: string[];
    cmd: () => void
}



