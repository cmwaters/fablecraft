import { RedomComponent } from "redom"

export interface Component extends RedomComponent, ListenerComponent { }

export interface ListenerComponent extends RedomComponent {
    onkeydown?(key: string): void
    onkeyup?(key: string): void
}