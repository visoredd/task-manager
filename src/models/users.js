const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("./tasks");

const userSchema = mongoose.Schema(
	{
		name: {
			type: String,
			unqiue: true,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			unqiue: true,
			required: true,
			trim: true,
			lowercase: true,
			validate(v) {
				if (!validator.isEmail(v)) {
					throw new Error(v + " is not an email");
				}
			},
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minLength: 7,
			validate(v) {
				if (v.toLowerCase().trim() === "password") {
					throw new Error("Password cannot be password");
				}
			},
		},
		age: {
			type: Number,
			validate(v) {
				if (v < 0) {
					throw new Error(v + " Negative age not allowed");
				}
			},
			default: 0,
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
		avatar: {
			type: Buffer,
		},
	},
	{ timestamps: true }
);

userSchema.virtual("tasks", {
	ref: "tasks",
	localField: "_id",
	foreignField: "owner",
});

userSchema.methods.generateToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();
	delete userObject.password;
	delete userObject.tokens;
	delete userObject.avatar;
	return userObject;
};

userSchema.statics.findEmail = async (email) => {
	const user = await User.find({ email });
	if (user) {
		throw new Error({ error: "Email already exist" });
	}
	return false;
};

userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error("Unable to login");
	}

	const isMatched = await bcrypt.compare(password, user.password);

	if (!isMatched) {
		throw new Error("Unable to login");
	}
	return user;
};

userSchema.pre("save", async function (next) {
	const user = this;
	if (user.isModified("password")) {
		user.password = await bcrypt.hash(user.password, 8);
	}
	next();
});

userSchema.pre("remove", async function (next) {
	const user = this;
	await Task.deleteMany({ owner: user._id });
	next();
});

const User = mongoose.model("Users", userSchema);

module.exports = User;
