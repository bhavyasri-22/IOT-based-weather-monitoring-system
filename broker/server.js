const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const PORT = 1883;

server.listen(PORT, function () {
  console.log(`[MQTT Broker] Server listening on port ${PORT}`);
});

aedes.on('client', function (client) {
  console.log(`[MQTT Broker] Client connected: ${client ? client.id : client}`);
});

aedes.on('clientDisconnect', function (client) {
  console.log(`[MQTT Broker] Client disconnected: ${client ? client.id : client}`);
});

aedes.on('publish', function (packet, client) {
  if (client) {
    console.log(`[MQTT Broker] Message published on topic ${packet.topic} by ${client.id}`);
  }
});
