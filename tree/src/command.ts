export const NewStoryCommand = {
    name: "new story",
    aliases: ["create story", "insert story"],
    cmd: () => {
        alert("Let's create a new story")
    }
}

export const NewCardCommand = {
    name: "new card",
    aliases: ["create card", "insert card"],
    cmd: () => {
        alert("Let's create a new card")
    }
}

export const SplitCardCommand = {
    name: "split",
    aliases: ["divide"],
    cmd: () => {
        alert("Let's divide this card")
    }
}
