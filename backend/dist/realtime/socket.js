"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketIO = initSocketIO;
exports.getIO = getIO;
exports.emitToUser = emitToUser;
exports.broadcastAll = broadcastAll;
const socket_io_1 = require("socket.io");
let io = null;
function initSocketIO(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        pingInterval: 10000,
        pingTimeout: 5000,
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        // Permitir conexión y verificar userId si se provee
        const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
        if (userId) {
            socket.data.userId = userId;
        }
        next();
    });
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`🔌 Dispositivo conectado en tiempo real para usuario: ${userId} (Socket ID: ${socket.id})`);
        }
        else {
            console.log(`🔌 Dispositivo conectado como anónimo (Socket ID: ${socket.id})`);
        }
        socket.on('join_user_room', (targetUserId) => {
            socket.join(`user_${targetUserId}`);
            socket.data.userId = targetUserId;
            console.log(`🔗 Socket ${socket.id} se unió a la sala user_${targetUserId}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Dispositivo desconectado: ${socket.id}`);
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.io no ha sido inicializado.');
    }
    return io;
}
function emitToUser(userId, event, payload) {
    if (!io)
        return;
    io.to(`user_${userId}`).emit(event, payload);
    console.log(`📡 Evento realtime emitido [${event}] a usuario: ${userId}`);
}
function broadcastAll(event, payload) {
    if (!io)
        return;
    io.emit(event, payload);
}
