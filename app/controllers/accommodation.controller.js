const db = require("../models");
const Accommodation = db.accommodation;
const Type = db.type;
const { Op } = require("sequelize");

exports.getPromotion = async (req, res) => {
    try {
        const promotion = await Accommodation.findAll({
            include: [
                {
                    model: Type,
                    attributes: ["name"]
                }
            ],
            where: {
                discount: {
                    [Op.ne]: null
                }
            }
        });
        res.status(200).json(promotion);
    } catch (error) {
        res.status(500).json({ message: "Error fetching promotions"});
    }
}

exports.getAll = async (req, res) => {
    try {
        const accommodation = await Accommodation.findAll({
            include: [
                {
                    model: Type,
                    attributes: ["name"]
                }
            ],
            limit: 2
        });
        res.status(200).json(accommodation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching accommodations"});
    }
}