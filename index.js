#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const walk = require('walk');
const chalk = require('chalk');
const yaml = require('js-yaml');

const { toXml, toReact } = require('./bin');
const isYaml = (fname) => (
  path.extname(fname) == '.yaml' || path.extname(fname) == '.yml'
);
const skipCompilation = (text) => /^\# nocompile/i.test(text.split('\n')[0]);

const defaults = {
  root: './dev',
  input: './dev',
  output: './build',
};

const renameFile = (name) => !isYaml(name)
    ? path.resolve(name)
    : path.resolve(
        path.dirname(name),
        path.basename(name, path.extname(name))
        + '.js',
    );

// compile a single file
const compile = (fname, log = true) => {
  if (!fs.lstatSync(fname).isFile()) {
    return console.log(
        chalk.red('ERROR! The [compile] command is for single files.'),
        '',
        'Please use [build] to recursively compile YAML files in a directory.',
    );
  }

  if (!isYaml(fname)) {
    return console.log(
        chalk.red('YAMLayout can only compile YAML files. =('),
    );
  }

  const logAndExit = (v) => {
    if (log) console.log(v);
    return v;
  };

  const
    mainName = path.basename(fname, '.yaml');
  const yamlContent = fs.readFileSync(fname).toString();
  const yamlLns = yamlContent.split('\n');
  const skipCompile = skipCompilation(yamlContent);
  const jsonContent = yaml.safeLoad(yamlContent);
  const xmlContent = skipCompile ? '' : toXml(jsonContent);

  if (skipCompile) {
    return logAndExit(jsonContent);
  }

  const imports = [];
  const includes = [];

  // parse imports and includes
  yamlLns.forEach((ln) => {
    if (/^\# import/.test(ln)) {
      imports.push(ln.substr(1).trim());
    }

    else if (/^\# include/.test(ln)) {
      const base = ln.substr(1).trim().replace(/^include/, 'import');
      const includeName = base.split(/\s+/)[1].toLowerCase();
      includes.push(`${base} from '../components/${includeName}'`);
    }
  });

  const reactContent = toReact(mainName, xmlContent, { imports, includes });
  return logAndExit(reactContent);
};

const buildSingle = async (args) => {
  const devRoot = path.resolve(args.root);
  const buildRoot = path.resolve(args.output);
  const loadLocation = path.resolve(args.input);
  const saveLocation = renameFile(args.input).replace(devRoot, buildRoot);
  const saveDir = path.dirname(saveLocation);

  console.log(loadLocation);
  console.log('-->', saveLocation, '\n');

  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  const compiled = isYaml(loadLocation)
        ? compile(loadLocation, false)
        : fs.readFileSync(loadLocation);

  fs.writeFileSync(saveLocation, compiled);
  return true;
};

const build = async (args = defaults) => {
  if (args && 'args' in args && args.args.length) {
    return console.log('Please use -i to specify input.');
  }

  console.log('YAMLAYOUT: Building...\n');

  const isDirectory = await fs.lstatSync(args.input).isDirectory();
  if (!isDirectory) {
    return buildSingle(args);
  }

  const walker = await walk.walk(args.input, {
    followLinks: false,
    filters: ['.git'],
  });

  await walker.on('file', (dir, stat, next) => {
    buildSingle({
      root: args.root,
      input: path.resolve(dir, stat.name),
      output: args.output,
    });

    next();
  });

  return true;
};

module.exports = {
  compile,
  build,
};
