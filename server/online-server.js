const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 2567);
const server = http.createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map();
const sessionIndex = new Map();
const clientMeta = new Map();

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function roomSummary(room) {
  return {
    roomCode: room.code,
    hostId: room.hostId,
    playMode: room.playMode,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      ready: player.ready,
      connected: player.connected,
      teamId: player.teamId,
      isReferee: player.isReferee,
    })),
    config: room.config,
    matchStarted: room.matchStarted,
    rematchVotes: [...room.rematchVotes],
  };
}

function broadcastRoom(room) {
  const payload = { type: 'room_state', room: roomSummary(room) };
  room.players.forEach((player) => {
    if (player.ws) send(player.ws, payload);
  });
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getRoomByClient(ws) {
  const meta = clientMeta.get(ws);
  return meta?.roomCode ? rooms.get(meta.roomCode) : null;
}

function assignHost(room) {
  const connected = room.players.find((player) => player.connected);
  room.hostId = connected ? connected.id : room.hostId;
}

function removeEmptyRoom(room) {
  if (room.players.every((player) => !player.connected)) {
    rooms.delete(room.code);
  }
}

function handleCreateRoom(ws, message) {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const resumeToken = makeId('resume');
  const playerId = makeId('player');
  const room = {
    code,
    hostId: playerId,
    playMode: message.playMode || 'solo',
    players: [{
      id: playerId,
      name: message.playerName || 'Host',
      ready: false,
      connected: true,
      ws,
    }],
    config: {},
    matchStarted: false,
    rematchVotes: [],
  };

  rooms.set(code, room);
  sessionIndex.set(resumeToken, { roomCode: code, playerId });
  clientMeta.set(ws, { roomCode: code, playerId, resumeToken });
  send(ws, { type: 'connected', resumeToken, playerId });
  broadcastRoom(room);
}

function handleJoinRoom(ws, message) {
  const code = String(message.roomCode || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    send(ws, { type: 'error', message: 'Room not found' });
    return;
  }

  const resumeToken = makeId('resume');
  const playerId = makeId('player');
  room.players.push({
    id: playerId,
    name: message.playerName || `Player ${room.players.length + 1}`,
    ready: false,
    connected: true,
    ws,
  });
  sessionIndex.set(resumeToken, { roomCode: code, playerId });
  clientMeta.set(ws, { roomCode: code, playerId, resumeToken });
  send(ws, { type: 'connected', resumeToken, playerId });
  broadcastRoom(room);
}

function handleResume(ws, message) {
  const found = sessionIndex.get(message.resumeToken);
  if (!found) {
    send(ws, { type: 'error', message: 'Saved session expired' });
    return;
  }
  const room = rooms.get(found.roomCode);
  const player = room?.players.find((entry) => entry.id === found.playerId);
  if (!room || !player) {
    send(ws, { type: 'error', message: 'Room no longer exists' });
    return;
  }

  player.connected = true;
  player.ws = ws;
  clientMeta.set(ws, { roomCode: found.roomCode, playerId: found.playerId, resumeToken: message.resumeToken });
  send(ws, { type: 'connected', resumeToken: message.resumeToken, playerId: found.playerId });
  broadcastRoom(room);
}

function handleReady(ws, message) {
  const room = getRoomByClient(ws);
  const meta = clientMeta.get(ws);
  const player = room?.players.find((entry) => entry.id === meta?.playerId);
  if (!room || !player) return;
  player.ready = Boolean(message.ready);
  room.rematchVotes = [];
  broadcastRoom(room);
}

function handleUpdateConfig(ws, message) {
  const room = getRoomByClient(ws);
  const meta = clientMeta.get(ws);
  if (!room || room.hostId !== meta?.playerId) return;
  room.config = { ...room.config, ...(message.config || {}) };
  broadcastRoom(room);
}

function handleStartMatch(ws, message) {
  const room = getRoomByClient(ws);
  const meta = clientMeta.get(ws);
  if (!room || room.hostId !== meta?.playerId) return;
  room.matchStarted = true;
  room.rematchVotes = [];
  room.players.forEach((player) => { player.ready = false; });
  const payload = { type: 'match_started', payload: message.payload };
  room.players.forEach((player) => {
    if (player.ws) send(player.ws, payload);
  });
  broadcastRoom(room);
}

function handleRematch(ws) {
  const room = getRoomByClient(ws);
  const meta = clientMeta.get(ws);
  if (!room || !meta?.playerId) return;
  if (!room.rematchVotes.includes(meta.playerId)) room.rematchVotes.push(meta.playerId);
  const activePlayers = room.players.filter((player) => !player.isReferee);
  if (room.rematchVotes.length >= Math.max(2, activePlayers.length)) {
    room.matchStarted = false;
    room.players.forEach((player) => {
      player.ready = false;
    });
    room.rematchVotes = [];
  }
  broadcastRoom(room);
}

function handleLeave(ws) {
  const meta = clientMeta.get(ws);
  const room = getRoomByClient(ws);
  if (!meta || !room) return;
  const player = room.players.find((entry) => entry.id === meta.playerId);
  if (player) {
    player.connected = false;
    player.ws = null;
  }
  assignHost(room);
  broadcastRoom(room);
  removeEmptyRoom(room);
  clientMeta.delete(ws);
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const message = JSON.parse(String(raw));
    switch (message.type) {
      case 'create_room':
        handleCreateRoom(ws, message);
        break;
      case 'join_room':
        handleJoinRoom(ws, message);
        break;
      case 'resume_session':
        handleResume(ws, message);
        break;
      case 'set_ready':
        handleReady(ws, message);
        break;
      case 'update_config':
        handleUpdateConfig(ws, message);
        break;
      case 'start_match':
        handleStartMatch(ws, message);
        break;
      case 'request_rematch':
        handleRematch(ws);
        break;
      case 'leave_room':
        handleLeave(ws);
        break;
      default:
        send(ws, { type: 'error', message: `Unknown message type: ${message.type}` });
    }
  });

  ws.on('close', () => handleLeave(ws));
});

server.listen(PORT, () => {
  console.log(`Koraista online server listening on :${PORT}`);
});
