/**
 * @fileoverview
 * Utilities for CLI.
 */
/**
 * @license MIT
 */

const EntityCore = require('html-entities').AllHtmlEntities;
const htmlEntities = new EntityCore();

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

/**
 * A utility object for reading and writing to a single output.
 */
class Output {
  /**
   * Initialize a new Output object.
   *
   * @param {string} init
   * The initial string to set output as.
   */
  constructor(init = '') {
    this.output = '';
    this.write(init);
  }

  /**
   * Write a string to the output.
   *
   * @param {string} string
   * @return {string}
   */
  write(string) {
    return this.output += string;
  }

  /**
   * Write multiple strings to the output.
   *
   * @param {string} strings
   * The string to write.
   *
   * @param {boolean} newline
   * Whether or not to add a newline.
   *
   * @return {Output} this
   */
  writeN(strings, newline = true) {
    let isString;

    for (const string of strings) {
      isString = typeof(string) == 'string',
      this.write(
          // use if string, else parse JSON
          (isString ? string : toXml(string))
                // add newline by default
                + (newline ? '\n' : ''),
      );
    }

    return this;
  }

  /**
   * Return the current state of the Output.
   *
   * @return {string}
   */
  read() {
    return this.output;
  }
}

/**
 * A model for parsing props from a yaml document.
 */
class TagModel {
  /**
   * The
   *
   * @param {string} key
   * @param {key} val
   */
  constructor(key, val) {
    this.reservedProps = ['children', 'txt'];
    this.key = key, this.val = val;
    this
        .parseChildren()
        .parseShortcodes()
        .encodeProps()
        .setFields();
  }

  /**
   * Parse shortcodes from a key value.
   *
   * @return {TagModel} this
   */
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

  /**
   * Sanitize a string to embed in the compiled JS document.
   *
   * @param {string} string
   * @return {string}
   */
  sanitizeString(string) {
    return string.replace('`', '\\`');
  }

  /**
   * Create a string expression containing the given value.
   *
   * @param {string} string
   * Value to embed in a template literal.
   *
   * @return {string}
   */
  stringExpression(string) {
    return `\{\`${this.sanitizeString(string)}\`\}`;
  }

  /**
   * Parse children from a Tag node.
   *
   * @return {TagModel} this
   */
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
      if (
        typeof(child) == 'object' &&
          'txt' in child &&
          Object.entries(child).length == 1
      ) {
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

  /**
   * Encode object properties as a JSX object.
   *
   * @return {TagModel} this
   */
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

  /**
   * Set the fields of a JSX string.
   *
   * @return {TagModel} this
   */
  setFields() {
    this.selfClose = `<${this.propsLn} />`;
    this.open = `<${this.propsLn}>`;
    this.close = `</${this.tag}>`;

    return this;
  }

  /**
   * Build a JSX string from a TagModel.
   *
   * @return {TagModel} this
   */
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

  /**
   * Return the string value of this TagModel.
   *
   * @return {TagModel} this
   */
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
