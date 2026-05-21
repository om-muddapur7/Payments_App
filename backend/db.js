require("dotenv").config()

const mongoose = require("mongoose");
const { string } = require("zod");

mongoose.connect(DATABASE_URL);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String
})

const User = mongoose.model("User", userSchema);

module.exports = {
    User
}