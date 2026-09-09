import { ref, set, update, onValue, push, remove, onDisconnect, get } from 'firebase/database';
import { db } from './firebase';
import { MatchState, MatchPlayer, GameType, UserProfile } from './types';

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createRoom(
  user: UserProfile,
  gameType: GameType,
  duration: number
): { roomCode: string; promise: Promise<void> } {
  const roomCode = generateRoomCode();
  const roomRef = ref(db, `rooms/${roomCode}`);
  const player: MatchPlayer = {
    uid: user.uid,
    nickname: user.nickname,
    avatar: user.avatar,
    rating: user.rating,
    ready: false,
    score: 0,
    finished: false,
  };
  const matchState: MatchState = {
    status: 'waiting',
    gameType,
    duration,
    problemSeed: Math.floor(Math.random() * 1000000),
    players: { [user.uid]: player },
    createdAt: Date.now(),
    winner: null,
  };
  onDisconnect(roomRef).remove();
  const promise = set(roomRef, matchState);
  return { roomCode, promise };
}

export function joinRoom(
  roomCode: string,
  user: UserProfile
): Promise<{ success: boolean; error?: string }> {
  const roomRef = ref(db, `rooms/${roomCode}`);
  return get(roomRef).then((snap) => {
    const room = snap.val() as MatchState | null;
    if (!room) return { success: false, error: 'Room not found' };
    const playerKeys = Object.keys(room.players || {});
    if (playerKeys.length >= 2) return { success: false, error: 'Room is full' };
    const player: MatchPlayer = {
      uid: user.uid,
      nickname: user.nickname,
      avatar: user.avatar,
      rating: user.rating,
      ready: false,
      score: 0,
      finished: false,
    };
    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomCode}/players/${user.uid}`] = player;
    updates[`rooms/${roomCode}/status`] = 'ready';
    onDisconnect(ref(db, `rooms/${roomCode}/players/${user.uid}`)).remove();
    return update(ref(db), updates).then(() => ({ success: true }));
  });
}

export function listenToRoom(roomCode: string, callback: (state: MatchState | null) => void) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const unsub = onValue(roomRef, (snap) => callback(snap.val()));
  return unsub;
}

export function setPlayerReady(roomCode: string, uid: string, ready: boolean) {
  return update(ref(db), { [`rooms/${roomCode}/players/${uid}/ready`]: ready });
}

export function updatePlayerScore(roomCode: string, uid: string, score: number, finished = false) {
  return update(ref(db), {
    [`rooms/${roomCode}/players/${uid}/score`]: score,
    [`rooms/${roomCode}/players/${uid}/finished`]: finished,
  });
}

export function startMatch(roomCode: string) {
  return update(ref(db), {
    [`rooms/${roomCode}/status`]: 'countdown',
  });
}

export function setMatchStatus(roomCode: string, status: MatchState['status']) {
  return update(ref(db), { [`rooms/${roomCode}/status`]: status });
}

export function setWinner(roomCode: string, uid: string) {
  return update(ref(db), { [`rooms/${roomCode}/winner`]: uid, [`rooms/${roomCode}/status`]: 'finished' });
}

export function leaveRoom(roomCode: string, uid: string) {
  return remove(ref(db, `rooms/${roomCode}/players/${uid}`)).then(() => {
    get(ref(db, `rooms/${roomCode}/players`)).then((snap) => {
      if (!snap.exists()) remove(ref(db, `rooms/${roomCode}`));
    });
  });
}

export function deleteRoom(roomCode: string) {
  return remove(ref(db, `rooms/${roomCode}`));
}

// Quick Match matchmaking
export function findQuickMatch(
  user: UserProfile,
  gameType: GameType,
  duration: number
): Promise<{ roomCode: string; isHost: boolean }> {
  const queueRef = ref(db, 'queue');
  return get(queueRef).then((snap) => {
    const queue = snap.val() as Record<string, { uid: string; gameType: GameType; duration: number; roomCode: string }> | null;
    if (queue) {
      for (const [queueId, entry] of Object.entries(queue)) {
        if (entry.uid !== user.uid && entry.gameType === gameType && entry.duration === duration) {
          remove(ref(db, `queue/${queueId}`));
          return joinRoom(entry.roomCode, user).then(() => ({ roomCode: entry.roomCode, isHost: false }));
        }
      }
    }
    const { roomCode } = createRoom(user, gameType, duration);
    const queueEntry = { uid: user.uid, gameType, duration, roomCode };
    const newQueueRef = push(queueRef, queueEntry);
    onDisconnect(newQueueRef).remove();
    return { roomCode, isHost: true };
  });
}

export function cancelQuickMatch(queueId: string) {
  return remove(ref(db, `queue/${queueId}`));
}
