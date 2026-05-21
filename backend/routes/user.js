const express = require("express");
const zod = require("zod");
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const JWT_SECRET = require("../config");
const { authMiddleware } = require("../middleware");

const router = express.Router();


const signupSchema = zod.object({
    username: zod.email(),
    password: zod.string().min(6),
    firstName: zod.string(),
    lastName: zod.string()
})

//signup
router.post("/signup", async (req, res) => {
    const body = req.body;
    const {data, success, error} = signupSchema.safeParse(req.body);

    if(!success){
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const username = data.username;
    const password = data.password;
    const firstName = data.firstName;
    const lastName = data.lastName;

    const user = User.findOne({
        username: username
    })

    if(user._id){
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const dbUser = await User.create({
        username: username,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName
    });
    
    res.json({
        message: "User created succesfully",
    })

})


const signinSchema = zod.object({
    username: zod.email(),
    password: zod.string().min(6)
})

//signin
router.post("/signin", async (req, res) => {
    const body = req.body;
    const {data, success, error} = signinSchema.safeParse(body);

    if(!success){
        return res.json({
            message: "Incorrect inputs"
        })
    }

    const username = data.username;
    const password = data.password;

    const user = User.findOne({
        username: username
    })

    if(!user._id){
        return res.json({
            message: "Incorrect inputs"
        })
    }

    const correctPassword = await bcrypt.compare(password, user.password);

    if (!correctPassword) {
            return res.status(403).json({
                message: "Invalid credentials"
            });
        }

    const token = jwt.sign({
        userId: dbUser._id
    }, JWT_SECRET);

    res.json({
        message: "SignedIn succesfully",
        token: token
    })

})

const updateSchema = zod.object({
    password: zod.string().min(6).optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
})

//update password, firtname, lastname
router.put("/", authMiddleware, async (req, res) => {
    const body = req.body;
    const {success} = updateSchema.safeParse(body);

    if(!success){
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    await User.updateOne(body, {
        id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })

})

//get other users
router.get("/bulk", async(req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = router;