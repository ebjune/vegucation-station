"use strict";
// IPC Channel types for type-safe communication between main and renderer
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
// IPC Channel names
exports.IPC_CHANNELS = {
    // Database
    DB_GET_CATEGORIES: 'db:getCategories',
    DB_GET_PRODUCE: 'db:getProduce',
    DB_GET_AVAILABLE_PRODUCE: 'db:getAvailableProduce',
    DB_SET_PRODUCE_AVAILABILITY: 'db:setProduceAvailability',
    DB_ADD_PRODUCE: 'db:addProduce',
    // Education
    EDUCATION_GET_CONTENT: 'education:getContent',
    EDUCATION_GENERATE: 'education:generate',
    // Recipes
    RECIPES_GENERATE: 'recipes:generate',
    RECIPES_GET_CACHED: 'recipes:getCached',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_VERIFY_PIN: 'settings:verifyPin',
    // Email
    EMAIL_SEND_RECIPE: 'email:sendRecipe',
    // App
    APP_GET_VERSION: 'app:getVersion',
    APP_IS_ONLINE: 'app:isOnline',
};
