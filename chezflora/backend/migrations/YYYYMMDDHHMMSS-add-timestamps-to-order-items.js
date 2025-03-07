// migrations/YYYYMMDDHHMMSS-add-updated-at-to-order-items.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('order_items', 'updated_at', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('order_items', 'updated_at');
    }
};