const db = require("../models");
const Accommodation = db.accommodation;

exports.getAll = async (req, res) => {
    try {
        const accommodation = await Accommodation.findAll();
        res.status(200).json(accommodation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching accommodations"});
    }
}