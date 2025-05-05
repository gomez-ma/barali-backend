const controller = require("../controllers/auth.controller");

module.exports = (app) => {
    // app.get("/api/auth/signup", controller.signup);
    app.post("/api/auth/signin", controller.signin);
}