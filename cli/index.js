#!/usr/bin/env node
/**
 * @fileoverview
 * CLI endpoint
 */
/**
 * @license MIT
 */

const commander = require('commander');
const { build, compile } = require('..');

commander
    .command('compile <file>')
    .description('Compile a single YAMLayout file and dump it to stdout.')
    .action(compile);

commander
    .command('build')
    .description(
        'Compile YAMLayout files and save them to the output directory.',
    )
    .option('-i, --input <f>', 'Input file or directory', './dev')
    .option('-o, --output <dir>', 'Output directory', './build')
    .option('-r, --root <dir>', 'Project directory root', './dev')
    .action(build);

commander.parse(process.argv);
