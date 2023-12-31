require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const moment = require("moment");

mongoose.connect(
  "mongodb+srv://ramiz:takkansix123@panaverse-backend-by-ra.sjl8l5i.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const Schema = mongoose.Schema;
let UserSchema = new Schema({
  username: String,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

let User = mongoose.model("Users", UserSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// ADD USER
app.post("/api/users", function (req, res) {
  const username = req.body.username;

  if (!username) {
    res.json({ error: "Invalid username" });
    return;
  }

  const user = new User({ username, log: [] });

  user
    .save()
    .then((data) => {
      res.json({ username: data.username, _id: data._id });
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: "Error creating user" });
    });
});

// GET USERS
app.get("/api/users", function (req, res) {
  const users = [];

  User.find()
    .then((data) => {
      data.forEach((user) =>
        users.push({ _id: user._id, username: user.username })
      );
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: "Error fetching users" });
    })
    .finally(() => {
      res.json(users);
    });
});

// GET USER LOGS
app.get("/api/users/:_id/logs", function (req, res) {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  User.findById(_id)
    .then((user) => {
      if (!user) {
        return res.json({ error: "User not found" });
      }

      let logs = user.log || [];

      // Filter logs based on 'from' and 'to' dates
      if (from) {
        const fromDate = new Date(from);
        logs = logs.filter((exercise) => new Date(exercise.date) >= fromDate);
      }
      if (to) {
        const toDate = new Date(to);
        logs = logs.filter((exercise) => new Date(exercise.date) <= toDate);
      }
      if (limit) {
        logs = logs.splice(0, Number(limit));
      }
      let count = logs.length;

      const logsList = logs.map((exercise) => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date,
        };
      });

      return res.json({
        username: user?.username,
        count: count,
        _id: _id,
        log: logsList,
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: `Error fetching user: ${err.message}` });
    });
});

// ADD LOG
app.post("/api/users/:_id/exercises", function (req, res) {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    res.json({ error: "Invalid Request" });
    return;
  }

  User.findByIdAndUpdate(
    _id,
    {
      $push: {
        log: {
          description: description,
          duration: Number(duration),
          date: date
            ? new Date(date).toDateString()
            : new Date().toDateString(),
        },
      },
    },
    { new: true }
  )
    .then((user) => {
      if (!user) {
        return res.json({ error: `User not found` });
      }

      const log = user.log[user.log.length - 1];

      res.json({
        _id: _id,
        username: user?.username,
        date: log.date,
        duration: log.duration,
        description: log.description,
      });
    })
    .catch((e) => {
      res.json({ error: `Error updating user: ${e.message}` });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
