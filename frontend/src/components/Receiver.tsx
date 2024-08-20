import { useEffect, useState } from 'react';

export const Receiver = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:5080');
        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({
                type: 'receiver'
            }));
        };
        setSocket(newSocket);
        startReceiving(newSocket);
    }, []);

    function startReceiving(newSocket: WebSocket) {
        const newPc = new RTCPeerConnection();
        setPc(newPc);

        newPc.ontrack = (event) => {
            // Store the track and wait for user interaction to play the video
            const stream = new MediaStream([event.track]);
            const video = document.createElement('video');
            video.srcObject = stream;
            document.body.appendChild(video);
            video.muted = true; // Mute to allow autoplay

            // Wait for user to click play
            setVideoReady(true);
        };

        newSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                newPc.setRemoteDescription(message.sdp).then(() => {
                    newPc.createAnswer().then((answer) => {
                        newPc.setLocalDescription(answer);
                        newSocket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                newPc.addIceCandidate(message.candidate);
            }
        };
    }

    const handlePlayVideo = () => {
        const videos = document.getElementsByTagName('video');
        if (videos.length > 0) {
            videos[0].play().catch(err => {
                console.error('Play failed:', err);
            });
        }
    };

    return (
        <div>
            {videoReady && <button onClick={handlePlayVideo}>Play Video</button>}
        </div>
    );
};
