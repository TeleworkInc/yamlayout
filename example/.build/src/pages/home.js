import React from 'react'
import Div100vh from 'react-div-100vh'
import hero from '../components/hero'

const home = (props) => (<><hero>{`Test`}</hero><Div100vh className={`testClass`}><div className={`testClass`}><h1>{`inside an h1`}</h1>{`This is just a text node`}<h1><a href={`https://google.com`}>{`A link`}</a><br />{`A text node`}<span>{`A span element`}</span></h1><h2>{`This is a header`}</h2></div></Div100vh><h1 id={`test`} className={`test1 test2`}>{`inside h1.test1.test2`}</h1><h1 className={`test`}>{`Inside h1.test`}</h1><home className={`manualClass1 manualClass2`} onClick={() => alert('test')}><p>{`Manual child`}</p><p>{`Manual child 2`}</p><p>{`Quoted strings work too`}</p></home></>);

export default home