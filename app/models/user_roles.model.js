module.exports = (sequelize, Sequelize) => {
    const UserRole = sequelize.define("user_roles", {
        userId: Sequelize.INTEGER,
        roleId: Sequelize.INTEGER
    });
    return UserRole;
}