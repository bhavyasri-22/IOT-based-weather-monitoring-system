const Aedes = require('aedes');
const net = require('net');
const PORT = process.env.MQTT_PORT || 1883;

async function startBroker() {
  const aedes = typeof Aedes.createBroker === 'function'
    ? await Aedes.createBroker()
    : (typeof Aedes === 'function' ? Aedes() : new (Aedes.Aedes || Aedes)());
  const server = net.createServer(aedes.handle);

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

  return { aedes, server };
}

if (require.main === module) {
  startBroker();
}

module.exports = startBroker;

