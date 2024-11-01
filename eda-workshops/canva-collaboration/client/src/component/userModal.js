import React from 'react'

function UserModal({setUser}) {
  return (
    <div className='form-wrapper'>
      <form className='auth-form' onSubmit={(e) => {
        e.preventDefault()
        setUser({
            username: e.currentTarget.elements.username.value,
            color: e.currentTarget.elements.color.value
        })
      } }>
        <h1>Enter your details</h1>
        <input id='username' placeholder='enter username' />
        <input id='color' placeholder='enter pen color' />
        <button>Enter</button>
      </form>
    </div>
  )
}

export default UserModal
