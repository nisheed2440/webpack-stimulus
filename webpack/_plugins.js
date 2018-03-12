/**
 * Function to get all the webpack configuration plugins for a component
 */
function getComponentWebpackPlugins({
    ExtractTextPlugin,
    CopyWebpackPlugin,
    UglifyJsPlugin
}, {
    componentName,
    dirname
}) {
    const componentPlugins = [
        new ExtractTextPlugin(`${componentName}.css`),
        new CopyWebpackPlugin([{
            from: `${dirname}`,
            to: `../`
        }])
    ];
    if (global.FTL_PROD === true) {
        componentPlugins.push(
            new UglifyJsPlugin({
                parallel: true,
                sourceMap: global.FTL_SOURCEMAP
            })
        );
    }
    return componentPlugins;
}

/**
 * Function to get all the webpack configuration plugins for vendor files
 */
function getVendorWebpackPlugins({
    ExtractTextPlugin,
    UglifyJsPlugin
}) {
    const vendorPlugins = [
        new ExtractTextPlugin(`[name].css`)
    ];
    if (global.FTL_PROD === true) {
        vendorPlugins.push(
            new UglifyJsPlugin({
                parallel: true,
                sourceMap: global.FTL_SOURCEMAP
            })
        );
    }
    return vendorPlugins;
}

/**
 * Function to get all the webpack configuration plugins for app files
 */
function getAppWebpackPlugins({
    ExtractTextPlugin,
    CopyWebpackPlugin,
    UglifyJsPlugin
}) {
    const appPlugins = [
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
        }, {
            from: `src/_fractal/_preview-templates`,
            to: `./components/_preview-templates`
        }])
    ];
    if (global.FTL_PROD === true) {
        appPlugins.push(
            new UglifyJsPlugin({
                parallel: true,
                sourceMap: global.FTL_SOURCEMAP
            })
        );
    }
    return appPlugins;
}

module.exports = {
    getComponentWebpackPlugins,
    getVendorWebpackPlugins,
    getAppWebpackPlugins
};