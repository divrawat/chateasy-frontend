
import { io } from "socket.io-client";


const socket = io("https://72cc-2404-7c80-74-aee-6c41-edf6-4c2d-96a.ngrok-free.app",
    {
        // query: { userId: '00000', },
        transports: ["websocket"]
    });
export default socket;
