const webpack = require('webpack');
/**
 * Function to get all the webpack configuration plugins for a component
 */
function getComponentWebpackPlugins({
    ExtractTextPlugin,
    CopyWebpackPlugin
}, {
    componentName,
    dirname
}) {
    return [
        new ExtractTextPlugin(`${componentName}.css`),
        new CopyWebpackPlugin([{
            from: `${dirname}`,
            to: `../`
        }]),
        new webpack.DefinePlugin({
            'app': 'DNG.App'
        })
    ];
}

/**
 * Function to get all the webpack configuration plugins for vendor files
 */
function getVendorWebpackPlugins({
    ExtractTextPlugin
}) {
    return [
        new ExtractTextPlugin(`[name].css`)
    ];
}

/**
 * Function to get all the webpack configuration plugins for app files
 */
function getAppWebpackPlugins({
    ExtractTextPlugin,
    CopyWebpackPlugin
}) {
    return [
        new ExtractTextPlugin(`[name].css`),
        new CopyWebpackPlugin([{
            from: `src/docs`,
            to: `./docs`
        }, {
            from: `src/assets`,
            to: `./assets`
        }, {
            from: `src/app/pages`,
            to: `./components/pages`
        },{
            from: `src/_fractal/_preview-templates`,
            to: `./components/_preview-templates`
        }])
    ];
}

module.exports = {
    getComponentWebpackPlugins,
    getVendorWebpackPlugins,
    getAppWebpackPlugins
};