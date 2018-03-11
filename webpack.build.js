const utils = require('./webpack/_utils');
const chalk = require('chalk');
const path = require('path');

// A partials object that would be written to a file.
global.PARTIALS_OBJ = {};
global.FTL = null;
global.FTL_LOGGER = null;
global.FTL_SERVER = null;

/**
 * Function to require uncached module/file 
 * @param {string} module The name of the module that needs to be freshly required.
 * https://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
 */
function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

async function build() {
    const timerLabel = chalk.green(`Webpack Build`);
    console.time(timerLabel);
    const webpackConfigs = [];
    // Get all the component configs
    const componentConfigs = await utils.createComponentConfigs(__dirname);
    // Get the App config
    const appConfig = await utils.createAppConfigs(__dirname);
    // Get the Vendor configs
    const vendorConfig = await utils.createVendorConfigs(__dirname);
    // Create multiple webpack compiler instances and add it to a promises array
    [...componentConfigs, ...vendorConfig, ...appConfig].forEach(config => {
        webpackConfigs.push(utils.createWebpackInstance(config.webpack, config));
    });
    // Clean up the dist folder
    await utils.cleanUp(['./dist']);
    // Build all the webpack configs
    await Promise.all(webpackConfigs).then(() => {
        // Write partials file for the fractal build
        return utils.writePartialsFile(global.PARTIALS_OBJ).then(() => {
            return fractalStart();
        });
    });
    // Output the total build times
    console.timeEnd(timerLabel);
}

/*
 * Configure a Fractal instance.
 *
 * This configuration could also be done in a separate file, provided that this file
 * then imported the configured fractal instance from it to work with in your Gulp tasks.
 * i.e. const fractal = require('./my-fractal-config-file');
 */
function fractalStart() {
    /* Create a new Fractal instance and export it for use elsewhere if required */
    const fractal = module.exports = require('@frctl/fractal').create();
    /** Fractal theme overrides for fractulus */
    const mandelbrot = require('@frctl/mandelbrot')({
        favicon: '/fractulus/assets/favicon.ico',
        nav: ['docs', 'components'],
        lang: 'en-US',
        styles: ['default'],
        scripts: ['default'],
        static: {
            mount: 'theme'
        }
    });

    /* Set the title of the project */
    fractal.set('project.title', `Fractulus`);
    fractal.set('project.version', `1.0.0`);
    fractal.set('project.author', `Nisheed Jagadish`);

    /* Tell Fractal where the components will live */
    fractal.components.set('path', __dirname + '/dist/components');

    /* Tell Fractal where the documentation pages will live */
    fractal.docs.set('path', __dirname + '/dist/docs');

    /* Specify a directory of static assets */
    fractal.web.set('static.path', __dirname + '/dist');

    /* Set the static HTML build destination */
    fractal.web.set('builder.dest', __dirname + '/build');

    /** Set web theme */
    fractal.web.theme(mandelbrot);

    /* Set the default preview template */
    fractal.components.set('default.preview', '@component-preview');
    fractal.components.set('title', 'Core');
    fractal.components.set('label', 'core');

    // any other configuration or customisation here
    global.FTL_LOGGER = fractal.cli.console; // keep a reference to the fractal CLI console utility
    global.FTL = fractal;

    /** 
     * Function to update the partials and helpers in the hbs engine used in the fractal instance.
     */
    global.updateFractalEngine = function () {
        const hbs = require('@frctl/handlebars')({
            helpers: {
                json: function (context) {
                    return JSON.stringify(context, null, 4);
                },
                pathJoin: function (...args) {
                    args.pop();
                    return path.join(...args).replace(/\\/g, '/');
                },
                componentAsset: function(assetObj, componentName) {
                    if(assetObj.name === componentName) {
                        let ext = assetObj.isSCSS ? '.css' : assetObj.ext;
                        return path.join('../', assetObj.relPath, `../lib/${componentName}${ext}`);
                    }
                    return false;
                }
            },
            partials: requireUncached('./dist/partials')
            /* other configuration options here */
        });

        global.FTL.components.engine(hbs); /* set as the default template engine for components */
        global.FTL.docs.engine(hbs); /* you can also use the same instance for documentation, if you like! */
    };

    return createFractalServer();
}

// Create fractal server instance
function createFractalServer() {
    // Update partials and helpers in the hbs engine
    global.updateFractalEngine();
    global.FTL_SERVER = global.FTL.web.server({
        sync: true
    });

    global.FTL_SERVER.on('error', err => global.FTL_LOGGER.error(err.message));

    return global.FTL_SERVER.start().then(() => {
        global.FTL_LOGGER.success(`Fractal server is now running at ${global.FTL_SERVER.url}`);
        global.FTL_SERVER.emit('source:changed');
    });
}

build();