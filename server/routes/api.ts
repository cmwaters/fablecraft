import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from '../models/user'
import { Story, StoryModel } from '../models/story';
import { CardModel } from '../models/card';

// probably should move this to auth
function hasPermission(permissionLevel: string, user: User, story: Story): boolean {
    switch(permissionLevel) {
        case "owner": 
            if (story.owner._id == user._id) {
                return true
            }
            break;
        case "author":
            for (let i = 0; i < story.authors.length; i++) {
                if (story.authors[i]._id == user._id) {
                    return true
                }
            }
            return hasPermission("owner", user, story)
        case "editor":
            for (let i = 0; i < story.editors.length; i++) {
                if (story.editors[i]._id == user._id) {
                    return true
                }
            }
            return hasPermission("author", user, story)
        case "viewer":
            for (let i = 0; i < story.viewers.length; i++) {
                if (story.viewers[i]._id == user.id) {
                    return true
                }
            }
            return hasPermission("editor", user, story)
    }
    
    return false
}

router.get("/me", (req: any, res) => {
    res.json({ 
        message: "user profile",
        user: req.user,
        token: req.query.token
    });
});

router.put("/me", async (req: any, res) => {
    const { email, password, name } = req.body
    try {
        const salt = randomBytes(32);
        const passwordHashed = await argon2.hash(password, { salt });
        UserModel.findByIdAndUpdate(req.user._id, 
        { 
            email: email,
            password: passwordHashed,
            name: name,
        })
        res.json({
            message: "successfully updated account",
            user: req.user,
        })
    } catch(e) {
        console.log(e)
        res.json({
            message: "error changing account details",
            error: e
        })
    }
})

router.delete("/me", (req: any, res) => {
    UserModel.findByIdAndDelete(req.user._id)
    res.status(201).send({ message: "user deleted"})
})

// we should just abbreviate this call to showing only a few details of each story and a later call to load the actual story
router.get("/stories", async (req, res) => { 
    if (req.user === undefined) {
        return res.status(200).send({message: "error: user not found"})
    }
    let user = req.user as User
    const stories = await StoryModel.find({owner: user._id})
    return res.status(200).send({ stories: stories})
})

router.post("/story", (req, res) => {
    const { title, description } = req.body
    if (title == null) {
        return res.status(200).send({ error: "title cannot be empty"})
    }
    StoryModel.create({
        title: title,
        description: description,
        owner: req.user._id,
    })
    return res.status(201).send({ message: "success. " + title + " created."})
});

router.delete("/story/:id", async (req, res) => {
    const id = req.params.id 
    if (id !== undefined) {
        await StoryModel.findById(id, (err, story: Story) => {
            if (err) {
                console.log(err)
                return res.status(500).json({
                    message: "unable to delete story",
                    error: err
                })
            } else if (story === null) {
                return res.json({message: "story with id: " + id + " does not exist"})
            } else if (story.owner !== req.user._id) {
                return res.json({message: "you don't have permissions to delete this story"})
            } else {
                StoryModel.deleteOne(story)
                return res.status(201).send({message: "story deleted"})
            }
        })
    }
    return res.status(500).send({message: "no story id provided in params"})
});

router.put("/story/:id:", async (req, res) => {
    let { title, description } = req.body
    StoryModel.findByIdAndUpdate({id: req.params.id}, {title: title, description: description}, (err, result) => {
        if (err) {
            res.status(500).send({message: err})
        } else {
            res.status(200).send({message: result})
        }
    })

});

router.get("/story/:id", async (req, res) => {
    const story = await StoryModel.findById(req.params.id)
    if (story === null) {
        return res.status(200).send({ message: "story does not exist" })
    }
    if (!hasPermission("viewer", req.user as User, story)) {
        console.log("user doesn't have permission: " + req.user._id)
        return res.status(200).send({ message: "story does not exist" })
    }
    return res.status(200).send({ story: story })
});

// create a card
router.post("/story/:id/card", async (req, res) => {
    let { text, depth, index, parentIndex } = req.body
    let story = await StoryModel.findById(req.params.id)
    if (story === null) {
        return res.status(200).send({ message: "story not found."})
    }
    let result = hasPermission("author", req.user as User, story)
    if (result !== null) {
        return res.status(401).send({ message: result })
    }
    const newCard = new CardModel({
        text: text,
        depth: depth,
        index: index,
        owner: req.user,
        story: story
    })
    newCard.save()
    return res.status(201).send({ message: "success. created card." })
})

// delete a card
router.delete("/story/:id/card", async (req, res) => {
    let { text, depth, index, parentIndex } = req.body
    let story = await StoryModel.findById(req.params.id)
    if (story === null) {
        return res.status(200).send({ message: "story not found."})
    }
    let result = hasPermission("author", req.user as User, story)
    if (result !== null) {
        return res.status(401).send({ message: result })
    }

    console.log("delete card at index " + index)
})

// edit a card
router.put("/story/:id/card", async (req, res) => {
    let { text, depth, index, parentIndex } = req.body
    let story = await StoryModel.findById(req.params.id)
    if (story === null) {
        return res.status(200).send({ message: "story not found."})
    }
    let result = hasPermission("author", req.user as User, story)
    if (result !== null) {
        return res.status(401).send({ message: result })
    }

    console.log("edit card at index " + index)
})

export default router;
