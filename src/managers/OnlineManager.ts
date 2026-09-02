import type { CardType } from '../data/types';
import type { GameConfig, PlayMode, Player, Team } from './GameState';

export interface OnlinePlayer {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  teamId?: string;
  isReferee?: boolean;
}

export interface OnlineRoomState {
  roomCode: string;
  hostId: string;
  playMode: PlayMode;
  players: OnlinePlayer[];
  config?: Partial<GameConfig>;
  matchStarted?: boolean;
  rematchVotes?: string[];
}

interface MatchStartPayload {
  config: GameConfig;
  players: Player[];
  teams: Team[];
}

type RoomListener = (room: OnlineRoomState | null) => void;
type MatchListener = (payload: MatchStartPayload) => void;
type StatusListener = (status: string) => void;

const SESSION_KEY = 'koraista_online_session';

class OnlineManager {
  private socket: WebSocket | null = null;
  private room: OnlineRoomState | null = null;
  private roomListeners = new Set<RoomListener>();
  private matchListeners = new Set<MatchListener>();
  private statusListeners = new Set<StatusListener>();
  private session: { url: string; resumeToken?: string; playerId?: string; roomCode?: string; playerName?: string } | null = null;
  private status = 'offline';

  constructor() {
    this.loadSession();
  }

  private emitRoom(): void {
    this.roomListeners.forEach((listener) => listener(this.room));
  }

  private emitStatus(message: string): void {
    this.status = message;
    this.statusListeners.forEach((listener) => listener(message));
  }

  private loadSession(): void {
    try {
      this.session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as typeof this.session;
    } catch {
      this.session = null;
    }
  }

  private saveSession(): void {
    try {
      if (this.session) localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore storage errors
    }
  }

  private handleMessage(raw: MessageEvent<string>): void {
    const msg = JSON.parse(raw.data);
    if (msg.type === 'connected' && this.session) {
      this.session.resumeToken = msg.resumeToken;
      this.session.playerId = msg.playerId ?? this.session.playerId;
      this.saveSession();
    }
    if (msg.type === 'room_state') {
      this.room = msg.room as OnlineRoomState;
      if (this.session && this.room) {
        this.session.roomCode = this.room.roomCode;
        this.saveSession();
      }
      this.emitRoom();
    }
    if (msg.type === 'match_started') {
      this.matchListeners.forEach((listener) => listener(msg.payload as MatchStartPayload));
    }
    if (msg.type === 'error') {
      this.emitStatus(msg.message || 'Online error');
    }
  }

  private send(type: string, payload: Record<string, unknown> = {}): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type, ...payload }));
  }

  getDefaultUrl(): string {
    try {
      const saved = this.session?.url;
      if (saved) return saved;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.hostname}:2567`;
    } catch {
      return 'ws://localhost:2567';
    }
  }

  async connect(url = this.getDefaultUrl()): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.session = { ...(this.session ?? {}), url };
    this.saveSession();

    await new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket(url);
      this.emitStatus('connecting');

      this.socket.onopen = () => {
        this.emitStatus('connected');
        if (this.session?.resumeToken) {
          this.send('resume_session', { resumeToken: this.session.resumeToken });
        }
        resolve();
      };
      this.socket.onerror = () => reject(new Error('Unable to connect to online server'));
      this.socket.onclose = () => {
        this.emitStatus('offline');
      };
      this.socket.onmessage = (event) => this.handleMessage(event as MessageEvent<string>);
    });
  }

  async createRoom(playerName: string, playMode: PlayMode): Promise<void> {
    await this.connect();
    this.session = { ...(this.session ?? { url: this.getDefaultUrl() }), playerName };
    this.saveSession();
    this.send('create_room', { playerName, playMode });
  }

  async joinRoom(roomCode: string, playerName: string): Promise<void> {
    await this.connect();
    this.session = { ...(this.session ?? { url: this.getDefaultUrl() }), roomCode: roomCode.toUpperCase(), playerName };
    this.saveSession();
    this.send('join_room', { roomCode: roomCode.toUpperCase(), playerName });
  }

  setReady(ready: boolean): void {
    this.send('set_ready', { ready });
  }

  updateConfig(config: Partial<GameConfig>): void {
    this.send('update_config', { config });
  }

  startMatch(payload: MatchStartPayload): void {
    this.send('start_match', { payload });
  }

  requestRematch(): void {
    this.send('request_rematch');
  }

  leaveRoom(): void {
    this.send('leave_room');
    this.room = null;
    this.emitRoom();
  }

  getRoom(): OnlineRoomState | null {
    return this.room;
  }

  getPlayerId(): string | undefined {
    return this.session?.playerId;
  }

  getStatus(): string {
    return this.status;
  }

  isHost(): boolean {
    const room = this.room;
    return Boolean(room && this.session?.playerId && room.hostId === this.session.playerId);
  }

  onRoomChange(listener: RoomListener): () => void {
    this.roomListeners.add(listener);
    listener(this.room);
    return () => this.roomListeners.delete(listener);
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  onMatchStarted(listener: MatchListener): () => void {
    this.matchListeners.add(listener);
    return () => this.matchListeners.delete(listener);
  }

  getSelectedCardTypes(room: OnlineRoomState | null): CardType[] | null {
    const types = room?.config?.cardTypes;
    return Array.isArray(types) && types.length ? types : null;
  }
}

export const onlineManager = new OnlineManager();
