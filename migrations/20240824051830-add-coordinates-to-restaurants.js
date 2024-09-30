'use strict';

/** @type {import('sequelize-cli').Migration} */
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('restaurantes', 'latitude', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
      await queryInterface.addColumn('restaurantes', 'longitude', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('restaurantes', 'latitude');
      await queryInterface.removeColumn('restaurantes', 'longitude');
    },
  };
