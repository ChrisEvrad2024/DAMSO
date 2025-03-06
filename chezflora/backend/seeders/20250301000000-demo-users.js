'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        await queryInterface.bulkInsert('users', [
            {
                id: uuidv4(),
                first_name: 'Admin',
                last_name: 'User',
                email: 'admin@chezflora.com',
                password: adminPassword,
                phone: '0123456789',
                role: 'admin',
                status: 'active',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                password: hashedPassword,
                phone: '0123456789',
                role: 'client',
                status: 'active',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                password: hashedPassword,
                phone: '9876543210',
                role: 'client',
                status: 'active',
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', null, {});
    }
};