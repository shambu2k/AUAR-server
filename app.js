const socketio = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const PORT = 2001 || process.env.PORT;

const server = app.listen(PORT, () => {
  console.log("Server is running on port number :" + PORT);
});

const io = socketio.listen(server);

let activeRooms = [];

io.on("connection", function (socket) {
  let playerName = "";
  let roomId = "";

  console.log(`Connection : SocketId = ${socket.id}`);
  socket.on("create_room", (data) => {
    console.log(JSON.stringify(data));
    let room_info = data;
    playerName = room_info.playerName;
    roomId = room_info.roomId;

    const activeRoom = { host: playerName, roomId: roomId };

    activeRooms.push(activeRoom);

    socket.join(roomId);
    console.log(playerName + " created and joined " + roomId);
    io.in(roomId).emit(
      "player_joined",
      playerName + " created and joined " + roomId
    );
    io.in(roomId).emit("num_players", io.sockets.adapter.rooms[roomId].length);
  });

  socket.on("join_room", (data) => {
    const room_info = data;
    playerName = room_info.playerName;
    roomId = room_info.roomId;

    if (activeRooms.some((room) => room.roomId === roomId)) {
      socket.join(roomId);
      console.log(playerName + " joined " + roomId);
      io.in(roomId).emit("player_joined", playerName + " joined " + roomId);
      io.in(roomId).emit(
        "num_players",
        io.sockets.adapter.rooms[roomId].length
      );
    } else {
      console.log("Room does not exist");
      socket.emit("room_error", "This room does not exist");
    }
  });

  socket.on("leave_room", (data) => {
    const room_info = data;
    playerName = room_info.playerName;
    roomId = room_info.roomId;

    console.log(playerName + " left the room");
    socket.to(roomId).emit("player_left", playerName + " left the room");
    io.in(roomId).emit("num_players", io.sockets.adapter.rooms[roomId].length);
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    socket.leave(roomId)
    io.in(roomId).emit("num_players", io.sockets.adapter.rooms[roomId].length);
    console.log(socket.id + " disconnected");
  });
});
