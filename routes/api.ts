import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Story, StoryModel } from "../models/story";
import { StoryCraft, GraphError } from "../services/graph";
import { MessageI, MessageError, PermissionGroup } from "../messages/messages";

export type CreateStoryResponse = {
	story: Story
	error: string
}

export type DeleteStoryResponse = {
	deleted: boolean
	error: string
}

router.get("/me", (req: any, res) => {
	res.json({
		message: "user profile",
		user: req.user,
		token: req.query.token,
	});
});

router.put("/me", async (req: any, res) => {
	const { email, password, name } = req.body;
	try {
		const salt = randomBytes(32);
		const passwordHashed = await argon2.hash(password, { salt });
		UserModel.findByIdAndUpdate(req.user._id, {
			email: email,
			password: passwordHashed,
			name: name,
		});
		res.json({
			message: "successfully updated account",
			user: req.user,
		});
	} catch (e) {
		console.log(e);
		res.json({
			message: "error changing account details",
			error: e,
		});
	}
});

router.delete("/me", (req: any, res) => {
	UserModel.findByIdAndDelete(req.user._id);
	res.status(201).send({ message: "user deleted" });
});

// TODO: at the moment this returns just story id's but it would be more helpful to return
// the title. We may also want to add owner, author, editor, viewer concept to the user. 
router.get("/stories", async (req, res) => {
	if (req.user === undefined) {
		return res.status(200).send({ message: "failed", error: "user not found" });
	}
	return res.status(200).send({ message: "success", stories: (req.user as User).stories})
});

router.post("/story", (req, res) => {
	console.log(req.body)
	const { title, description } = req.body;
	if (req.user === undefined) {
		return res.status(200).send();
	}
	StoryCraft.create(req.user as User, title, description)
		.then((story: Story) => {
			console.log("1")
			res.status(201).send({ story: story, error: ""});
		}, (reason: any) => {
			console.log("2")
			res.status(200).send({ story: null, error: reason})
		})
		.catch((err) => {
			console.log("3")
			res.status(200).send({ story: null, error: err.message})
		});
	return;
});

router.delete("/story/:id", async (req, res) => {
	const id = req.params.id;
	if (req.user === undefined) {
		return res.status(200).send({ deleted: false, error: "User not found" });
	}
	if (id === undefined) {
		return res.status(500).send({ deleted: false, error: "no story id provided in params" });
	}
	StoryCraft.remove(req.user as User, id)
		.then((deleted: boolean) => {
			if (deleted) {
				res.status(200).send({ deleted: true, error: null})
			}
		}).catch((err: any) => {
			res.status(200).send({ deleted: false, error: err.message})
		});
	
});

router.post("/story/:id", async (req, res) => {
	let msgs: MessageI[] = req.body;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	let err = await StoryCraft.edit(req.user as User, req.params.id, msgs);
	if (err) {
		return { message: "failed to process msgs because " + err };
	}
	return res
		.status(200)
		.send({ message: "successfully processed msgs", messages: msgs });
});

router.get("/story/:id", async (req, res) => {
	if (req.user === undefined) {
		return res.status(200).send({ error: "error: user not found" });
	}
	let results = await StoryCraft.find(req.user as User, req.params.id);
	if (results.err) {
		return res.status(200).send({ error: results.err });
	}
	return res.status(200).send({ story: results.story });
});

export default router;
