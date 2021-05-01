export default function(sequelize, DataTypes) {
  const circle = sequelize.define(
    'circle',
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
      circle_name: {
        allowNull: false,
        type: DataTypes.STRING(80),
      },
      parent: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
    },
    {
      underscored: true,
      paranoid: true,
      freezeTableName: true,
      timestamps: false,
      tableName: 'Circles',
    },
  );

  return circle;
}
