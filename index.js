const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoConnect = require("./config/db.js");
const path = require("path");
const { errorResponserHandler } = require("./middleware/errorHandler");
const http = require("http");
const { Server } = require("socket.io");

//routes
const userRoutes = require("./routes/userRoutes.js");
const playerRoutes = require("./routes/playerRoutes.js");
const squadRoutes = require("./routes/squadRoute.js");
const matchRoutes = require("./routes/matchRoutes.js");

dotenv.config();
mongoConnect();
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Replace '*' with your client URL for production
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});
app.use("/api/users", userRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/squad", squadRoutes);
app.use("/api/match", matchRoutes);

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(errorResponserHandler);

io.on("connection", (socket) => {
  // Listen for events from the client
  socket.on("updateScore", (data) => {
    io.emit("scoreUpdated", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 51111;
server.listen(PORT, () => console.log(`server is running on port ${PORT}`));
