export const errors = {
    storyAlreadyExists: (id: number) => "story " + id + " already exists", 
    storyNotFound: (id: number) => "story " + id + " not found",
    noStoryLocked: "no story is currently selected",
    nodeNotFound: (id: number) => "node " + id + " not found",
    negativeID: (id: number) => "id " + id + " must be non negative"
}