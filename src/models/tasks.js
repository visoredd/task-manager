const mongoose = require("mongoose");

const taskScheme = mongoose.Schema(
	{
		description: {
			type: String,
			trim: true,
			required: true,
		},
		completed: {
			type: Boolean,
			default: false,
		},
		owner: {
			type: String,
			required: true,
			ref: "Users",
		},
	},
	{ timestamps: true }
);

const Task = mongoose.model("tasks", taskScheme);

module.exports = Task;
