import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import {Parser, fromFile} from '@asyncapi/parser';
import AsyncApiValidator from 'asyncapi-validator';
import Ajv from 'ajv';

// Initialize JSON Schema validator
const ajv = new Ajv();
// Initialize AsyncAPI parser for API documentation
const parser = new Parser();

// Parse the AsyncAPI specification file
// This file defines the WebSocket API contract including message formats and channels
const {document} = await fromFile(parser,'./asyncapi.yaml').parse();


/**
 * Validates a payload against a JSON schema
 * @param {Object} schema - The JSON schema to validate against
 * @param {Object} payload - The data to validate
 * @returns {boolean} - Returns true if payload matches schema, false otherwise
 */
const validatePayload = (schema, payload) => {
    const validate = ajv.compile(schema);
    const isValid = validate(payload);
    return isValid;
}

/**
 * Finds a channel by its address/path in the AsyncAPI specification
 * @param {string} path - The WebSocket path/address to lookup
 * @returns {string|undefined} - Returns the channel ID if found
 */
const getChannelByAddress = (path) => {
    const channels = document.channels().all();
    for (let index = 0; index < channels.length; index++) {
        if(channels[index].address() === path){
            return (channels[index].id())
        }        
    }
}

// Initialize AsyncAPI validator for message validation
// The msgIdentifier option specifies which field uniquely identifies message types
let va = await AsyncApiValidator.fromSource('./asyncapi.yaml',{msgIdentifier: 'x-unique-id'})


/**
 * WebsocketManager class handles all WebSocket connections and messaging
 * Responsibilities include:
 * - Managing active connections
 * - Preventing duplicate usernames/colors
 * - Broadcasting messages to connected clients
 */
class WebsocketManager{
    constructor(){
        // Map to store active WebSocket connections
        // Key: WebSocket instance
        // Value: User information (username, color)
        this.connections = new Map();
    }

    /**
     * Adds a new WebSocket connection after validating user information
     * Prevents duplicate usernames and color codes
     * @param {WebSocket} socket - The WebSocket connection
     * @param {Object} user - User information containing username and color
     */
    addConnections(socket, user){
        const {username, color} = user;
        if(this.connections.size > 0){
            // Iterate through existing connections to check for duplicates
            for (const connection of this.connections.values()) {
                if(connection.color.toLowerCase() === color.toLowerCase()){
                    socket.send(JSON.stringify({
                        type: 'error',
                        text: 'user with this color already exists',
                        timestamp: new Date().toISOString()
                    }));
                    return socket.close()
                }
                else if (connection.username.toLowerCase() === username.toLowerCase()) {
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: 'user with this name already exists',
                        timestamp: new Date().toISOString()
                    }));
                    return socket.close()
                }
              }
        }
        // Store new connection and send confirmation
        this.connections.set(socket, user);
        const msg = {
            num_connections: this.connections.size,
            status: 1
        }
        socket.send(JSON.stringify(msg))
    }

    /**
     * Removes a WebSocket connection when client disconnects
     * @param {WebSocket} socket - The WebSocket connection to remove
     */
    removeConnection(socket){
        this.connections.delete(socket);
    }
    
    /**
     * Broadcasts a message to all connected clients except the sender
     * @param {Object} message - The message to broadcast
     * @param {WebSocket} eSocket - The sender's socket to exclude from broadcast
     */
    broadcast(message, eSocket){
        this.connections.forEach((_, socket) => {
            if(socket !== eSocket && socket.readyState === WebSocket.OPEN){
                socket.send(JSON.stringify(message))
            }
        })
    }
};

/**
 * Creates a message validation hook for WebSocket connections
 * Ensures all messages conform to the AsyncAPI specification
 * @param {WebSocket} socket - The WebSocket connection to validate messages for
 * @returns {Function} - Validation function that checks messages against AsyncAPI spec
 */
const wsValidateHook = (socket) => {
    return async (message, request) => {
        try {
            // Extract channel from URL and validate message format
            const pathname = request.url;
            const channel = getChannelByAddress(pathname.split('?')[0])
            va.validate('chat', message, channel, 'send');
            return true
        } catch (error) {
          socket.send(JSON.stringify({
            type: "error", 
            text: error.message,
            timestamp: new Date().toISOString()
          }))
          return false;
        }
    }
}


// Initialize Fastify server without logging
const fastify = Fastify({
    logger: false
})

// Add WebSocket support to Fastify
await fastify.register(websocket)

// Create WebSocket connection manager instance
const wsManager = new WebsocketManager();

// Define WebSocket route configuration
fastify.route({
    method: 'GET',
    url: '/',
    websocket: true,
    // Validate connection parameters before accepting WebSocket upgrade
    preValidation: async (req, rep) => {
        const wsBinding = document.channels().get('root').bindings().get('ws').value();
        const valid = validatePayload(wsBinding.query, req.query);
        if (!valid) {
            await reply.code(401).send("not authenticated");
        }
    },
    // Handle WebSocket connection lifecycle
    handler: (socket, request) => {
        const userInfo = request.query;
        wsManager.addConnections(socket, userInfo)
        const messageValidator = wsValidateHook(socket);
        
        // Handle incoming messages
        socket.on('message', async(payload) => {
           const message = Buffer.from(payload, 'base64').toString('utf-8');
           try {
            const isValid = await messageValidator(JSON.parse(message), request);
            if(isValid){
                wsManager.broadcast(JSON.parse(message), socket)
            }
           } catch (error) {
            console.error('Unexpected error:', error);
           socket.send(JSON.stringify({
            type: "error", 
            text: 'Internal Server Error',
            timestamp: new Date().toISOString()
          }))
           }
        });

        // Handle client disconnection
        socket.on('close', () => {
        wsManager.removeConnection(socket);
      });
    }
})

// Start the server on port 8787
fastify.listen({ port: 8787 }, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})