/* eslint-disable */

const entityCore = require('html-entities').AllHtmlEntities;
const htmlEntities = new entityCore();

const sanitize = (str) => {
  if (/\d/.test(str[0])) {
    str = 'p' + str;
  }

  return str.replace('-', '');
};

const toXml = (input) => {
  const output = new Output();

  // catch strings
  if (typeof(input) == 'string') {
    return new TagModel(input).selfClose;
  }

  // catch arrays
  if (input instanceof Array) {
    return output.writeN(input, false).read();
  }

  // catch objects
  if (typeof(input) !== 'object') {
    throw console.trace(
        'Only Strings, Arrays, and Objects accepted. GOT:', input,
    );
  }

  for (const [key, val] of Object.entries(input)) {
    output.write(
        new TagModel(key, val).build().read(),
    );
  }

  return output.read();
};

const toReact = (name = 'Home', input, { imports, includes }) => {
  const
    reactStmt = 'import React from \'react\'\n';
  const importStmts = new Output(reactStmt).writeN(imports).writeN(includes);
  const exportStmts = `export default ${sanitize(name)}`;
  const body = `\nconst ${sanitize(name)} = (props) => (<>${input}</>);\n\n`;

  return importStmts.read() + body + exportStmts;
};

class Output {
  constructor(init = '') {
    this.output = '';
    this.write(init);
  }

  write(s) {
    return this.output += s;
  }

  writeN(s, newline = true) {
    let isString;

    for (const s_i of s) {
      isString = typeof(s_i) == 'string',
      this.write(
          // use if string, else parse JSON
          (isString ? s_i : toXml(s_i))
                // add newline by default
                + (newline ? '\n' : ''),
      );
    }

    return this;
  }

  read() {
    return this.output;
  }
}

class TagModel {
  constructor(key, val) {
    this.reservedProps = ['children', 'txt'];
    this.key = key, this.val = val;
    this
        .parseChildren()
        .parseShortcodes()
        .encodeProps()
        .setFields();
  }

  parseShortcodes() {
    let tag; let id; let classes;
    [tag, id] = this.tag.split('#');
    [tag, ...classes] = tag.split('.');

    if (tag) this.tag = tag;
    if (id) this.props.id = id;
    if (classes.length) this.props.className = classes.join(' ');

    // console.log(this.tag, this.props.id, this.props.className);
    return this;
  }

  sanitizeString(s) {
    return s.replace('`', '\\`');
  }

  stringExpression(s) {
    return `\{\`${this.sanitizeString(s)}\`\}`;
  }

  parseChildren() {
    const key = this.key;
    const val = this.val;

    // read el: "Text" as <el>Text</el>
    if (typeof(key) == 'string' && typeof(val) == 'string') {
      this.tag = key,
      this.props = {},
      this.children = [this.stringExpression(val)];

      return this;
    }

    const valIsObject = val instanceof Object;
    const valIsArray = val instanceof Array;
    const hasProps = valIsObject && !valIsArray;
    const txtParse = (child) => {
      if (typeof(child) == 'object' && 'txt' in child && Object.entries(child).length == 1) {
        return child.txt;
      }

      if (typeof(child) == 'string') {
        return this.stringExpression(child);
      }

      else {
        return child;
      }
    };

    this.tag = key,
    this.props = hasProps ? val : {},
    this.children = valIsArray ? val : ((val || {}).children || []);

    if (!(this.children instanceof Array)) {
      this.children = [this.children];
    }

    // read <txt>inner</txt> as "inner" (string literal)
    this.children = this.children.map(txtParse);
    return this;
  }

  encodeProps() {
    let propString = '';

    for (let [key, val] of Object.entries(this.props)) {
      key = key || '',
      val = val || '';

      const isFunction = val instanceof Object &&
                Object.keys(val).length == 1 &&
                'function' in val;

      // embed if function
      if (isFunction) val = `{${val.function}}`;

      key = htmlEntities.encode(key.toString()),
      val = typeof val !== 'string' ? JSON.stringify(val) : val;

      if (!isFunction) val = this.stringExpression(val);

      // reserved attributes
      if (!this.reservedProps.includes(key)) {
        propString += ` ${key}=${val}`;
      }

      // raw text node
      else if (key == 'txt') {
        this.children.push(val);
      }
    }

    this.propsLn = `${this.tag}${propString}`;
    return this;
  }

  setFields() {
    this.selfClose = `<${this.propsLn} />`;
    this.open = `<${this.propsLn}>`;
    this.close = `</${this.tag}>`;

    return this;
  }

  build() {
    const output = new Output();

    if (!this.children.length) {
      output.write(this.selfClose);
    }

    else {
      output.write(this.open),
      output.writeN(this.children, false),
      output.write(this.close);
    }

    this.output = output;
    return this;
  }

  read() {
    return this.output.read();
  }
}

module.exports = {
  Output,
  TagModel,
  toReact,
  toXml,
};
