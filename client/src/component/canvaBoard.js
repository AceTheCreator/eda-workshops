import React, { useRef, useEffect, useState, useContext } from 'react';
import { MyContext } from '../context';

const CanvaBoard = () => {
    // Reference to the canvas element
    const canvasRef = useRef(null);
    
    // Access WebSocket connection, user data, and drawing messages from context
    const { websocket, user, drawingMsg } = useContext(MyContext);
    
    // State to track if the user is currently drawing on the canvas
    const [drawing, setDrawing] = useState(false);
    
    // Effect to handle incoming drawing messages and render them on the canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // If a drawing message is received, draw it on the canvas
        if (drawingMsg) {
            const { positionX, positionY, color } = drawingMsg;
            drawOnCanvas(context, positionX, positionY, false, color); // Draw the incoming position with specified color
        }
    }, [drawingMsg]); // Dependency array includes `drawingMsg` so it triggers on update

    // Function to handle drawing on the canvas
    const drawOnCanvas = (context, x, y, local, color) => {
        context.beginPath(); // Begin a new path
        context.lineWidth = 10; // Set line width for the drawing
        context.lineCap = 'round'; // Use rounded line ends for smooth dots
        
        // Move to the specified coordinates and draw a dot there
        context.moveTo(x, y);
        context.lineTo(x, y);
        context.stroke();
        
        // Set color based on whether the draw action is local or received
        context.strokeStyle = local ? 'black' : color;
    };

    // Function to start drawing on mouse down event
    const startDrawing = (e) => {
        setDrawing(true); // Enable drawing mode
        const rect = canvasRef.current.getBoundingClientRect(); // Get canvas bounds
        
        // Calculate cursor position relative to the canvas
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Draw initial dot and send drawing data
        drawOnCanvas(canvasRef.current.getContext('2d'), x, y, true);
        sendDrawingData(x, y);
    };

    // Function to stop drawing on mouse up event
    const stopDrawing = () => {
        setDrawing(false); // Disable drawing mode
        const context = canvasRef.current.getContext('2d');
        context.beginPath(); // Begin a new path for the next drawing action
    };

    // Function to draw continuously as the mouse moves
    const draw = (e) => {
        if (!drawing) return; // Exit if drawing mode is not enabled

        // Calculate cursor position relative to the canvas
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Draw and send drawing data for each move
        drawOnCanvas(canvasRef.current.getContext('2d'), x, y, true);
        sendDrawingData(x, y);
    };

    // Function to send drawing data through the WebSocket
    const sendDrawingData = (x, y) => {
        // Ensure WebSocket is open before sending data
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({
                "type": "drawing",
                "positionX": x,
                "positionY": y,
                "color": user.color // Send user color along with coordinates
            }));
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={1000} // Set canvas width
            height={800} // Set canvas height
            onMouseDown={startDrawing} // Start drawing on mouse down
            onMouseUp={stopDrawing} // Stop drawing on mouse up
            onMouseMove={draw} // Draw as mouse moves
            className='canva-container'
        />
    );
};

export default CanvaBoard;
