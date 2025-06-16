import { io } from "socket.io-client";


const socket = io("https://2df1-202-164-54-34.ngrok-free.app",
    {
        // query: { userId: '00000', },
        transports: ["websocket"]
    });
export default socket;
