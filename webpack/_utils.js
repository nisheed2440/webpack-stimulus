require('./_cli');
const webpack = require('webpack');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const minify = require('html-minifier').minify;
const beautify = require('js-beautify').js_beautify;
const Table = require('cli-table');
const del = require('del');
const concat = require('concat');
const rules = require('./_rules');
const plugins = require('./_plugins');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

// Object to pass the instances of the plugins.
const pluginsObj = {
    ExtractTextPlugin,
    CleanWebpackPlugin,
    CopyWebpackPlugin,
    UglifyJsPlugin
};
/**
 * Functiont to output the component information gathered in tabular format
 * @param {Array} configs Array containing the component config object
 */
function outputComponentData(configs) {
    const table = new Table({
        head: ['Component Name', 'Controller Name'],
        style: {
            head: ['yellow'],
            border: ['yellow']
        }
    });
    configs.forEach(config => {
        table.push([config.componentName, config.componentCtrl]);
    });
    // Output the tabular data
    console.log(table.toString());
}
/**
 * Function to retrieve all the partials associated with a component and add it to 
 * global.PARTIALS_OBJ object.
 * @param {Object} options The component configuration object
 * @returns {Promise} 
 */
function getComponentPartials(options) {
    return new Promise((resolve, reject) => {
        const promisesArray = [];
        glob(path.join(options.root, options.dirname, 'partials', '*.hbs'), (err, files) => {
            if (err) {
                reject(err);
            }
            files.forEach(file => {
                const fileName = path.basename(file);
                const partialName = `_${_.camelCase(path.basename(file, path.extname(fileName)))}`;
                promisesArray.push(new Promise((f_resolve, f_reject) => {
                    fs.readFile(file, {
                        encoding: 'utf8'
                    }, (f_err, f_data) => {
                        if (f_err) {
                            f_reject(f_err);
                        }
                        const partialContents = minify(f_data.toString(), {
                            collapseWhitespace: true,
                            removeComments: true
                        });
                        global.PARTIALS_OBJ[partialName] = partialContents;
                        f_resolve(partialContents);
                    });
                }));
            });
            resolve(promisesArray);
        });
    }).then(promises => {
        return Promise.all(promises);
    });
}
/**
 * Function used to create a partials file that exports an object of type [partialName] = [partialTemplate]
 * used by fractal at run time to used partials in composable components.
 * @param {Object} partailsObj The object containing the contents of global.PARTIALS_OBJ
 */
function writePartialsFile(partailsObj) {
    return new Promise((resolve, reject) => {
        const fileContents = beautify(`module.exports = ${JSON.stringify(partailsObj)}`, {
            indent_size: 2
        });
        fs.writeFile('dist/partials.js', fileContents, (err) => {
            if (err) {
                reject(err);
            }
            resolve(fileContents);
        });
    });
}
/**
 * Function to create an async webpack compiler instance and run it
 * @param {Object} config The webpack condig object for the component or file
 * @param {Object} [options] The component config object
 */
function createWebpackInstance(config, options) {
    return new Promise((resolve, reject) => {
        const compiler = webpack(config);
        const compilerCb = async (err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) {
                    console.error(err.details.toString());
                }
                reject(err);
                return;
            }

            const info = stats.toJson();

            if (stats.hasErrors()) {
                console.error(info.errors.toString());
            }

            if (stats.hasWarnings()) {
                console.warn(info.warnings.toString());
            }
            // Run other tasks like creation of files per component etc.
            if (options && options.hasOwnProperty('component')) {
                //  Get the partials belonging to the components and add it to the global partials object
                await getComponentPartials(options);
                if (!global.FTL_FIRST_RUN) {
                    await writePartialsFile(global.PARTIALS_OBJ).then(() => {
                        // Trigger re-build fractal partials and helpers
                        if (global.FTL_SERVER) {
                            global.updateFractalEngine();
                            global.FTL_SERVER.emit('source:changed');
                        }
                    });
                }
            }
            resolve(stats);
        };
        if (global.FTL_WATCH) {
            compiler.watch({}, compilerCb);
        } else {
            compiler.run(compilerCb);
        }
    });
}
/**
 * Function to create the component configs used by webpack for component builds
 * @param {String} root The directory root of the application
 */
function createComponentConfigs(root) {
    return new Promise(function (resolve, reject) {
        const configs = [];
        const {
            stimulus,
            app
        } = require('./_externals');

        glob('./src/app/components/**/*.js', (err, files) => {
            if (err) {
                reject(err);
            }
            files.forEach((file) => {
                const dirname = path.dirname(file);
                const component = path.basename(file, path.extname(file));
                const componentFile = path.basename(file);
                const componentName = path.basename(dirname);
                const componentCtrl = _.upperFirst(_.camelCase(`${componentName}Controller`));

                configs.push({
                    root,
                    componentFile,
                    componentName,
                    componentCtrl,
                    component,
                    dirname,
                    webpack: {
                        devtool: global.FTL_SOURCEMAP && 'source-map',
                        entry: file,
                        output: {
                            filename: componentFile,
                            path: path.resolve(root, 'dist', 'components', 'components', componentName, 'lib'),
                            library: ['DNG', componentCtrl],
                            libraryTarget: 'umd'
                        },
                        module: {
                            rules: rules.getComponentWebpackRules(pluginsObj)
                        },
                        externals: [{
                                stimulus
                            },
                            {
                                app
                            }
                        ],
                        plugins: plugins.getComponentWebpackPlugins(pluginsObj, {
                            root,
                            componentFile,
                            componentName,
                            componentCtrl,
                            component,
                            dirname,
                        })
                    }
                });
            });
            outputComponentData(configs);
            resolve(configs);
        });
    });
}
/**
 * Function to create the vendor configs used by webpack for vendor,polyfill file builds
 * @param {String} root The directory root of the application
 */
function createVendorConfigs(root) {
    return new Promise((resolve) => {
        const createVendorConfigs = {
            webpack: {
                devtool: global.FTL_SOURCEMAP && 'source-map',
                entry: {
                    'vendor': path.resolve(root, 'src/vendor.js'),
                    'polyfills': path.resolve(root, 'src/polyfills.js'),
                },
                output: {
                    filename: `[name].js`,
                    path: path.resolve(root, 'dist'),
                    library: ['DNG', '[name]'],
                    libraryTarget: 'umd'
                },
                module: {
                    rules: rules.getVendorWebpackRules(pluginsObj)
                },
                plugins: plugins.getVendorWebpackPlugins(pluginsObj)
            }
        };
        resolve([createVendorConfigs]);
    });
}
/**
 * Function to create the app configs used by webpack for app file builds
 * @param {String} root The directory root of the application
 */
function createAppConfigs(root) {
    return new Promise((resolve) => {
        const {
            stimulus
        } = require('./_externals');
        const appConfig = {
            webpack: {
                devtool: global.FTL_SOURCEMAP && 'source-map',
                entry: {
                    'app': path.resolve(root, 'src/app.js')
                },
                output: {
                    filename: `[name].js`,
                    path: path.resolve(root, 'dist'),
                    library: ['DNG', 'App'],
                    libraryTarget: 'umd'
                },
                module: {
                    rules: rules.getVendorWebpackRules(pluginsObj)
                },
                plugins: plugins.getAppWebpackPlugins(pluginsObj),
                externals: [{
                    stimulus
                }],
            }
        };
        resolve([appConfig]);
    });
}

/**
 * Function to delete files and folders
 * @param {Array|String} globs Glob patterns to delete
 */
function cleanUp(globs) {
    return del(globs, {
        force: true
    });
}

function concatFiles(globs, filename) {
    return new Promise((resolve, reject) => {
        glob(globs, (err, files) => {
            if (err) {
                reject(err);
            }
            concat(files).then((result) => {
                resolve(result);
            });
        });
    }).then(str => {
        return new Promise((res, rej) => {
            fs.writeFile(path.resolve(filename), str, (err) => {
                if (err)
                    return rej(err);
                return res(str);
            });
        });
    });
}


module.exports = {
    cleanUp,
    concatFiles,
    outputComponentData,
    writePartialsFile,
    createWebpackInstance,
    createComponentConfigs,
    createVendorConfigs,
    createAppConfigs
};