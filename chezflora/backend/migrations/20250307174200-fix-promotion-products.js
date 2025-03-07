'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Supprimer la table promotion_products si elle existe
        await queryInterface.dropTable('promotion_products', { force: true }).catch(() => {
            // Ignorer les erreurs si la table n'existe pas
        });

        // 1. Créer d'abord la table sans contraintes
        await queryInterface.createTable('promotion_products', {
            promotion_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            product_id: {
                type: Sequelize.UUID,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // 2. Ajouter la clé primaire composite
        await queryInterface.addConstraint('promotion_products', {
            fields: ['promotion_id', 'product_id'],
            type: 'primary key',
            name: 'pk_promotion_products'
        });

        // 3. Ajouter la première contrainte de clé étrangère
        await queryInterface.addConstraint('promotion_products', {
            fields: ['promotion_id'],
            type: 'foreign key',
            name: 'fk_promotion_products_promotion',
            references: {
                table: 'promotions',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        // 4. Ajouter la deuxième contrainte de clé étrangère
        await queryInterface.addConstraint('promotion_products', {
            fields: ['product_id'],
            type: 'foreign key',
            name: 'fk_promotion_products_product',
            references: {
                table: 'products',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('promotion_products');
    }
};