const controller = require("../controllers/accommodation.controller");

module.exports = (app) => {
    app.get("/api/accommodation", controller.getAll);
}