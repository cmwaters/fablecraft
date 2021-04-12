type Command = {
    name: string;
    cmd: () => void;
    aliases: string[];
    icon?: SVGElement
}

export default Command

