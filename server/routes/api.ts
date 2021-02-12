import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Querier } from "../services/querier";
import { Document } from "../services/document";

router.get("/user", (req: any, res) => {
    res.status(200).send(req.user);
});

router.get("user/exists", async (req: any, res) => {
    let resp = await Querier.checkUsername(req.body.username)
    res.status(resp.status).send(resp.body)
})

router.put("/user/password", async (req: any, res) => {
    let resp = await Querier.changePassword(req.user as User, req.body.password)
    res.status(resp.status).send(resp.body)
});

router.put("/user/username", async (req: any, res) => {
    let resp = await Querier.changeUsername(req.user as User, req.body.username)
    res.status(resp.status).send(resp.body)
})

router.put("user/email", async (req, res) => {
    let resp = await Querier.changeEmail(req.user as User, req.body.email)
    res.status(resp.status).send(resp.body)
})

router.put("user/name", async (req, res) => {
    let resp = await Querier.changeName(req.user as User, req.body.name)
    res.status(resp.status).send(resp.body)
})

router.delete("/user", async (req: any, res) => {
    let resp = await Querier.deleteUser(req.user as User)
    res.status(resp.status).send(resp.body)
});

router.get("/document", async (req, res) => {
    let resp = await Querier.getDocumentHeaders(req.user as User)
    res.status(resp.status).send(resp.body)
});

router.post("/document", async (req, res) => {
    let resp = await Querier.createDocument(req.user as User, req.body.title)
    res.status(resp.status).send(resp.body)    
});

router.get("/document/:id/header", async (req, res) => {
    let resp = await Querier.getDocument(req.user as User, req.params.id, true)
    res.status(resp.status).send(resp.body)
})

router.get("/document/:id", async (req, res) => {
    let resp = await Querier.getDocument(req.user as User, req.params.id)
    res.status(resp.status).send(resp.body)
});

router.delete("/document/:id", async (req, res) => {
    let resp = await Querier.deleteDocument(req.user as User, req.params.id)
    res.status(resp.status).send(resp.body)
});

router.put("/document/:id/", async (req, res) => {
    let resp = await Querier.modifyDocumentTitle(req.user as User, req.params.id, req.params.title)
    res.status(resp.status).send(resp.body)
});

router.post("/document/:id/permissions", async (req, res) => {
    let resp = await Querier.addPermission(req.user as User, req.params.id, req.body.user, req.body.permission)
    res.status(resp.status).send(resp.body)
});

router.delete("/document/:id/permissions", async (req, res) => {
    let resp = await Querier.removePermission(req.user as User, req.params.id, req.body.user)
    res.status(resp.status).send(resp.body)
});

// edits a card's text
router.put("document/:id/card/:index", async (req, res) => {
    let resp = await Querier.updateCard(req.user as User, req.params.id, req.params.index, req.body.text)
    res.status(resp.status).send(resp.body)
});

// deletes a card and recursively deletes all children
router.delete("document/:id/card/:index", async (req, res) => {
    let resp = await Querier.deleteCard(req.user as User, req.params.id, req.params.index)
    res.status(resp.status).send(resp.body)
});

// moves the card one index smaller (or one card higher)
router.put("/document/:id/card/move-up", async (req, res) => {
    let resp = await Querier.moveCardUp(req.user as User, req.params.id, req.body.cardIndex)
    res.status(resp.status).send(resp.body)
})

// moves the card one index greater (or one card lower)
router.put("/document/:id/card/move-down", async (req, res) => {
    let resp = await Querier.moveCardDown(req.user as User, req.params.id, req.body.cardIndex)
    res.status(resp.status).send(resp.body)
})

// creates a card above a sibling
router.post("/document/:id/card/above", async (req, res) => {
    let { siblingId, text } = req.body;
    let resp = await Querier.addCardAbove(req.user as User, req.params.id, siblingId, text)
    res.status(resp.status).send(resp.body)
});

// creates a card below a sibling
router.post("/document/:id/card/below", async (req, res) => {
    let { siblingId, text } = req.body;
    let resp = await Querier.addCardBelow(req.user as User, req.params.id, siblingId, text)
    res.status(resp.status).send(resp.body)
});

// creates a card that is the child of a card
router.post("/document/:id/card/child", async (req, res) => {
    let { parentCardId, text } = req.body;
    let resp = await Querier.addChildCard(req.user as User, req.params.id, parentCardId, text)
    res.status(resp.status).send(resp.body)
});

// creates a card that becomes the parent of the child
router.post("document/:id/card/parent", async (req, res) => {
    res.status(501)
});

// gets a card (note: probably won't be used that often)
router.get("document/:id/card/:index", async (req, res) => {
    res.status(501)
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
