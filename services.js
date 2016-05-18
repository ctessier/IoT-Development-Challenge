var loki = require('lokijs');
var db = new loki('db.json');
var message = db.addCollection('message', {
    'indices': ['time']
});

exports.load = function () {
    db.loadDatabase();
}

exports.postMessage = function (payload) {
    payload.time = new Date(payload.timestamp).getTime();
    message.insert(payload);
};

exports.getSynthesis = function (timestamp, duration) {
    db.saveDatabase();

    timestamp = timestamp.replace(" ", "+");
    timestamp = new Date(timestamp);
    timestamp = timestamp.getTime();
    var messages = message
        .chain()
        .find({'time': {'$gt': timestamp, '$lt': timestamp+(duration*1000)}})
        .simplesort('sensorType')
        .data();

    var values = [];
    var synthesis = [];
    var currentSynthesis = {
        sensorType: null,
        minValue: 0,
        maxValue: 0,
        mediumValue: 0
    };

    messages.forEach(function (obj) {
        if (currentSynthesis.sensorType !== obj.sensorType) {
            if (currentSynthesis.sensorType !== null) {
                synthesis.push(JSON.parse(JSON.stringify(currentSynthesis)));
            }
            currentSynthesis.sensorType = obj.sensorType;
            currentSynthesis.minValue = obj.value;
            currentSynthesis.maxValue = obj.value;
            currentSynthesis.mediumValue = obj.value;
            values = [obj.value];
        } else {
            values.push(obj.value);
            if (obj.value < currentSynthesis.minValue) {
                currentSynthesis.minValue = obj.value;
            }
            if (obj.value > currentSynthesis.maxValue) {
                currentSynthesis.maxValue = obj.value;
            }
            currentSynthesis.mediumValue = calculateAverage(values);
        }
    });

    // flush last sensortype
    if (currentSynthesis.sensorType !== null) {
        synthesis.push(currentSynthesis);
    }

    return synthesis;
}

function calculateAverage(values) {
    var sum = 0;
    values.forEach(function (value) {
        sum += value;
    });
    if (sum/values.length < 0) {
        return Math.ceil(sum/values.length);
    } else {
        return Math.floor(sum/values.length);
    }
}
