import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import { z } from "zod";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

type State = { counter: number; selectedColor: string; activeTool: "select"|"draw"|"erase" };
type RoomUser = { id: string; name: string; color: string };

const state: State = { counter: 0, selectedColor: "#2563eb", activeTool: "select" };
const rooms = new Map<string, { users: Map<string, RoomUser>; state: State; version: number }>();

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.get("/health", (_req,res)=>res.json({status:"ok"}));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_URL, methods:["GET","POST"] } });

const joinSchema = z.object({roomId:z.string().min(1).max(32).regex(/^[a-zA-Z0-9_-]+$/),name:z.string().min(1).max(40)});
const cursorSchema = z.object({x:z.number().finite(),y:z.number().finite()});
const updateSchema = z.object({
  changes:z.object({counter:z.number().int().optional(),selectedColor:z.string().max(20).optional(),activeTool:z.enum(["select","draw","erase"]).optional()}),
  version:z.number().int().nonnegative()
});

const colors = ["#2563eb","#dc2626","#16a34a","#9333ea","#ea580c","#0891b2","#db2777"];

io.on("connection", socket => {
  socket.on("join_room", raw => {
    const parsed = joinSchema.safeParse(raw);
    if (!parsed.success) return socket.emit("error_message",{code:"INVALID_JOIN",message:"Invalid room or display name."});
    const {roomId,name} = parsed.data;
    let room = rooms.get(roomId);
    if (!room) room = { users:new Map(), state:{...state}, version:0 }, rooms.set(roomId,room);
    const user: RoomUser = {id:randomUUID(),name,color:colors[room.users.size % colors.length]};
    room.users.set(socket.id,user);
    socket.data.roomId=roomId; socket.data.userId=user.id;
    socket.join(roomId);
    socket.emit("room_state",{state:room.state,version:room.version,users:[...room.users.values()]});
    socket.to(roomId).emit("user_joined",user);
  });

  socket.on("cursor_move", raw => {
    const parsed=cursorSchema.safeParse(raw); if(!parsed.success) return;
    const roomId=socket.data.roomId; const userId=socket.data.userId;
    if(roomId && userId) socket.to(roomId).emit("cursor_update",{userId,...parsed.data});
  });

  socket.on("state_update", raw => {
    const parsed=updateSchema.safeParse(raw); if(!parsed.success) return;
    const room=rooms.get(socket.data.roomId); if(!room) return;
    if(parsed.data.version !== room.version) {
      return socket.emit("error_message",{code:"VERSION_CONFLICT",message:`State is outdated. Current version is ${room.version}.`});
    }
    room.state={...room.state,...parsed.data.changes}; room.version++;
    io.to(socket.data.roomId).emit("state_updated",{state:room.state,version:room.version});
  });

  socket.on("disconnect",()=>{
    const roomId=socket.data.roomId; if(!roomId) return;
    const room=rooms.get(roomId); if(!room) return;
    const user=room.users.get(socket.id); room.users.delete(socket.id);
    if(user) socket.to(roomId).emit("user_left",{userId:user.id});
    if(room.users.size===0) rooms.delete(roomId);
  });
});

server.listen(PORT,()=>console.log(`Backend listening on http://localhost:${PORT}`));
