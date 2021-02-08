export type Config = {
    card: {
        width: {
            min: number;
            max: number;
        };
    };
    margin : {
        pillar: number,
        family: number
        card: number
    }
    frameRate: number
    transitionTime: number
};

function defaultConfig(): Config {
    return { 
        card: {
            width: {
                min: 300,
                max: 600
            }
        },
        margin: {
            pillar: 60,
            family: 20,
            card: 10
        }, 
        frameRate: 30,
        transitionTime: 300
    }
}

export type PillarConfig = {
    family: FamilyConfig
    width: number,
    center: number
    transitionTime: number
    frameRate: number
}

export type FamilyConfig = {
    card: CardConfig
    margin: number
}

export type CardConfig = {
    margin: number
}

export type Options = {

}

