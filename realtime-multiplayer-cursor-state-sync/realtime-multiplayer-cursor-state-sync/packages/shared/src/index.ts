export type SharedState = {
  counter: number;
  selectedColor: string;
  activeTool: "select" | "draw" | "erase";
};

export type User = {
  id: string;
  name: string;
  color: string;
};

export type CursorPosition = { x: number; y: number };

export type ClientToServerEvents = {
  join_room: (payload: { roomId: string; name: string }) => void;
  cursor_move: (payload: CursorPosition) => void;
  state_update: (payload: { changes: Partial<SharedState>; version: number }) => void;
};

export type ServerToClientEvents = {
  room_state: (payload: { state: SharedState; version: number; users: User[] }) => void;
  cursor_update: (payload: { userId: string; x: number; y: number }) => void;
  user_joined: (user: User) => void;
  user_left: (payload: { userId: string }) => void;
  state_updated: (payload: { state: SharedState; version: number }) => void;
  error_message: (payload: { code: string; message: string }) => void;
};
