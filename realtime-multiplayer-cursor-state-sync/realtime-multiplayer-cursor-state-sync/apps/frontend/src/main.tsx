import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {io,Socket} from "socket.io-client";
import type {SharedState,User} from "@realtime/shared";
import "./styles.css";

const API=import.meta.env.VITE_API_URL??"http://localhost:4000";
type Cursor=User & {x:number;y:number};
const socket:Socket=io(API,{autoConnect:false});

function App(){
 const [joined,setJoined]=useState(false),[name,setName]=useState("User"),[roomId,setRoomId]=useState("demo-room");
 const [users,setUsers]=useState<User[]>([]),[cursors,setCursors]=useState<Record<string,Cursor>>({});
 const [state,setState]=useState<SharedState>({counter:0,selectedColor:"#2563eb",activeTool:"select"});
 const [version,setVersion]=useState(0),[connected,setConnected]=useState(false);
 const canvas=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  socket.on("connect",()=>setConnected(true)); socket.on("disconnect",()=>setConnected(false));
  socket.on("room_state",p=>{setState(p.state);setVersion(p.version);setUsers(p.users);});
  socket.on("user_joined",u=>setUsers(x=>[...x,u]));
  socket.on("user_left",({userId})=>{setUsers(x=>x.filter(u=>u.id!==userId));setCursors(x=>{const n={...x};delete n[userId];return n;})});
  socket.on("cursor_update",p=>setCursors(x=>({...x,[p.userId]:{...(x[p.userId]??{id:p.userId,name:"User",color:"#000"}),...p}})));
  socket.on("state_updated",p=>{setState(p.state);setVersion(p.version)});
  socket.on("error_message",p=>alert(p.message));
  return()=>{socket.removeAllListeners()};
 },[]);
 function join(){socket.connect();socket.emit("join_room",{roomId,name});setJoined(true)}
 function move(e:React.MouseEvent){const r=canvas.current?.getBoundingClientRect();if(!r)return;socket.emit("cursor_move",{x:e.clientX-r.left,y:e.clientY-r.top})}
 function update(changes:Partial<SharedState>){socket.emit("state_update",{changes,version})}
 if(!joined)return <main className="landing"><section><h1>Real-Time Collaboration</h1><p>Multiplayer cursors and shared state synchronization.</p><input value={name} onChange={e=>setName(e.target.value)} placeholder="Display name"/><input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID"/><button onClick={join}>Join room</button></section></main>;
 return <main className="app"><header><div><b>Room: {roomId}</b><span className={connected?"online":"offline"}>● {connected?"Connected":"Disconnected"}</span></div><span>State v{version}</span></header>
 <div className="layout"><aside><h3>Online users ({users.length})</h3>{users.map(u=><div className="user" key={u.id}><i style={{background:u.color}}/> {u.name}</div>)}<hr/><h3>Shared state</h3><div className="counter"><button onClick={()=>update({counter:state.counter-1})}>−</button><strong>{state.counter}</strong><button onClick={()=>update({counter:state.counter+1})}>+</button></div><label>Tool<select value={state.activeTool} onChange={e=>update({activeTool:e.target.value as SharedState["activeTool"]})}><option>select</option><option>draw</option><option>erase</option></select></label></aside>
 <div className="canvas" ref={canvas} onMouseMove={move}><div className="hint">Move your cursor here — other users see it live.</div>{Object.values(cursors).map(c=><div className="cursor" key={c.id} style={{transform:`translate(${c.x}px,${c.y}px)`,color:c.color}}>↖<span>{c.name}</span></div>)}</div></div></main>
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
