/* global WebSocket, AlphaPoint, $ */
import { Event } from './helper';
import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import subscribeLvl1 from './subscribe1';

// const url = process.env.URL ? process.env.URL : 'https://dev-api-v2.ccx.io';
const url = process.env.URL ? process.env.URL : 'https://dev-api.ccx.io';
let socket,io;

io = sailsIOClient(socketIOClient);
io.sails.autoConnect = false;

const CCXA_API = {
    
    Connect: async () => {
        return new Promise((resolve, reject) => {
            socket = io.sails.connect(url);
            socket.on('connect', () => {
                console.log('Websocket connection is open!');
                resolve(socket);
            })
        });
    },

    Disconnect: async () => {
        socket.disconnect();
        socket = undefined;
    },
    
    Subscribe: (method, path, pair, cb) => {
        socket[method](`${path}`, pair , cb )
    },

    OnMessage: (cb) => {
        socket.on('message', cb) 
    }

    
} 

export default CCXA_API;

    



