import * as express from "express";
const router = express.Router();
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { User, UserModel } from "../models/user";
import { Graph } from "../services/graph";

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
		await UserModel.findByIdAndUpdate(req.user._id, {
			email: email,
			password: passwordHashed,
			name: name,
		}, (err) => {
			if (err) {
				console.log(err)
				return res.status(500).send()
			}
		});
		return res.status(204).send()
	} catch (e) {
		console.log(e)
		res.status(500).send()
	}
});

router.delete("/user", async (req: any, res) => {
	await UserModel.findByIdAndDelete(req.user._id, (err) => {
		console.log(err)
		res.status(500).send()
	});
	res.status(204).send();
});

// TODO: at the moment this returns just story id's but it would be more helpful to return
// the title. We may also want to add owner, author, editor, viewer concept to the user. 
router.get("/story", async (req, res) => {
	return res.status(200).send((req.user as User).stories)
});

router.post("/story", async (req, res) => {
	const { title, description } = req.body;
	let graph = await Graph.create(req.user as User, title, description)
	graph.send(res)
});

router.get("/story/:id", async (req, res) => {
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	graph.send(res)
});

router.delete("/story/:id", async (req, res) => {
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	await graph.remove()
	graph.send(res)
});

router.put("/story/:id/", async (req, res) => {
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	await graph.modify(req.body.title, req.body.description)
	graph.send(res)
});

router.post("/story/:id/permissions", async (req, res) => {
	const { user, permission } = req.body; // used is the id
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	await graph.addPermission(user, permission)
	graph.send(res)
})

router.delete("/story/:id/permissions", async (req, res) => {
	const { user } = req.body; // should be a user id
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	await graph.removePermission(user, req.user as User)
	graph.send(res)
})

router.get("/story/:id/cards", async (req, res) => {
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	await graph.cards()
	graph.send(res)
})

router.post("/story/:id/card", async (req, res) => {
	let { depth, index, text } = req.body 
	let graph = await Graph.loadFromUser(req.user as User, req.params.id)
	await graph.addCard(depth, index, text)
	graph.send(res)
})

router.get("/story/:id/card/:depth/:index", async (req, res) => {
	res.status(200).send()
})

router.put("/story/:id/card/:depth/:index", async (req, res) => {
	res.status(200).send()
})

router.delete("/story/:id/card/:depth/:index", async (req, res) => {
	res.status(200).send()
})


export default router;
