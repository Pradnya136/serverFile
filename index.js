const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
var cors = require("cors");
var knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "postSQL",
    database: "smart_brain"
  }
});

db.select("*")
  .from("users")
  .then(data => {
    // console.log(data);
  });

const app = express();
app.use(bodyParser.json()); //middleware in order to use req.body we used this
app.use(cors()); //middleware

app.get("/", (req, res) => {
  res.json(database.users);
  console.log("server is wrking on port 3001");
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json("Incorrect form submission");
  }
  db.select("email", "hash")
    .from("login1")
    .where("email", "=", email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then(user => {
            res.json(user[0]);
          })
          .catch(err => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("Wrong username or password");
      }
    })
    .catch(err => res.status(400).json("Wrong credentials"));
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json("Incorrect form submission");
  }
  const saltRounds = 10;
  var salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);

  db.transaction(trx => {
    trx
      .insert({
        hash: hash,
        email: email
      })
      .into("login1")
      .returning("email")
      .then(loginEmail => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch(err => res.status(400).json("Unable to register"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;

  db.select("*")
    .from("users")
    .where({ id })
    .then(user => {
      if (user.length) {
        res.status(200).json(user[0]);
      } else {
        throw new Error("Unable to find user");
      }
    })
    .catch(err => res.status(400).json(err.message));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then(entries => {
      res.json(entries[0]);
    })
    .catch(err => res.status(400).json(err));
});

// // Load hash from your password DB.
// bcrypt.compare(myPlaintextPassword, hash, function(err, res) {
//   // res == true
// });
// bcrypt.compare(someOtherPlaintextPassword, hash, function(err, res) {
//   // res == false
// });

app.listen(3001, () => {
  console.log("app is running");
});
