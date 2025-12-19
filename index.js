require('dotenv').config();  // Load environment variables first

const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "*", // change to frontend domain in production
    },
});

const clients = {}; // store socket objects by ID

// // Use Socket.IO auth middleware from a separate file
// io.use(socketAuth);

// Socket.io
io.on("connection", (socket) => {

    console.log("new connection", socket.id);

    // Save socket reference
    clients[socket.id] = socket;

    // -------------------------
    // JOIN ROOM
    // -------------------------
    socket.on("join-room", ({comment_id}) => {
        socket.join(comment_id);
        console.log(`${socket.id} joined room: ${comment_id}`);

        io.to(comment_id).emit("room-notification", {
            user: socket.id,
            message: `${socket.id} joined room ${comment_id}`
        });
    });

    // -------------------------
    // LEAVE ROOM
    // -------------------------
    socket.on("leave-room", ({comment_id}) => {
        socket.leave(comment_id);
        
        io.to(comment_id).emit("room-notification", {
            user: socket.id,
            message: `${socket.id} left room ${comment_id}`
        });

        console.log(`${socket.id} left room: ${comment_id}`);
    });

    // -------------------------
    // SEND MESSAGE TO ROOM
    // -------------------------
    socket.on("message", ({ comment_id, message }) => {
        console.log(`Message to room ${comment_id}:`, message);

        io.to(comment_id).emit("message", message);
    });

    // -------------------------
    // disconnect a particular client
    // -------------------------
    socket.on("disconnectSocket", () => {
        if (clients[socket.id]) {
            clients[socket.id].disconnect(true);
            delete clients[socket.id];
            console.log("disconnected:", socket.id);
        } else {
            console.log("Client not found:", socket.id);
        }
    });

});

app.get("/", (req, res) => {
    return res.send("hello world");
});

server.listen(process.env.PORT || 9000, () => console.log(`Server Started at PORT:${process.env.PORT || 9000}`));
