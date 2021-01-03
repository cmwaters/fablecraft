export type Card = {
    _id: string;
    text: string;
    story: string;
    depth: number;
    index: number;
    parent ?: string;
    children ?: string[]; // unordered list of children
    above ?: string;
    below ?: string;
}