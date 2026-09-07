import { io, Socket } from 'socket.io-client';
import { Issue } from '../types';

let socket: Socket | null = null;

const RAW_API_URL = (import.meta as any).env?.VITE_API_URL || '';
const SOCKET_SERVER_URL = RAW_API_URL.replace(/\/+$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Citypulse Realtime] Connected to Socket.IO live server');
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Citypulse Realtime] Disconnected from server');
    });
  }
  return socket;
}

export type RealtimeReportCallbacks = {
  onReportCreated?: (report: Issue) => void;
  onReportUpdated?: (report: Issue) => void;
};

export function subscribeToRealtimeReports(
  callbacksOrOnCreated: RealtimeReportCallbacks | ((report: Issue) => void),
  maybeOnUpdated?: (report: Issue) => void
): () => void {
  const s = getSocket();

  let onCreated: ((report: Issue) => void) | undefined;
  let onUpdated: ((report: Issue) => void) | undefined;

  if (typeof callbacksOrOnCreated === 'function') {
    onCreated = callbacksOrOnCreated;
    onUpdated = maybeOnUpdated;
  } else {
    onCreated = callbacksOrOnCreated.onReportCreated;
    onUpdated = callbacksOrOnCreated.onReportUpdated;
  }

  const handleCreated = (newReport: Issue) => {
    console.log('✨ [Realtime Event] report.created received:', newReport.title);
    if (onCreated) onCreated(newReport);
  };

  const handleUpdated = (updatedReport: Issue) => {
    console.log('🔄 [Realtime Event] report.updated received:', updatedReport.title, '->', updatedReport.status);
    if (onUpdated) onUpdated(updatedReport);
  };

  s.on('report.created', handleCreated);
  s.on('report.updated', handleUpdated);

  return () => {
    s.off('report.created', handleCreated);
    s.off('report.updated', handleUpdated);
  };
}
