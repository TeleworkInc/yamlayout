import React from 'react'

const hero = (props) => (<><h1 className={`component`}>{`We can use traditional JS syntax to reference props.
${props.children}
`}</h1></>);

export default hero