/**
 * Webpack external data configuration for app and component files.
 */
// Stimulus external config
const stimulus = {
    commonjs: 'stimulus',
    commonjs2: 'stimulus',
    root: ['DNG', 'vendor', 'stimulus']
};
// Global app external config
const app = {
    commonjs: ['DNG', 'App'],
    commonjs2: ['DNG', 'App'],
    root: ['DNG', 'App']
};


module.exports = {
    stimulus,
    app
};