const argv = require('yargs')
    // Watch option
    .describe('w', 'Watch files')
    .alias('w', 'watch')
    // Deploy option
    .describe('d', 'Create deployable codebase')
    .alias('d', 'deploy')
    // Prod option
    .describe('p', 'Create production codebase')
    .alias('p', 'prod')
    // Source map option
    .describe('sm', 'Generate source map')
    .alias('sm', 'source-map')
    // Help Option
    .help('h')
    .alias('h', 'help')
    .argv;

function setCliOptions() {
    if(argv.w === true && argv.d !== true) {
        global.FTL_WATCH = true;
    }
    if(argv.d === true && argv.w !== true) {
        global.FTL_BUILD = true;
    }
    
    global.FTL_PROD = argv.p || false;
    global.FTL_SOURCEMAP = argv.sm || false;
}
setCliOptions();