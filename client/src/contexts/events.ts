import { RedomComponent } from "redom"

export interface ListenerElement extends RedomComponent {
    onkeydown?(key: string): void
    onkeyup?(key: string): void
}