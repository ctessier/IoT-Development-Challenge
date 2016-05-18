var Hapi = require('hapi');
var Services = require('./services');
var port = 80;

var server = new Hapi.Server(); // tester avec Hapi.createServer('0.0.0.0', 80 ... )
server.connection({port: port});

server.route({
    method: 'POST',
    path: '/messages',
    handler: function (request, reply) {
        Services.postMessage(request.payload);
        reply();
    }
});

server.route({
    method: 'GET',
    path: '/messages/synthesis',
    handler: function (request, reply) {
        reply(Services.getSynthesis(request.query.timestamp, request.query.duration));
    }
});

server.start(function (err) {
    if (err) {
        throw err;
    }
    Services.load();
    console.log('Server running on port ' + port);
});
