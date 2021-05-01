export default function(sequelize, DataTypes) {
  const role = sequelize.define(
    'role',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      circle_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      role_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      role_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      role_purpose: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      soul_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      soul_email: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      soul_mkpconnect_link: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      text: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {
      underscored: true,
      paranoid: true,
      freezeTableName: true,
      timestamps: false,
      tableName: 'Roles',
    },
  );

  return role;
}
