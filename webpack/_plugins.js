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
    ExtractTextPlugin,
    CopyWebpackPlugin
}) {
    return [
        new ExtractTextPlugin(`[name].css`),
        new CopyWebpackPlugin([{
            from: `src/index.html`,
            to: `./`
        }])
    ];
}

module.exports = {
    getComponentWebpackPlugins,
    getVendorWebpackPlugins
};