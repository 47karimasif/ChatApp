const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
//static folder
app.use(express.static(path.join(__dirname, "public")));

const Chatbot = "Chatbot";

//run when client connect
io.on("connection", socket => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //welcome current user
    socket.emit(
      "message",
      formatMessage(Chatbot, `${user.username} welcome to Quarantine-Chat`)
    );
    //broadcast when user connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(Chatbot, `${user.username} has joined the chat`)
      );

    //send user and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  //listen for chat message
  socket.on("chatMessage", msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //broadcast when user diconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(Chatbot, `${user.username} has left the chat`)
      );
      //send user and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const port = 8000 || process.env.PORT;

server.listen(port, () => console.log(`server ruuning on port ${port}`));

// io is used to emit to everybody
// on works for receiving messages
// emit for sending messages
