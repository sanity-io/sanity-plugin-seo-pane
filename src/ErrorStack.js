import React, {useState} from 'react'

export default function ErrorStack({stack}) {
  const [visible, setVisible] = useState(false)

  return !stack ? null : (
    <div>
      <a
        href="#"
        onClick={setVisible.bind(null, !visible)}
        style={{display: 'block', fontSize: '75%', marginTop: '1rem'}}
      >
        {visible ? 'Hide' : 'Show'} Stack Trace
      </a>
      {visible && <pre style={{fontSize: '75%'}}>{stack}</pre>}
    </div>
  )
}
