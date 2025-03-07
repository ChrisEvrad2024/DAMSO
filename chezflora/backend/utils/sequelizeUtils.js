/**
 * Convertit en toute sécurité une instance ou un tableau d'instances Sequelize
 * en objets JavaScript simples, évitant les références circulaires
 * @param {Object|Array} data - Instance(s) Sequelize
 * @returns {Object|Array} - Objets JavaScript simples
 */
exports.toJSON = (data) => {
    if (!data) return null;

    if (Array.isArray(data)) {
        return data.map(item => item && typeof item.get === 'function' ? item.get({ plain: true }) : item);
    }

    return data && typeof data.get === 'function' ? data.get({ plain: true }) : data;
};