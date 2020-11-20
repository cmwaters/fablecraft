import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Story, StoryModel } from "../models/story";
import { StoryCraft, GraphError } from "../services/graph";
import { MessageI, MessageError, PermissionGroup } from "../messages/messages";

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

// we should just abbreviate this call to showing only a few details of each story and a later call to load the actual story
router.get("/stories", async (req, res) => {
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	return res.status(200).send({ message: "success", stories: (req.user as User).stories})
});

router.post("/story", async (req, res) => {
	const { title, description } = req.body;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	StoryCraft.create(req.user as User, title, description).then((value: GraphError | Story) => {
		if ((value as Story).title === undefined) {
			return res.status(200).send({ message: value });
		} else {
			const story = value as Story;
			return res.status(201).send({ message: "success. " + story.title + " created.", story: story});
		}
	});
});

router.delete("/story/:id", async (req, res) => {
	const id = req.params.id;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	if (id !== undefined) {
		let err = StoryCraft.remove(req.user as User, id);
	}
	return res.status(500).send({ message: "no story id provided in params" });
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
		return res.status(200).send({ message: "error: user not found" });
	}
	let results = await StoryCraft.find(req.user as User, req.params.id);
	if (results.err) {
		return res.status(200).send({ message: results.err });
	}
	return res.status(200).send({ story: results.story });
});

export default router;
