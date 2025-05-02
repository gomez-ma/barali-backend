require("dotenv/config");
const express = require("express");
const app = express();
const db = require("./app/models");

db.sequelize.sync({ force: true }).then(() => {
    console.log("Database sync...");
});

app.get("/", (req, res) => {
res.send("Hello World");
// console.log("Hello World");
})

require("./app/routes/auth.routes")(app);

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => { 
    console.log(`Server is running on port ${PORT}`) 
});