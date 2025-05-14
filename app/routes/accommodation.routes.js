// const { authJwt } = require("../middleware");
const controller = require("../controllers/accommodation.controller");

module.exports = (app) => {
    // [authJwt.verifyToken]
    app.get("/api/accommodation/popular", controller.getPopularAccommodation);
    app.get("/api/accommodation/promotion", controller.getPromotion);
    app.get("/api/accommodation/search", controller.getSearch);
    app.get("/api/accommodation", controller.getAll);
    app.get('/api/accommodation/availability', controller.getAvailability);
}