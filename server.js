
const path = require('path');
const http = require('http');
const express = require('express');
const app     = express();
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');

// const express = require('express');
// const app     = express();
// const server  = app.listen(3000);

// const io      = require('socket.io').listen(server);

// const path    = require('path');
// const http    = require('http');

// app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));

app.get('/rejoindrePartie',function(req,res){
  res.sendFile(__dirname + "/public/index.html");
});

app.get('/creerPartie',function(req,res){
  res.sendFile(__dirname + "/public/creerPartie.html");
  console.log('ok server');
  var btnRej = document.getElementById('btnRejoindre');
  console.log(btnRej);
});

// Partie socket pour gerer le chat et les messages :

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
const { type } = require('os');

const server = http.createServer(app);
const io = socketio(server);

const botName = 'Racing Maze BOOT';

// Run when client connects
io.on('connection', socket => {
  // nomPartie = nomPartie.value;
  socket.emit('creerPartie', ({nomPartie}) => {
    console.log(nomPartie);
  });
  socket.on('joindrePartiePublique', ({ username, room }) => {
    
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Bonjour!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} est là !`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),    
   });
  });
  
  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} est partie !`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
