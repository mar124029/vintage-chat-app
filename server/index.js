const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Redis = require("redis");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Redis client setup
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

redisClient.connect();

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// --- Funciones auxiliares para usuarios en Redis ---
async function saveUser(user) {
  await redisClient.hSet("users", user.id, JSON.stringify(user));
}
async function findUserByEmail(email) {
  const users = await redisClient.hGetAll("users");
  return Object.values(users)
    .map((u) => JSON.parse(u))
    .find((u) => u.email === email);
}
async function findUserByUsername(username) {
  const users = await redisClient.hGetAll("users");
  return Object.values(users)
    .map((u) => JSON.parse(u))
    .find((u) => u.username === username);
}
async function findUserById(id) {
  const userStr = await redisClient.hGet("users", id);
  return userStr ? JSON.parse(userStr) : null;
}

// Rutas de autenticación
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email and password are required" });
    }
    const existingByEmail = await findUserByEmail(email);
    const existingByUsername = await findUserByUsername(username);
    if (existingByEmail || existingByUsername) {
      return res.status(409).json({ error: "User already exists" });
    }
    // Hashear la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    const newUser = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };
    await saveUser(newUser);
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Comparar la contraseña ingresada con el hash guardado
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/validate", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      valid: true,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(401).json({ error: "Invalid token", valid: false });
  }
});

// Middleware para autenticación de Socket.io
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log("Auth attempt - Token provided:", !!token);

    if (!token) {
      console.log("Auth failed - No token provided");
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    console.log("Auth successful for user:", decoded.username);

    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.email = decoded.email;

    next();
  } catch (err) {
    console.error("Auth failed - Token verification error:", err.message);
    next(new Error("Authentication error"));
  }
});

// Store para usuarios conectados
const connectedUsers = new Map();

// Función para guardar usuario conectado en Redis
async function saveConnectedUser(user) {
  try {
    await redisClient.hSet(
      "connected_users",
      user.id,
      JSON.stringify({
        ...user,
        connectedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error saving connected user:", error);
  }
}

// Función para remover usuario conectado de Redis
async function removeConnectedUser(userId) {
  try {
    await redisClient.hDel("connected_users", userId);
  } catch (error) {
    console.error("Error removing connected user:", error);
  }
}

// Función para cargar usuarios conectados desde Redis
async function loadConnectedUsers() {
  try {
    const connectedUsersData = await redisClient.hGetAll("connected_users");
    const users = [];

    for (const [userId, userStr] of Object.entries(connectedUsersData)) {
      const userData = JSON.parse(userStr);
      // Solo incluir usuarios conectados en las últimas 24 horas
      const connectedAt = new Date(userData.connectedAt);
      const now = new Date();
      if (now - connectedAt < 24 * 60 * 60 * 1000) {
        users.push(userData);
      } else {
        // Remover usuarios antiguos
        await redisClient.hDel("connected_users", userId);
      }
    }

    return users;
  } catch (error) {
    console.error("Error loading connected users:", error);
    return [];
  }
}

// Función para cargar mensajes históricos
async function loadHistoricalMessages(roomId = "general", limit = 50) {
  try {
    const messageKey = `room:${roomId}`;
    const messages = await redisClient.lRange(messageKey, 0, limit - 1);
    return messages.map((msg) => JSON.parse(msg)).reverse(); // Invertir para mostrar más recientes al final
  } catch (error) {
    console.error("Error loading historical messages:", error);
    return [];
  }
}

// Función para cargar mensajes privados históricos
async function loadPrivateMessages(userId1, userId2, limit = 50) {
  try {
    const messageKey = `private:${[userId1, userId2].sort().join(":")}`;
    const messages = await redisClient.lRange(messageKey, 0, limit - 1);
    return messages.map((msg) => JSON.parse(msg)).reverse(); // Invertir para mostrar más recientes al final
  } catch (error) {
    console.error("Error loading private messages:", error);
    return [];
  }
}

io.on("connection", async (socket) => {
  console.log(`User ${socket.username} connected`);

  // Agregar usuario a la lista de conectados
  const user = {
    id: socket.userId,
    username: socket.username,
    email: socket.email,
    isOnline: true,
    lastSeen: new Date(),
  };

  connectedUsers.set(socket.userId, { ...user, socketId: socket.id });

  // Guardar usuario conectado en Redis
  await saveConnectedUser(user);

  // Notificar a todos los usuarios sobre el nuevo usuario conectado
  socket.broadcast.emit("user-joined", user);

  // Enviar lista de usuarios online al usuario recién conectado
  const onlineUsers = Array.from(connectedUsers.values()).map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    isOnline: u.isOnline,
    lastSeen: u.lastSeen,
  }));

  socket.emit("users-online", onlineUsers);

  // Unirse a sala general por defecto
  socket.join("general");

  // Cargar y enviar mensajes históricos de la sala general
  const historicalMessages = await loadHistoricalMessages("general");
  socket.emit("historical-messages", historicalMessages);

  // Manejar mensajes
  socket.on("send-message", async (messageData) => {
    console.log("Message received from client:", messageData);

    const message = {
      id: Date.now().toString(),
      content: messageData.content,
      senderId: socket.userId,
      senderUsername: socket.username,
      roomId: messageData.roomId,
      recipientId: messageData.recipientId,
      timestamp: new Date(),
      type: messageData.type,
    };

    console.log("Processed message:", message);

    // Guardar mensaje en Redis
    const messageKey =
      messageData.type === "private"
        ? `private:${[socket.userId, messageData.recipientId].sort().join(":")}`
        : `room:${messageData.roomId || "general"}`;

    console.log("Saving message to Redis with key:", messageKey);

    await redisClient.lPush(messageKey, JSON.stringify(message));
    await redisClient.lTrim(messageKey, 0, 99); // Mantener solo los últimos 100 mensajes

    if (messageData.type === "private" && messageData.recipientId) {
      // Enviar mensaje privado
      const recipientUser = connectedUsers.get(messageData.recipientId);
      if (recipientUser) {
        console.log("Sending private message to:", recipientUser.username);
        io.to(recipientUser.socketId).emit("message-received", message);
      }
      // También enviar al remitente
      socket.emit("message-received", message);
    } else {
      // Enviar mensaje a la sala
      console.log("Sending message to room:", messageData.roomId || "general");
      io.to(messageData.roomId || "general").emit("message-received", message);
    }
  });

  // Manejar unirse a sala
  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.username} joined room ${roomId}`);

    // Cargar mensajes históricos de la nueva sala
    const historicalMessages = await loadHistoricalMessages(roomId);
    socket.emit("historical-messages", historicalMessages);
  });

  // Manejar salir de sala
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.username} left room ${roomId}`);
  });

  // Manejar solicitud de mensajes privados
  socket.on("load-private-messages", async (otherUserId) => {
    console.log(
      `Loading private messages between ${socket.username} and user ${otherUserId}`
    );
    const privateMessages = await loadPrivateMessages(
      socket.userId,
      otherUserId
    );
    socket.emit("private-messages-loaded", {
      userId: otherUserId,
      messages: privateMessages,
    });
  });

  // Manejar typing indicators
  socket.on("typing", (data) => {
    if (data.recipientId) {
      const recipientUser = connectedUsers.get(data.recipientId);
      if (recipientUser) {
        io.to(recipientUser.socketId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
        });
      }
    } else if (data.roomId) {
      socket.to(data.roomId).emit("user-typing", {
        userId: socket.userId,
        username: socket.username,
      });
    }
  });

  socket.on("stop-typing", (data) => {
    if (data.recipientId) {
      const recipientUser = connectedUsers.get(data.recipientId);
      if (recipientUser) {
        io.to(recipientUser.socketId).emit(
          "user-stopped-typing",
          socket.userId
        );
      }
    } else if (data.roomId) {
      socket.to(data.roomId).emit("user-stopped-typing", socket.userId);
    }
  });

  // Manejar desconexión
  socket.on("disconnect", async () => {
    console.log(`User ${socket.username} disconnected`);
    connectedUsers.delete(socket.userId);

    // Remover usuario conectado de Redis
    await removeConnectedUser(socket.userId);

    socket.broadcast.emit("user-left", socket.userId);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});
