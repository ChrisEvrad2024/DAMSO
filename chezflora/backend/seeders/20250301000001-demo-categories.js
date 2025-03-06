'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create main categories first
        const bouquetsId = uuidv4();
        const plantsId = uuidv4();
        const decorationId = uuidv4();
        const accessoriesId = uuidv4();

        await queryInterface.bulkInsert('categories', [
            {
                id: bouquetsId,
                name: 'Bouquets',
                description: 'Fresh flower bouquets for all occasions',
                image_url: '/uploads/categories/bouquets.jpg',
                parent_id: null,
                is_active: true,
                sort_order: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: plantsId,
                name: 'Plants',
                description: 'Indoor and outdoor plants',
                image_url: '/uploads/categories/plants.jpg',
                parent_id: null,
                is_active: true,
                sort_order: 2,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: decorationId,
                name: 'Floral Decoration',
                description: 'Decoration for events and special occasions',
                image_url: '/uploads/categories/decoration.jpg',
                parent_id: null,
                is_active: true,
                sort_order: 3,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: accessoriesId,
                name: 'Accessories',
                description: 'Vases, pots, and gardening tools',
                image_url: '/uploads/categories/accessories.jpg',
                parent_id: null,
                is_active: true,
                sort_order: 4,
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});

        // Create subcategories
        await queryInterface.bulkInsert('categories', [
            {
                id: uuidv4(),
                name: 'Roses',
                description: 'Beautiful rose bouquets',
                image_url: '/uploads/categories/roses.jpg',
                parent_id: bouquetsId,
                is_active: true,
                sort_order: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                name: 'Seasonal',
                description: 'Seasonal flower arrangements',
                image_url: '/uploads/categories/seasonal.jpg',
                parent_id: bouquetsId,
                is_active: true,
                sort_order: 2,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                name: 'Wedding',
                description: 'Special bouquets for weddings',
                image_url: '/uploads/categories/wedding.jpg',
                parent_id: bouquetsId,
                is_active: true,
                sort_order: 3,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                name: 'Indoor Plants',
                description: 'Plants for home and office',
                image_url: '/uploads/categories/indoor.jpg',
                parent_id: plantsId,
                is_active: true,
                sort_order: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                name: 'Outdoor Plants',
                description: 'Plants for garden and terrace',
                image_url: '/uploads/categories/outdoor.jpg',
                parent_id: plantsId,
                is_active: true,
                sort_order: 2,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                name: 'Vases',
                description: 'Beautiful vases for your flowers',
                image_url: '/uploads/categories/vases.jpg',
                parent_id: accessoriesId,
                is_active: true,
                sort_order: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: uuidv4(),
                name: 'Gardening Tools',
                description: 'Tools for plant care',
                image_url: '/uploads/categories/tools.jpg',
                parent_id: accessoriesId,
                is_active: true,
                sort_order: 2,
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('categories', null, {});
    }
};