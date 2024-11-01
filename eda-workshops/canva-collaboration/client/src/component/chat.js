import React, { useContext, useEffect, useState } from 'react';
import { MyContext } from '../context';

const Chat = () => {
  // Access `websocket` and `chatMsg` values from the context
  const { websocket, chatMsg } = useContext(MyContext);
  const [chats, setChats] = useState([]); // State to hold the chat messages

  useEffect(() => {
    // Trigger this effect when `chatMsg` updates
    if(chatMsg){
      // Add the incoming chat message to the `chats` state with `incoming` flag set to true
      setChats([...chats, { ...chatMsg, incoming: true }]);
    }
  }, [chatMsg]); // Dependency array includes `chatMsg`

  // Function to handle sending messages
  const onSend = (e) => {
    e.preventDefault(); // Prevent form submission from reloading the page
    const text = e.currentTarget.elements.text.value; // Access the text input

    // Send the message if text exists, the WebSocket connection is open
    if(text && websocket && websocket.readyState === WebSocket.OPEN){
      const msgPayload = {
        type: "chat",
        text,
        timestamp: new Date().toISOString() // Timestamp for message
      };

      // Send the message payload via WebSocket
      websocket.send(JSON.stringify(msgPayload));

      // Add the sent message to the `chats` state
      setChats([...chats, msgPayload ]);

      // Clear the text input field after sending
      e.currentTarget.elements.text.value = "";
    }
  };

  return (
    <div className='chat-wrapper'>
      <div class="chat-container">
        <div class="chat-header">Chat Room</div>
        
        {/* Display each chat message */}
        <div class="chat-messages">
          {chats.map((chat) => {
            return (
              <div key={chat.timestamp} className={chat.incoming ? 'message received' : 'message sent'}>
                <div className='message-content'>{chat.text}</div>
              </div>
            );
          })}
        </div>

        {/* Input field and button to send new messages */}
        <form class="chat-input" onSubmit={onSend}>
          <input id='text' type="text" placeholder="Type a message..." />
          <button>Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
