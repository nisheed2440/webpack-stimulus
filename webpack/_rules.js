/**
 * Function to get all the webpack configuration rules for a component
 */
function getComponentWebpackRules({
    ExtractTextPlugin
}) {
    return [{
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'eslint-loader',
    }, {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: 'babel-loader'
    }, {
        test: /(\.css|\.scss)$/,
        exclude: /(node_modules|bower_components)/,
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [{
                    loader: 'css-loader',
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        plugins: [require('postcss-cssnext')]
                    }
                },
                {
                    loader: 'sass-loader',
                }
            ]
        })
    }];
}
/**
 * Function to get all the webpack configuration rules for vendor files
 */
function getVendorWebpackRules(pluginsObj) {
    return getComponentWebpackRules(pluginsObj);
}

module.exports = {
    getComponentWebpackRules,
    getVendorWebpackRules
};