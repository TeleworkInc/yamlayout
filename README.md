
# 🍠 YAMLayout 🍠
This library transpiles YAML to React JSX.   It can compile a single file with `yamlayout compile file.yaml`, or recursively build a directory with `yamlayout build`.

For instance, `example/src/pages/home.yaml` looks like:
```yaml
# import Div100vh from 'react-div-100vh'
# include hero

- hero: Test

- Div100vh.testClass:
    - div.testClass:
        - h1: inside an h1
        - This is just a text node
        - h1:
            - a:
                children: A link
                href: https://google.com
            - br: # with no properties, use a : to establish an object
            - A text node
            - span: A span element
        - h2: This is a header

- h1.test1.test2#test: inside h1.test1.test2

- h1.test: Inside h1.test

- home:
    className: manualClass1 manualClass2
    onClick:
        # FUNCTIONS WORK TOO :-)
        function: () => alert('test')
    children:
        - p: Manual child
        - p: Manual child 2
        - p: "Quoted strings work too"
```

The `# include hero` transpiles to `import hero from '../components/hero.js'` (it's okay that the component is defined as `hero.yaml`, because it will be transpiled to `hero.js` when built). This example shows many of the basic features, like CSS definitions for `className` and `id`, `include` statements, and providing functions for JSX properties via `function` object.

`yamlayout compile example/dev/pages/home.yaml` produces the following output:

```javascript
import React from 'react'
import Div100vh from 'react-div-100vh'
import hero from '../components/hero'

const home = (props) => (<><hero>{`Test`}</hero><Div100vh className={`testClass`}><div className={`testClass`}><h1>{`inside an h1`}</h1>{`This is just a text node`}<h1><a href={`https://google.com`}>{`A link`}</a><br />{`A text node`}<span>{`A span element`}</span></h1><h2>{`This is a header`}</h2></div></Div100vh><h1 id={`test`} className={`test1 test2`}>{`inside h1.test1.test2`}</h1><h1 className={`test`}>{`Inside h1.test`}</h1><home className={`manualClass1 manualClass2`} onClick={() => alert('test')}><p>{`Manual child`}</p><p>{`Manual child 2`}</p><p>{`Quoted strings work too`}</p></home></>);

export default home
```

Descend into `example/` and run `yamlayout build` to build the `dev/` directory, output will be stored at `.build/src/` by default (for compatibility with `site-rocket`, a tool integrating YAMLayout with Gatsby). (If run without options from outside a YAMLayout project directory, compiled files will be stored next to their YAML counterparts.)
