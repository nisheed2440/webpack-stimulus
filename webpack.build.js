const utils = require('./webpack/_utils');
const chalk = require('chalk');

// A partials object that would be written to a file.
global.PARTIALS_OBJ = {};

async function build() {
    const timerLabel = chalk.green(`Webpack Build`);
    console.time(timerLabel);
    const webpackConfigs = [];
    // Get all the component configs
    const componentConfigs = await utils.createComponentConfigs(__dirname);
    // Get the App config

    // Get the Vendor configs
    const appConfig = await utils.createAppConfigs(__dirname);

    [...componentConfigs, ...appConfig].forEach(config => {
        webpackConfigs.push(utils.createWebpackInstance(config.webpack, config));
    });
    // Clean up the dist folder
    await utils.cleanUp(['./dist']);
    // Build all the webpack configs
    await Promise.all(webpackConfigs).then(() => {
        // Write partials file for the fractal build
        return utils.writePartialsFile(global.PARTIALS_OBJ);
    });
    // Output the total build times
    console.timeEnd(timerLabel);
}

build();