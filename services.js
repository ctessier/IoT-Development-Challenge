var Loki = require('lokijs');
var db = new Loki('sensors', {
    autoload: true,
    autoloadCallback: loadHandler,
    autosave: true, 
    autosaveInterval: 2000
});

var sensors = null;

function loadHandler() {
    sensors = db.getCollection('sensors');
    if (sensors === null) {
        sensors = db.addCollection('sensors', {
            'indices': ['time']
        });
    }
}

exports.postMessage = function (payload) {
    payload.time = new Date(payload.timestamp).getTime();
    sensors.insert(payload);
};

exports.getSynthesis = function (timestamp, duration) {
    timestamp = timestamp.replace(" ", "+");
    timestamp = new Date(timestamp);
    timestamp = timestamp.getTime();
    var messages = sensors
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
        mediumValue: 0.00
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

    // add last sensortype
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
    
    return parseFloat((Math.round(sum/values.length * 100) / 100).toFixed(2));
}
