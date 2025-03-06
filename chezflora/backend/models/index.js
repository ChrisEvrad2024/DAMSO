'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];
const db = {};

// Initialiser la connexion Sequelize
let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            ...config,
            logging: config.logging ? console.log : false,
            define: {
                underscored: true,
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at'
            }
        }
    );
}

// ÉTAPE 1: Charger tous les modèles d'abord
fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&      // Ignorer les fichiers cachés
            file !== basename &&            // Ignorer ce fichier (index.js)
            file.slice(-3) === '.js' &&     // Seulement les fichiers .js
            file.indexOf('.test.js') === -1 // Ignorer les fichiers de test
        );
    })
    .forEach(file => {
        try {
            const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
            console.log(`Model loaded: ${model.name}`);
        } catch (error) {
            console.error(`Error loading model from file ${file}:`, error);
        }
    });

// ÉTAPE 2: Établir les associations après le chargement complet
console.log('Setting up model associations...');
Object.keys(db).forEach(modelName => {
    try {
        if (db[modelName].associate) {
            db[modelName].associate(db);
            console.log(`Associations established for model: ${modelName}`);
        }
    } catch (error) {
        console.error(`Error setting up associations for model ${modelName}:`, error);
    }
});

// Ajouter les instances Sequelize au db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Fonction de test de connexion
db.testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

// Fonction pour synchroniser les modèles avec la base de données
db.syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('Database synchronized successfully.');
        return true;
    } catch (error) {
        console.error('Failed to sync database:', error);
        return false;
    }
};

// Exporter le module
module.exports = db;