const { Server } = require("socket.io");

const io = new Server(process.env.PORT || 8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  socket.on("room:join", (data) => {
    const { email, room } = data;
    console.log(`User ${email} joined room ${room}`);

    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    io.to(room).emit("user:joined", { email, id: socket.id });

    socket.join(room);

    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    console.log(`User ${socketIdToEmailMap.get(socket.id)} is calling ${to}`);
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    console.log(`User ${socketIdToEmailMap.get(socket.id)} accepted call`);
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log(
      `User ${socketIdToEmailMap.get(socket.id)} is negotiating with ${to}`,
    );
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log(
      `User ${socketIdToEmailMap.get(socket.id)} done negotiating with ${to}`,
    );
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("user:exit", ({ to }) => {
    console.log(`User ${socketIdToEmailMap.get(socket.id)} exited room ${to}`);
    io.to(to).emit("user:exit");
    socket.leave(to);
  });
});
