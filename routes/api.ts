import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Graph } from "../services/graph";

router.get("/user", (req: any, res) => {
    res.status(200).send(req.user);
});

router.put("/user", async (req: any, res) => {
    const { email, password, name } = req.body;
    try {
        const salt = randomBytes(32);
        const passwordHashed = await argon2.hash(password, { salt });
        await UserModel.findByIdAndUpdate(
            req.user._id,
            {
                email: email,
                password: passwordHashed,
                name: name,
            },
            (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send();
                }
            }
        );
        return res.status(204).send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.delete("/user", async (req: any, res) => {
    await UserModel.findByIdAndDelete(req.user._id, (err) => {
        if (err) console.log(err);
        res.status(500).send();
    });
    res.status(204).send();
});

router.get("/story", async (req, res) => {
    let graph = await Graph.getAllStories(req.user as User,);
    graph.send(res);
});

router.post("/story", async (req, res) => {
    const { title, description } = req.body;
    console.log("Creating story")
    console.log(req.body)
    let graph = await Graph.createStory(req.user as User, title, description);
    graph.send(res);
});

router.get("/story/:id", async (req, res) => {
    let graph = await Graph.loadFromStory(req.user as User, req.params.id);
    graph.send(res);
});

router.delete("/story/:id", async (req, res) => {
    let graph = await Graph.loadFromStory(req.user as User, req.params.id);
    await graph.remove();
    graph.send(res);
});

router.put("/story/:id/", async (req, res) => {
    let graph = await Graph.loadFromStory(req.user as User, req.params.id);
    await graph.modify(req.body.title, req.body.description);
    graph.send(res);
});

router.post("/story/:id/permissions", async (req, res) => {
    const { user, permission } = req.body; // used is the id
    let graph = await Graph.loadFromStory(req.user as User, req.params.id);
    await graph.addPermission(user, permission);
    graph.send(res);
});

router.delete("/story/:id/permissions", async (req, res) => {
    const { user } = req.body; // should be a user id
    let graph = await Graph.loadFromStory(req.user as User, req.params.id);
    await graph.removePermission(user, req.user as User);
    graph.send(res);
});

router.get("/cards/:storyID", async (req, res) => {
    let graph = await Graph.loadFromStory(req.user as User, req.params.storyID);
    await graph.cards();
    graph.send(res);
});

// creates a card above a sibling
router.post("/card/above", async (req, res) => {
    let { story, sibling, text } = req.body;
    let graph = await Graph.loadFromStory(req.user as User, story);
    await graph.addCardAbove(sibling, text);
    graph.send(res);
});

// creates a card below a sibling
router.post("/card/below", async (req, res) => {
    let { story, sibling, text } = req.body;
    let graph = await Graph.loadFromStory(req.user as User, story);
    await graph.addCardBelow(sibling, text);
    graph.send(res);
});

// creates a card that is the child of a card
router.post("/card/child", async (req, res) => {
    let { story, parent, text } = req.body;
    let graph = await Graph.loadFromStory(req.user as User, story);
    await graph.addCardChild(parent, text);
    graph.send(res);
});

// creates a card that becomes the parent of the child
router.post("/card/parent", async (req, res) => {
    let { story, child, text } = req.body;
    let graph = await Graph.loadFromStory(req.user as User, story);
    await graph.addCardParent(child, text);
    graph.send(res);
});

// gets a card (note: probably won't be used that often)
router.get("/card/:id", async (req, res) => {
    let graph = await Graph.loadFromCard(req.user as User, req.params.id);
    graph.send(res);
});

// moves the card one index smaller (or one card higher)
router.put("/card/:id/move-up", async (req, res) => {
    let graph = await Graph.loadFromCard(req.user as User, req.params.id);
    await graph.moveCardUp();
    graph.send(res);
});

// moves the card one index greater (or one card lower)
router.put("/card/:id/move-down", async (req, res) => {
    let graph = await Graph.loadFromCard(req.user as User, req.params.id);
    await graph.moveCardDown();
    graph.send(res);
});

// edits a card's text
router.put("/card/:id", async (req, res) => {
    const { text } = req.body;
    let graph = await Graph.loadFromCard(req.user as User, req.params.id);
    await graph.updateCard(text);
    graph.send(res);
});

// deletes a card and recursively deletes all children
router.delete("/card/:id", async (req, res) => {
    let graph = await Graph.loadFromCard(req.user as User, req.params.id);
    await graph.removeCard();
    graph.send(res);
});

// -------------------------------- FUTURE API's --------------------------------

router.post("/card:id/comment", async (req, res) => {
	res.status(200).send();
});

router.put("/card/:id/comment", async (req, res) => {
	res.status(200).send();
});

router.delete("/card/:id/comment", async (req, res) => {
	res.status(200).send();
})

router.post("/card/:id/suggestion", async (req, res) => {
	res.status(200).send();
})

router.put("/card/:id/suggestion", async (req, res) => {
	res.status(200).send();
})

router.delete("/card/:id/suggestion", async (req, res) => {
	res.status(200).send();
})

export default router;
