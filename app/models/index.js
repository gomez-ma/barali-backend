const config = require("../config/db.config");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        dialect: config.DIALECT,
        pool: {
            max: config.pool.max,
            min: config.pool.min,
            acqure: config.pool.acquire,
            idle: config.pool.idle
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/user.model")(sequelize, Sequelize);
db.role = require("../models/role.model")(sequelize, Sequelize);
db.type = require("../models/type.model")(sequelize, Sequelize);
db.accommodation = require("../models/accommodation.model")(sequelize, Sequelize);
db.activity = require("../models/activity.model")(sequelize, Sequelize);
db.booking = require("../models/booking.model")(sequelize, Sequelize);

// Many-to-Many
db.role.belongsToMany(db.user, {
    through: "user_roles"
});
db.user.belongsToMany(db.role, {
    through: "user_roles"
});
// One-to-Many
db.type.hasMany(db.accommodation, {
    foreignKey: "type_id",
    onDelete: "RESTRICT"
});
db.accommodation.belongsTo(db.type, {
    foreignKey: "type_id"
});
// One-to-Many
db.user.hasMany(db.booking, {
    foreignKey: "userId",
    onDelete: "RESTRICT"
});

db.accommodation.hasMany(db.booking, {
    foreignKey: "accommodationId",
    onDelete: "RESTRICT"
});

// RESTRICT: ไม่อนุญาตให้ลบหรืออัปเดตข้อมูลหากมีการอ้างอิงจากข้อมูลในตารางอื่น
// CASCADE: ลบหรืออัปเดตข้อมูลในตารางหลัก และข้อมูลที่เชื่อมโยงในตารางรองจะถูกลบหรืออัปเดตด้วย
// NO ACTION: รอให้การกระทำเสร็จสมบูรณ์ ถ้าผิดพลาดจะไม่ทำการกระทำใด ๆ
// SET DEFAULT: ตั้งค่า foreign key เป็นค่าที่กำหนดเป็นค่าเริ่มต้น
// SET NULL: ตั้งค่า foreign key เป็น NULL เมื่อข้อมูลในตารางหลักถูกลบหรืออัปเดต

module.exports = db;