import { Events } from "./events"
import { Command } from "../lib/quill/commandline"

export type Config = {
    card: {
        width: {
            min: number;
            max: number;
        };
        updateFrequency: number;
    };
    margin : {
        pillar: number;
        family: number;
        card: number;
    }
    frameRate: number;
    transitionTime: number;
    inverseScrollSpeed: number;
};

export function defaultConfig(): Config {
    return { 
        card: {
            width: {
                min: 250,
                max: 400
            },
            updateFrequency: 2000,  // every 2 seconds
        },
        margin: {
            pillar: 10,
            family: 40,
            card: 10
        }, 
        frameRate: 30,
        transitionTime: 300,
        inverseScrollSpeed: 2
    }
}

export type PillarConfig = {
    family: FamilyConfig
    width: number,
    centerY: number
    transitionTime: number
    frameRate: number
}

export type FamilyConfig = {
    card: CardConfig
    margin: number
}

export type CardConfig = {
    margin: number
    updateFrequency: number,
}

export type Options = {
    events?: Events 
    commands?: Command[]
}

