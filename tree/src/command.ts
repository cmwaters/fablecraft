export const NewStoryCommand = {
    name: "New Story",
    cmd: () => {
        alert("Let's create a new story")
    }
}

export const NewCardCommand = {
    name: "New Card",
    cmd: () => {
        alert("Let's create a new card")
    }
}

export const SplitCardCommand = {
    name: "Split",
    cmd: () => {
        alert("Let's divide this card")
    }
}

const BaseCommands = [NewCardCommand, NewStoryCommand, SplitCardCommand]
export default BaseCommands