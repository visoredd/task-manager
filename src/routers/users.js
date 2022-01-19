const express = require("express");
const User = require("../models/users");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendConcernMail, sendWelcomeMail } = require("../emails/account");
const router = new express.Router();

router.post("/users", async (req, res) => {
	try {
		const user = new User(req.body);
		const isEmailExist = await User.countDocuments({ email: req.body.email });
		if (isEmailExist) {
			return res.status(400).send({ error: "Email already exist" });
		}
		await user.save();
		const token = await user.generateToken();
		sendWelcomeMail(user.email, user.name);
		res.send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});

router.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password);
		const token = await user.generateToken();
		res.send({ user, token });
	} catch (e) {
		res.status(400).send({ error: "Unable to login" });
	}
});

router.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
		await req.user.save();
		res.send({ msg: "Logged out successful" });
	} catch (e) {
		res.status(400).send(e);
	}
});

router.post("/users/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send({ msg: "Logged out all sessions successfully" });
	} catch (e) {
		res.status(400).send(e);
	}
});

router.get("/users/me", auth, async (req, res) => {
	res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["name", "age", "password", "email"];
	const isValidate = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidate) {
		return res.status(400).send({ error: "Invalide Updates" });
	}

	try {
		const user = req.user;
		updates.forEach((update) => (user[update] = req.body[update]));
		await user.save();
		if (!user) {
			return res.status(400).send();
		}
		res.send(user);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete("/users/me", auth, async (req, res) => {
	try {
		sendConcernMail(req.user.email, req.user.name);
		await req.user.remove();
		res.send({ msg: "Delted user succesfully" });
	} catch (e) {
		res.status(500).send(e);
	}
});

const upload = multer({
	limits: {
		fieldSize: 5000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb("File not supported");
		}
		cb(undefined, true);
	},
});
router.post(
	"/users/me/avatar",
	auth,
	upload.single("avatar"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send({ msg: "Uploaded" });
	},
	(error, req, res, next) => {
		res.status(400).send({ error });
	}
);

router.delete("/users/me/avatar", auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send({ msg: "Deleted successfully!!" });
});

router.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user || !user.avatar) {
			throw new Error("Baka no image");
		}
		res.set("Content-Type", "image/png");
		res.send(user.avatar);
	} catch (e) {
		res.status(400).send({ e });
	}
});

module.exports = router;
