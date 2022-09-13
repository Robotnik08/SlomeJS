const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 6969;
var fs = require('fs');
var dir = './ServerFiles';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
app.use(express.static('public'));
server.listen(port, () => {
console.log(`listening on *:${port}`);
});
let ConnectedUUID = [];
class Player {
    constructor(UUID, posX, posY) {
        this.UUID = UUID;
        this.posX = posX;
        this.posY = posY;
    }
}
//serverside
let doneLoading = false;
let map = [];
const mapSizeX = 100; // (mapSizeX > 0)
const mapSizeY = 100; // (mapSizeY > 0 && mapSizeY % 2 == 0)
const freq = 10; // 0-100, amount of noise 
GenerateNewmap();
function GenerateNewmap()
{
    let PerlinTerrain = 0;
    for (var x = 0; x < mapSizeX; x++)
    {
        map[x] = [];
        for (var y = 0; y < mapSizeY; y++)
        {
            map[x][y] = 0;
        }
        if (RandomChance(freq))
        {
            if (RandomChance(50))
            {
                PerlinTerrain++;
            }
            else
            {
                PerlinTerrain--;
            }
        }
        for (var y = 0; y <= PerlinTerrain + mapSizeY/2; y++)
        {
            map[x][y] = 3;
        }
        for (var y = PerlinTerrain + mapSizeY/2 - 3; y <= PerlinTerrain + mapSizeY/2; y++)
        {
            map[x][y] = 2;
        }
        map[x][PerlinTerrain + mapSizeY/2] = 1;
    }
    doneLoading = true;
}
function RandomChance(chance)
{
    if (chance/100 > Math.random())
    {
        return true;
    }
    return false;
}
io.on('connection', (socket) => {
    if (doneLoading) {
        console.log('a user connected ' + Math.random());
        var world = {
            map1: map,
            mapX: mapSizeX,
            mapY: mapSizeY,
            playerList: ConnectedUUID
        };
        socket.emit('SendWorld', world);
        socket.on('ChangeBlock', (data) => {
            map[data.posX][data.posY] = data.blockID;
            var changeVal = {
                x: data.posX,
                y: data.posY,
                ID: data.blockID
            };
            console.log('HI!' + Math.random());
            socket.broadcast.emit('change', changeVal);
        });
        socket.emit('requestPlayer', ConnectedUUID);
        socket.on('player', (data) => {
            ConnectedUUID.push(data);
            console.log(ConnectedUUID);
        });
        socket.on('UpdatePlayer', (data) => {
            for (let x = 0; x < ConnectedUUID.length; x++)
            {
                if (data.UUID == ConnectedUUID[x].UUID)
                {
                    ConnectedUUID[x].posX = data.posX;
                    ConnectedUUID[x].posY = data.posY;
                    break;
                }
            }
            io.emit('getPlayer', ConnectedUUID);
        });
    }
});