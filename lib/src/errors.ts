export const errors = {
    invalidPos: "invalid position. It must be non negative",
    indexOutOfBounds: "node's index position is out of bounds",
    oneRootFamily: "only one family allowed in root pillar. Family must be equal to 0 when depth is 0",
    orphanNode: "nodes family number doesn't correlate to a parent of an earlier pillar",
    orphanNodef: (got: number, last: number) => {
        return errors.orphanNode + ". Last parent index: " + last + ", node family: " + got
    },
    depthExceeded: "node's depth exceeds amount of pillars",
    depthExceededf: (got: number, max: number) => {
        return errors.depthExceeded + ". Must be " + max + " or less. Got " + got
    }
}