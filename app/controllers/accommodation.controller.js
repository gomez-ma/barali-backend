const db = require("../models");
const Accommodation = db.accommodation;
const Type = db.type;
const Booking = db.booking;
const { Op, fn, col, where } = require('sequelize');

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
    res.status(500).json({ message: "Error fetching promotions" });
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
      order: [['id', 'ASC']],
      // limit: 2
    });
    res.status(200).json(accommodation);
  } catch (error) {
    res.status(500).json({ message: "Error fetching accommodations" });
  }
}

exports.getPopularAccommodation = async (req, res) => {
  try {
    const limitNum = 4;
    const minRatingNum = 4;

    // ดึงข้อมูลที่ทั้งหมดพร้อมข้อมูลการจองและหมวดหมู่
    const accommodations = await Accommodation.findAll({
      include: [
        {
          model: Type,
          attributes: ["name"]
        },
        {
          model: Booking,
          attributes: ["id", "checkOutRating", "checkInDate", "checkOutDate"],
        }
      ],
    });

    // คำนวณ 1.คะแนนเฉลี่ย และ 2.จำนวนการจอง
    const popularAccommodations = accommodations.map(item => {
      const accommodationObject = item.toJSON();
      const bookings = accommodationObject.bookings || [];

      // คำนวณคะแนนเฉลี่ย
      const validRatings = bookings
        .map(b => b.checkOutRating)
        .filter(rating => rating !== null && rating !== undefined && typeof rating === 'number');

      const totalRating = validRatings.reduce((acc, rating) => acc + rating, 0);
      const countRating = validRatings.length;
      const averageRating = countRating > 0 ? totalRating / countRating : 0;
      const ratingPercentage = countRating > 0 ? (averageRating / 5) * 100 : 0;

      // คำนวณจำนวนการจองในช่วง 30 วันล่าสุด
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const recentBookings = bookings.filter(b => {
        const bookingDate = new Date(b.checkInDate);
        return bookingDate >= thirtyDaysAgo && bookingDate <= now;
      });

      // คำนวณคะแนนความนิยม (คะแนนรีวิว + จำนวนการจอง)
      const popularityScore = (averageRating * 0.5) + (recentBookings.length * 0.5);

      return {
        ...accommodationObject,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingPercentage: parseFloat(ratingPercentage.toFixed(2)),
        countRating: countRating,
        countBooking: recentBookings.length,
        popularityScore: parseFloat(popularityScore.toFixed(2)),
      }
    });

    const filteredAccommodations = popularAccommodations
      .filter(acc => acc.averageRating >= minRatingNum)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limitNum);

    // console.log(accommodations);
    res.status(200).json(filteredAccommodations);

  } catch (error) {
    res.status(500).json({ message: "Error fetching popular accommodations" });
  }
}

exports.getSearch = async (req, res) => {
  try {
    const { destination, checkIn, checkOut, guests } = req.query;

    if (!checkIn && !checkOut) {
      return res.status(400).json({ message: "Please provide checkIn and checkOut dates." });
    }

    const loweredDestination = destination.toLowerCase();

    const accommodations = await Accommodation.findAll({
      include: [
        {
          model: Type,
          attributes: ["name"],
          required: true,
        }
      ],
      // where: {
      //   capacity: { [Op.gte]: guests }
      // }
      // where: {
      //   [Op.and]: [
      //     { capacity: { [Op.gte]: guests } },
      //     { '$type.name$': { [Op.like]: `%${destination}%` } }, // ใช้ชื่อ alias model
      //   ]
      // }
      where: {
        [Op.and]: [
          // ตรวจสอบชื่อ type แบบ case-insensitive
          where(
            fn('LOWER', col('type.name')),
            {
              [Op.like]: `%${loweredDestination}%`
            }
          ),
          // ตรวจสอบจำนวนผู้เข้าพัก
          { capacity: { [Op.gte]: guests } }
        ]
      }
    });
    res.status(200).json(accommodations);
  } catch (error) {
    res.status(500).json({ message: "Error searching accommodations" });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;

    // ต้องตรวจสอบว่าวันที่ถูกต้อง
    if (!check_in || !check_out) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    // ดึงข้อมูลการจองทั้งหมดในช่วงเวลาที่ต้องการ
    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [check_in, check_out]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [check_in, check_out]
            }
          },
          {
            [Op.and]: [
              {
                checkInDate: {
                  [Op.lte]: check_in
                }
              },
              {
                checkOutDate: {
                  [Op.gte]: check_out
                }
              }
            ]
          }
        ],
        isCancelled: false,
        checkedOut: false
      },
      attributes: ['id', 'accommodationId'], // Make sure to include accommodation_id
      //raw: true
    });

    // นับจำนวนการจองต่อที่พัก
    const bookingCounts = {};
    bookings.forEach(booking => {
      const accommodationId = booking.accommodationId;
      if (!bookingCounts[accommodationId]) {
        bookingCounts[accommodationId] = 0;
      }
      bookingCounts[accommodationId]++;
    });

    // ดึงข้อมูลจำนวนห้องทั้งหมดของแต่ละที่พัก
    const accommodations = await Accommodation.findAll({
      attributes: ['id', 'total_rooms'],
      // raw: true
    });

    // คำนวณจำนวนห้องว่าง
    const availability = accommodations.map(acc => {
      const bookedRooms = bookingCounts[acc.id] || 0;
      const availableRooms = Math.max(0, acc.total_rooms - bookedRooms);

      // console.log(`Accommodation ID: ${acc.id}, Total Rooms: ${acc.total_rooms}, Booked Rooms: ${bookedRooms}, Available Rooms: ${availableRooms}`);

      return {
        accommodationId: acc.id,
        totalRooms: acc.total_rooms,
        bookedRooms: bookedRooms,
        availableRooms: availableRooms
      };
    });

    res.status(200).json(availability);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: 'Server error while fetching availability' });
  }
};