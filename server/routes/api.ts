import * as express from "express";
import mongoose from "mongoose";
import passport from "passport";
const router = express.Router();
import { User, UserModel } from '../models/user'
import { Story, StoryModel } from '../models/story';
import { CardModel } from '../models/card';

function ensureAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/auth/login")
}

function hasPermission(permissionLevel: string, userId: User, story: Story): string {
    switch(permissionLevel) {
        case "owner": 
            if (story.owner === userId) {
                return ""
            }
            break;
        case "author":
            for (let i = 0; i < story.authors.length; i++) {
                if (story.authors[i] === userId) {
                    return ""
                }
            }
            return hasPermission("owner", userId, story)
        case "editor":
            for (let i = 0; i < story.editors.length; i++) {
                if (story.editors[i] === userId) {
                    return ""
                }
            }
            return hasPermission("author", userId, story)
        case "viewer":
            for (let i = 0; i < story.viewers.length; i++) {
                if (story.viewers[i] === userId) {
                    return ""
                }
            }
            return hasPermission("editor", userId, story)
    }
    
    return "you don't have permission to do that"
}



router.get("/me", ensureAuthenticated, (req: any, res) => {
    res.json({ id: req.user._id, email: req.user.email });
});

router.delete("/me", ensureAuthenticated, (req: any, res) => {
    UserModel.findByIdAndDelete(req.user._id)
    res.status(201).send({ message: "user deleted"})
})

router.get("/stories", ensureAuthenticated, async (req, res) => { 
    const stories = await StoryModel.find({owner: req.user})
    return res.status(200).send({ stories: stories})
})

router.post("/story", ensureAuthenticated, (req, res) => {
    const { title, description } = req.body
    if (title == null) {
        return res.status(200).send({ error: "title cannot be empty"})
    }
    StoryModel.create({
        title: title,
        description: description,
        owner: req.user
    })
    return res.status(201).send({ message: "success. " + title + " created."})
});

router.delete("/story", ensureAuthenticated, (req, res) => {

});

router.put("/story", ensureAuthenticated, (req, res) => {

});

router.get("/story/:storyId/", ensureAuthenticated, async (req, res) => {
    const story = await StoryModel.findById(req.params.storyId)
    return res.status(200).send({ story: story })
});

router.post("/card", ensureAuthenticated, async (req, res) => {
    let { text, depth, index, story } = req.body
    story = await StoryModel.findById(story)
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

export default router;
