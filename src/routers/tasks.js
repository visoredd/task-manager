const express = require("express");
const Task = require("../models/tasks");
const auth = require("../middleware/auth");

const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
	try {
		const task = new Task({ ...req.body, owner: req.user._id });
		await task.save();
		res.send(task);
	} catch (e) {
		res.status(400).send(e);
	}
});

//GET /tasks?complted=true
//GET /tasks?limit=2&skip=0
//GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
	try {
		const match = {};
		const sort = {};
		if (req.query.completed) {
			match.completed = req.query.completed === "true";
		}
		if (req.query.sortBy) {
			const parts = req.query.sortBy.split(":");
			sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
		}
		await req.user.populate({
			path: "tasks",
			match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort,
			},
		});
		res.send(req.user.tasks);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.get("/tasks/:id", auth, async (req, res) => {
	try {
		const _id = req.params.id;
		const task = await Task.findOne({ _id, owner: req.user._id });
		if (!task) {
			return res.status(400).send({ msg: "No task found!" });
		}
		res.send(task);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.patch("/tasks/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["description", "completed"];
	const isValidate = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidate) {
		return res.status(400).send({ error: "Invalide Updates" });
	}

	try {
		const user = await Task.findOne({ _id: req.params.id, owner: req.user._id });
		if (!user) {
			return res.status(400).send();
		}
		updates.forEach((update) => (user[update] = req.body[update]));
		await user.save();

		res.send(user);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete("/tasks/:id", auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
		if (!task) {
			return res.status(500).send();
		}
		res.send({ msg: "Succesfully delted!" });
	} catch (e) {
		res.status(500).send(e);
	}
});
module.exports = router;
