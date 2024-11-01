import { useEffect, useState } from 'react';
import { MyContext } from './context';
import './App.css';
import CanvaBoard from './component/canvaBoard';
import Chat from './component/chat';
import UserModal from './component/userModal';

function App() {
  // State variables to manage websocket connection, user info, and incoming messages
  const [websocket, setWebsocket] = useState(null);
  const [user, setUser] = useState(null);
  const [chatMsg, setChatMsg] = useState(null);
  const [drawingMsg, setDrawingMsg] = useState(null);

  useEffect(() => {
    // Establish a WebSocket connection when the user is set
    if(user){
      // Creates a WebSocket connection with the user’s info in query parameters
      const ws = new WebSocket(`ws://localhost:8787/?username=${user.username}&color=${user.color}`);

      // Check if WebSocket was created successfully
      if(ws && ws !== undefined){
        ws.onmessage = (msg) => {
          // Parse the incoming message
          const message = JSON.parse(msg.data);
          if(message.type === 'error'){
            // Handle error: reset user state and show an alert with the error message
            setUser(null);
            alert(message.text)
          } else {
            // Set websocket instance in state if message type is not 'error'
            setWebsocket(ws);
            alert(JSON.stringify(message));
          }
        }
      }

      // Cleanup function to close WebSocket connection when component unmounts
      return () => {
        ws.close();
      };
    }
  },[user]); // Run effect when `user` state changes

  useEffect(() => {
    // Update message handlers if websocket is set
    if(websocket){
      websocket.onmessage = (e) => {
        // Parse the incoming WebSocket message
        const msg = JSON.parse(e.data);
        const msgType = msg.type;
        // Handle different types of incoming messages (chat and drawing)
        switch (msgType) {
          case 'chat':
            setChatMsg(msg); // Store chat messages in `chatMsg` state
            break;
          case 'drawing':
            setDrawingMsg(msg); // Store drawing messages in `drawingMsg` state
            break;
          default:
            break;
        }
      }
    }
  },[websocket]); // Run effect when `websocket` state changes

  // Render the user modal if no user is set; otherwise, render the app components
  if(!user){
    return <UserModal setUser={setUser} />
  }

  return (
    <div className="App">
      {/* Provide context to components needing websocket, user, and messages */}
      <MyContext.Provider value={{ websocket, user, chatMsg, drawingMsg }}>
        <CanvaBoard />
        <Chat />
      </MyContext.Provider>
    </div>
  );
}

export default App;
