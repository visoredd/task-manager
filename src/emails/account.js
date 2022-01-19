const sgMail = require("@sendgrid/mail");

const sendAPIKey = process.env.SG_API_KEY;

sgMail.setApiKey(sendAPIKey);

const sendWelcomeMail = async (email, name) => {
	await sgMail.send({
		to: email,
		from: "guptaayush3108@gmail.com",
		subject: "Thanks for joining in",
		text: `Welcome to the app, ${name} ,let me know for any concern on app`,
	});
};
const sendConcernMail = async (email, name) => {
	await sgMail.send({
		to: email,
		from: "guptaayush3108@gmail.com",
		subject: "Sorry to see you go!",
		text: `Good Bye, ${name} , hope you join us again in future`,
	});
};
module.exports = { sendWelcomeMail, sendConcernMail };
