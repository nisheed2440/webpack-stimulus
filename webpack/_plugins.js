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
        }])
    ];
}

module.exports = {
    getComponentWebpackPlugins
};