// worker.js
export default {
    async fetch(request, env) {
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('Not found', { status: 404 });
        }

        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const roomId = env.ROOM.idFromName(ip);
        const room = env.ROOM.get(roomId);
        return room.fetch(request);
    }
};

export class Room {
    constructor(state, env) {
        this.state = state;
        this.peers = new Map();
        this.timers = new Map();
        this.colors = ['Red','Blue','Green','Yellow','Orange','Purple','Pink','Brown','Black','White','Gray','Cyan','Magenta','Lime','Teal','Lavender','Violet','Indigo'];
        this.animals = ['Fox','Bear','Wolf','Cat','Dog','Lion','Tiger','Elephant','Giraffe','Zebra','Monkey','Horse','Rabbit','Mouse','Squirrel','Owl','Eagle','Dolphin','Whale','Shark'];
    }

    async fetch(request) {
        let peerId = this.getPeerIdFromCookie(request);
        if (!peerId) {
            peerId = crypto.randomUUID();
        }

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        await this.handleWebSocket(server, peerId, request);

        const response = new Response(null, { status: 101, webSocket: client });
        response.headers.set('Set-Cookie', `peerid=${peerId}; SameSite=Strict; Secure; Path=/`);
        return response;
    }

    async handleWebSocket(ws, peerId, request) {
        ws.accept();

        const rtcSupported = request.url.includes('/webrtc');
        const ua = request.headers.get('User-Agent') || '';
        const name = this.generateName(ua);

        // Include avatar (empty by default)
        const peerInfo = { id: peerId, name, rtcSupported }; 

        this.peers.set(peerId, {
            ws,
            info: peerInfo,
            lastBeat: Date.now(),
        });

        this.broadcast({ type: 'peer-joined', peer: peerInfo });

        const others = Array.from(this.peers.values())
            .filter(p => p.info.id !== peerId)
            .map(p => p.info);
        this.send(ws, { type: 'peers', peers: others });
        this.send(ws, { type: 'displayName', message: name.displayName });

        this.startKeepAlive(peerId);

        ws.addEventListener('message', (event) => {
            this.onMessage(peerId, event.data);
        });
        ws.addEventListener('close', () => {
            this.onClose(peerId);
        });
        ws.addEventListener('error', () => {});
    }

    onMessage(peerId, data) {
        let message;
        try {
            message = JSON.parse(data);
        } catch {
            return;
        }

        const peer = this.peers.get(peerId);
        if (!peer) return;

        switch (message.type) {
            case 'disconnect':
                this.leaveRoom(peerId);
                break;
            case 'pong':
                peer.lastBeat = Date.now();
                break;
            case 'avatar':
                // Store avatar and broadcast to all other peers
                peer.info.avatar = message.avatar;
                this.broadcast({ type: 'peer-avatar', peerId, avatar: message.avatar });
                break;
            default:
                if (message.to) {
                    const recipient = this.peers.get(message.to);
                    if (recipient) {
                        message.sender = peerId;
                        delete message.to;
                        this.send(recipient.ws, message);
                    }
                }
        }
    }

    onClose(peerId) {
        this.leaveRoom(peerId);
    }

    leaveRoom(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;

        this.cancelKeepAlive(peerId);
        this.peers.delete(peerId);
        this.broadcast({ type: 'peer-left', peerId });

        try {
            peer.ws.close();
        } catch {}
    }

    broadcast(message) {
        for (const [, peer] of this.peers) {
            this.send(peer.ws, message);
        }
    }

    send(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    startKeepAlive(peerId) {
        this.cancelKeepAlive(peerId);
        const TIMEOUT = 30000;
        const peer = this.peers.get(peerId);
        if (!peer) return;

        if (Date.now() - peer.lastBeat > 2 * TIMEOUT) {
            this.leaveRoom(peerId);
            return;
        }

        this.send(peer.ws, { type: 'ping' });

        const timer = setTimeout(() => {
            this.startKeepAlive(peerId);
        }, TIMEOUT);
        this.timers.set(peerId, timer);
    }

    cancelKeepAlive(peerId) {
        const timer = this.timers.get(peerId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(peerId);
        }
    }

    getPeerIdFromCookie(request) {
        const cookie = request.headers.get('Cookie');
        if (cookie) {
            const match = cookie.match(/peerid=([^;]+)/);
            if (match) return match[1];
        }
        return null;
    }

    generateName(ua) {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
        const isMobile = ua.includes('Mobile');
        return {
            model: isMobile ? 'Mobile' : 'Desktop',
            os: 'Unknown',
            browser: 'Unknown',
            type: isMobile ? 'mobile' : 'desktop',
            displayName: `${color} ${animal}`,
        };
    }
}