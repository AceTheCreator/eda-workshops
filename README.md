
# Collaborative Drawing App 🎨

A real-time collaborative drawing application that allows multiple users to draw together and chat in real-time. Built with **React** on the client side and **Fastify** on the server side, this project uses **WebSocket** and **AsyncAPI** for seamless, real-time communication.


## Features

- Real-time collaborative drawing with WebSocket
- Text chat alongside the drawing area
- Responsive UI for different screen sizes
- Easy setup and deployment with Fastify and React

## Getting Started

### Prerequisites

- **Node.js** (v14 or above)
- **npm** (or **yarn**)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/collaborative-drawing-app.git
   cd collaborative-drawing-app
   ```

2. **Install dependencies for both client and server:**

   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

### Running the Application

#### 1. Start the Backend Server

In the `server` directory, start the Fastify server:

```bash
npm run start
```

This will start the websocket server at `http://localhost:8787`.

#### 2. Start the Frontend Client

In the `client` directory, start the React development server:

```bash
npm run start
```

This will start the frontend app at `http://localhost:3000`.
