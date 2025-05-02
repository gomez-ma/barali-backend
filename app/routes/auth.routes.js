const controller = require("../controllers/auth.controller");

module.exports = (app) => {
    app.get("/api/signup", controller.signup);
    app.get("/api/signin", controller.signin);
}