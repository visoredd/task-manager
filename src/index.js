const express = require("express");
const request = require("request");
const cheerio = require("cheerio");
require("./db/mongoose");
const userRouter = require("./routers/users");
const taskRouter = require("./routers/tasks");

const app = express();
app.use(express.json());
app.use(userRouter, taskRouter);
const port = process.env.PORT;

app.listen(port, () => console.log("Listing port at " + port + "!!"));
