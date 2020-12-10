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
	return res.status(200).send((req.user as User).stories)
});

router.post("/story", (req, res) => {
	const { title, description } = req.body;
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
	Graph.loadFromUser(req.user as User, req.params.id).
		then((graph) => {
			return res.status(200).send(graph.story)
		})
		.catch((err) => {
			return res.status(200).send({ error: err })
		})
});

router.delete("/story/:id", async (req, res) => {
	Graph.loadFromUser(req.user as User, req.params.id)
		.then((graph: Graph) => {
			graph.remove().then((deleted: boolean) => {
				if (deleted) {
					// successful
					return res.status(204).send()
				}
			}, (error: any) => {
				// error with deleting the story
				return res.status(200).send({error: error})
			})
		})
		.catch((err: any) => {
			// error with retrieving the story (most likely user perms)
			res.status(200).send({ error: err })
		});

});

router.put("/story/:id/title", async (req, res) => {
	Graph.loadFromUser(req.user as User, req.params.id)
		.then((graph: Graph) => {
			graph.changeTitle(req.body.title).then(() => { 
				return res.status(204).send()
			}, (err: any) => {
				// error with changing the title (most likely an invalid title)
				return res.status(200).send({ error: err})
			})
		})
		.catch(err => {
			// error with retrieving the story (most likely user perms)
			return res.status(200).send({ error: err })
		})
});

router.put("/story/:id/description", async (req, res) => {
	let msgs: MessageI[] = req.body;
	Graph.loadFromUser(req.user as User, req.params.id);
	return res
		.status(200)
		.send({ message: "successfully processed msgs", messages: msgs });
});

router.post("/story/:id/permissions", async (req, res) => {
	const { user, permission } = req.body; // used is the id
	Graph.loadFromUser(req.user as User, req.params.id)
		.then((graph: Graph) => {
			graph.addPermission(user, permission).then((err: Error | null) => {
				if (err) {
					return res.status(200).send({ error: err.message })
				} else {
					return res.status(204).send()
				}
			})
		})
		.catch((err: string) => {
			return res.status(200).send({error: err })
		})
})

router.delete("/story/:id/permissions", async (req, res) => {
	const { user } = req.body; // should be a user id
	Graph.loadFromUser(req.user as User, req.params.id)
		.then((graph: Graph) => {
			graph.removePermission(user, req.user as User).then((err: Error | null) => {
				if (err) {
					return res.status(200).send({ error: err.message })
				} else {
					return res.status(204).send()
				}
			})
		})
		.catch((err: string) => {
			return res.status(200).send({ error: err })
		})
})

export default router;
