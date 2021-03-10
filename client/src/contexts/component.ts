import { RedomComponent } from "redom"
import { ListenerElement } from "./events";

export interface Component extends RedomComponent, ListenerElement {}