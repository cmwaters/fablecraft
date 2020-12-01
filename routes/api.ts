import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Story } from "../models/story";
import { Graph } from "../services/graph";
import { MessageI } from "../messages/messages";
import { routerErrors } from "./errors";

const err = routerErrors

router.get("/user", (req: any, res) => {
	res.json({
		user: req.user,
		token: req.query.token,
	});
});

router.put("/user", async (req: any, res) => {
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
			user: req.user,
		});
	} catch (e) {
		res.json({
			error: e,
		});
	}
});

router.delete("/user", (req: any, res) => {
	UserModel.findByIdAndDelete(req.user._id);
	res.status(204).send();
});

// TODO: at the moment this returns just story id's but it would be more helpful to return
// the title. We may also want to add owner, author, editor, viewer concept to the user. 
router.get("/story", async (req, res) => {
	if (req.user === undefined) {
		return res.status(200).send(err.NoUserAuthenticated);
	}
	return res.status(200).send((req.user as User).stories)
});

router.post("/story", (req, res) => {
	const { title, description } = req.body;
	if (req.user === undefined) {
		return res.status(200).send(err.NoUserAuthenticated);
	}
	Graph.create(req.user as User, title, description)
		.then((story: Story) => {
			res.status(201).send(story);
		}, (reason: any) => {
			res.status(400).send({ error: reason })
		})
		.catch((err: any) => {
			res.status(500).send({ error: err.message })
		});
	return;
});

router.get("/story/:id", async (req, res) => {
	if (!req.user) {
		return res.status(200).send(err.NoUserAuthenticated);
	}
	if (!req.params.id) {
		return res.status(400).send(err.NoStoryID)
	}
	Graph.loadFromUser(req.user as User, req.params.id).
		then((graph) => {
			return res.status(200).send(graph.story)
		})
		.catch((err) => {
			return res.status(200).send({ error: err })
		})
});

router.delete("/story/:id", async (req, res) => {
	const id = req.params.id;
	if (req.user === undefined) {
		return res.status(400).send(err.NoUserAuthenticated);
	}
	if (id === undefined) {
		return res.status(400).send(err.NoStoryID);
	}
	Graph.loadFromUser(req.user as User, id)
		.then((graph: Graph) => {
			return graph.remove()
		})
		.then((deleted: boolean) => {
			if (deleted) {
				return res.status(204).send()
			}
		}).catch((err: any) => {
			res.status(200).send({ error: err.message })
		});

});

router.put("/story/:id/title", async (req, res) => {
	const { title } = req.body;
	if (req.user === undefined) {
		return res.status(200).send(err.NoUserAuthenticated);
	}
	if (!req.params.id) {
		return res.status(400).send(err.NoStoryID)
	}
	(await Graph.loadFromUser(req.user as User, req.params.id))
		.changeTitle(title).then(() => {
			return res.status(204).send()
		})
		.catch(err => {
			return res.status(200).send({ error: err })
		})
});

router.put("/story/:id/description", async (req, res) => {
	let msgs: MessageI[] = req.body;
	if (req.user === undefined) {
		return res.status(200).send(err.NoUserAuthenticated);
	}
	if (!req.params.id) {
		return res.status(400).send(err.NoStoryID)
	}
	Graph.loadFromUser(req.user as User, req.params.id);
	return res
		.status(200)
		.send({ message: "successfully processed msgs", messages: msgs });
});



export default router;
