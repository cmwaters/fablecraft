import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Story, StoryModel } from "../models/story";
import { StoryGraph } from "../services/graph";
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
	let user = req.user as User;
	if (user.stories === undefined) {
		return res
			.status(200)
			.send({ message: "user does not currently have any stories" });
	}
	return res.status(200).send({ stories: user.stories });
});

router.post("/story", (req, res) => {
	const { title, description } = req.body;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	let err = StoryGraph.createStory(req.user as User, title, description);
	if (err) {
		return res.status(200).send({ message: err });
	}
	return res.status(201).send({ message: "success. " + title + " created." });
});

router.delete("/story/:id", async (req, res) => {
	const id = req.params.id;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	if (id !== undefined) {
		let err = StoryGraph.deleteStory(req.user as User, id);
	}
	return res.status(500).send({ message: "no story id provided in params" });
});

router.post("/story/:id", async (req, res) => {
	let msgs: MessageI[] = req.body;
	if (req.user === undefined) {
		return res.status(200).send({ message: "error: user not found" });
	}
	let err = await StoryGraph.editStory(req.user as User, req.params.id, msgs);
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
	let results = await StoryGraph.findStory(req.user as User, req.params.id);
	if (results.err) {
		return res.status(200).send({ message: results.err });
	}
	return res.status(200).send({ story: results.story });
});

// create a card
// router.post("/story/:id/card", async (req, res) => {
// 	console.log("received new card request");
// 	console.log(req.body);
// 	let { text, depth, index, parentIndex } = req.body;
// 	console.log(text);
// 	let story = await StoryModel.findById(req.params.id);
// 	if (story === null) {
// 		return res.status(200).send({ message: "story not found." });
// 	}
// 	if (!hasPermission("author", req.user as User, story)) {
// 		return res.status(200).send({ message: "user does not have permission" });
// 	}
// 	if (depth === undefined || index === undefined) {
// 		return res
// 			.status(200)
// 			.send({ message: "no depth and/or index defined for card" });
// 	}
// 	let user = req.user as User;
// 	let card: Card = new CardModel({
// 		text: text,
// 		depth: depth,
// 		index: index,
// 		owner: user._id,
// 	});
// 	// insert card into story
// 	let err = StoryGraph.insertCard(story, card);
// 	if (err !== "") {
// 		return res.status(201).send({ message: "error: " + err });
// 	}
// 	return res.status(201).send({ message: "success. created card." });
// });

// // delete a card
// router.delete("/story/:id/card", async (req, res) => {
// 	let { text, depth, index, parentIndex } = req.body;
// 	let story = await StoryModel.findById(req.params.id);
// 	if (story === null) {
// 		return res.status(200).send({ message: "story not found." });
// 	}
// 	if (!hasPermission("author", req.user as User, story)) {
// 		return res.status(200).send({ message: "user does not have permission" });
// 	}
// 	await CardModel.findOne({ depth: depth, index: index }, (err, card) => {
// 		if (err || story === null || card === null) {
// 			return res.status(200).send({ message: "card does not exist" });
// 		}

// 		let deletionErr = StoryGraph.deleteCard(story, card);
// 		if (deletionErr !== "") {
// 			return res.status(200).send({ message: deletionErr });
// 		}
// 		console.log("delete card at index " + index);
// 		return res.status(200).send({ message: "successfully deleted card" });
// 	});
// });
//
// edit a card
// router.put("/story/:id/card", async (req, res) => {
// 	let { text, depth, index, parentIndex } = req.body;
// 	let story = await StoryModel.findById(req.params.id);
// 	if (story === null) {
// 		return res.status(200).send({ message: "story not found." });
// 	}
// 	if (!hasPermission("author", req.user as User, story)) {
// 		return res.status(401).send({ message: "user does not have permission" });
// 	}
// 	await CardModel.findOne({ depth: depth, index: index }, (err, card) => {
// 		if (err || card === null) {
// 			return res.status(200).send({ message: "card does not exist" });
// 		}
// 	});

// 	console.log("edit card at index " + index);
// });

export default router;
