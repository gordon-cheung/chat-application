const randomGenerator = require('./random.generator');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

users = {}
msgHistory = []

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  onConnection(socket)

  socket.on('cookie', function(cookie) {
    initUser(cookie, socket);
  });

  socket.on('disconnect', function() {
    onDisconnection(socket.id)
  });

  socket.on('chat message', function(msg) {
    sendMessage(socket.id, msg)
  });

  socket.on('command message', function(msg) {
    if (msg.startsWith("/nick ")) {
      changeNickname(msg, socket);
    } else if (msg.startsWith("/nickcolor ")) {
      changeNicknameColor(msg, socket)
    }
    else {
      // TODO socket emit invalid message
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function onConnection(socket) {
  console.log("A user is connected");
  socket.emit('connection');
}

function initUser(cookie, socket) {
  var nickname = (typeof cookie.username !== "undefined" && isUserUnique(cookie.username)) ? cookie.username : getNewNickname()
  var hexColor = (typeof cookie.username !== "undefined" && isUserUnique(cookie.username)) ? cookie.color : getHexColor()
  var userInfo = {username: nickname, color: hexColor }
  socket.emit('init', { userInfo: userInfo, history: msgHistory, onlineUsers: Object.values(users)})
  users[socket.id] = userInfo
  var message = {
    timestamp: getTimestamp(),
    user: nickname,
    color: hexColor,
    message: " has joined the chat room",
    isSystemMessage: true
  }
  msgHistory.push(message)
  console.log(nickname + " is connected");
  io.emit('connected user', message)
}

function onDisconnection(socketId) {
  var nickname = getNickname(socketId)
  console.log(nickname + " user disconnected")
  var message = {
    timestamp: getTimestamp(),
    user: nickname,
    color: getColor(socketId),
    message: " has left the chat room",
    isSystemMessage: true
  }
  msgHistory.push(message)
  delete users[socketId]
  io.emit('disconnected user', message)
}

function sendMessage(socketId, msg) {
  var message = {
    timestamp: getTimestamp(),
    user: getNickname(socketId),
    color: getColor(socketId),
    message: msg,
    isSystemMessage: false
  }
  msgHistory.push(message)
  io.emit('chat message', message)
}

function changeNickname(msg, socket) {
  var newNickname = msg.substring("/nick ".length);
  var oldNickname = getNickname(socket.id)

  if (isUserUnique(newNickname)) {
    setNickname(socket.id, newNickname)
    console.log(oldNickname + " changed their nickname to " + newNickname);
    var nicknameMessage = {
      oldNickname: oldNickname,
      newNickname: newNickname,
      valid: true,
      message: {
        timestamp: getTimestamp(),
        user: oldNickname,
        color: getColor(socket.id),
        message: " has changed their nickname to <p style=\"color: " + getColor(socket.id) + "\">" + newNickname + "</p>",
        isSystemMessage: true
      }
    }
    msgHistory.push(nicknameMessage.message)
    io.emit('nickname changed', nicknameMessage);
    socket.emit('command nickname', nicknameMessage);
  }
  else {
    var nicknameMessage = {
      oldNickname: oldNickname,
      newNickname: newNickname,
      valid: false,
      message: {
        timestamp: getTimestamp(),
        user: oldNickname,
        color: getColor(socket.id),
        message: newNickname + " is already taken. Please use a unique nickname.",
        isSystemMessage: true
      }
    }
    console.log(oldNickname + " failed to change their nickname to " + newNickname);
    socket.emit('command nickname', nicknameMessage)
  }
}

function changeNicknameColor(msg, socket) {
  var user = getNickname(socket.id)
  var color = "#" + msg.substring("/nickcolor ".length);

  var isValid = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);
  if (isValid) {
    console.log(user + " changing nickcolor to " + color)
    var nicknameColorMessage = {
      color: color,
      valid: true,
      message: {
        timestamp: getTimestamp(),
        user: user,
        color: color,
        message: "Changed nickname color to " + color,
        isSystemMessage: true
      }
    }
    setColor(socket.id, color)
    socket.emit('command nickcolor', nicknameColorMessage)
    io.emit('nickcolor changed', nicknameColorMessage)
  } else {
    console.log(user + " failed to change nickcolor to " + color)
    var nicknameColorMessage = {
      color: color,
      valid: false,
      message: {
        timestamp: getTimestamp(),
        user: user,
        color: getColor(socket.id),
        message: "Failed to change nickname color to " + color + ". Format must be \"/nickcolor RRGGBB\"",
        isSystemMessage: true
      }
    }
    socket.emit('command nickcolor', nicknameColorMessage)
  }
}

// Helper Functions //

function getNewNickname() {
  while(true) {
    var nickname = randomGenerator.generateName()
    if (isUserUnique(nickname)) {
      return nickname;
    }
  }
}

function getHexColor() {
  return randomGenerator.generateHexColor();
}

function isUserUnique(nickname)  {
  var userList = Object.values(users).map(i => i.username)
  if (!userList.includes(nickname)) {
    return true
  } else {
    return false
  }
}

function getTimestamp() {
  return new Date().getTime()
}

function getColor(socketId)  {
  return users[socketId].color;
}

function setColor(socketId, color) {
  users[socketId].color = color;
}

function setNickname(socketId, username) {
  users[socketId].username = username;
}

function getNickname(socketId) {
  return users[socketId].username
}
