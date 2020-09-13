const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const defaultMaxWordLength = 10


export namespace StrGen {

    export function characters(length: number): string {
        let str = ""
        for (let i = 0; i < length; i++) {
            str += letter()
        }
        return str
    }
    
    export function words(words: number, maxLength?: number): string {
        if (maxLength === undefined)
            maxLength = defaultMaxWordLength
        let str = ""
        for (let i = 0; i < words; i++) {
            str += characters(NumGen.int(maxLength))
            // add a space inbetween words
            if (i !== words - 1) {
                str += " "
            }
        }
        return str
    }
    
    function letter(): string {
        return alphabet[NumGen.int(alphabet.length - 1)]
    }

}

export namespace NumGen {
    
    export function int(max: number, min?: number): number {
        if (min === undefined)
            min = 0 
        return Math.round((Math.random() * (max - min)) + min)
    }
    
}