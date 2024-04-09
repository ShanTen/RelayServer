const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

//constants
const API_url = `https://urchin-app-8wf89.ondigitalocean.app/household/log-data`

function convertDateToEpoch(dateTimeString) {
    // Extract year, month, day, hour, and minute from the input string
    const year = parseInt(dateTimeString.substring(0, 4));
    const month = parseInt(dateTimeString.substring(4, 6)) - 1; // Months are 0-indexed in JavaScript
    const day = parseInt(dateTimeString.substring(6, 8));
    const hour = parseInt(dateTimeString.substring(8, 10));
    const minute = parseInt(dateTimeString.substring(10, 12));
    
    // Create a new Date object using the extracted values
    const dateObject = new Date(year, month, day, hour, minute);
    
    // Return the Unix epoch time (in seconds) corresponding to the date object
    return dateObject.getTime(); // Convert milliseconds to seconds
}

function breakDownMessageBodyArrIntoHeaderAndDate(msgBody) {
    //                         0     1      2     3  4  5  6  7  8
    // Message body array : ['1001', '123', '20240405', "'0'", "'0'", "'0'", "'0'", "'0'", "'0'"]

    let voltTemp = msgBody[3].replace(/'/g, '');
    let currentTemp = msgBody[4].replace(/'/g, '');
    let powerTemp = msgBody[5].replace(/'/g, '');
    let energyTemp = msgBody[6].replace(/'/g, '');
    let freqTemp = msgBody[7].replace(/'/g, '');
    let pfTemp = msgBody[8].replace(/'/g, '');

    let deviceID = Number(msgBody[0]);
    let password = msgBody[1];
    let date = msgBody[2];
    let epochDate = convertDateToEpoch(date);
    let voltage = Number(voltTemp);
    let current = Number(currentTemp);
    let power = Number(powerTemp);
    let energy = Number(energyTemp);
    let frequency = Number(freqTemp);
    let powerFactor = Number(pfTemp);

    let headers = {
        'Content-Type': 'application/json',
        'password': password,
    }

    let data = {
        "DeviceID": deviceID,
        "TimeStamp": epochDate,
        "Voltage": voltage,
        "Current": current,
        "PowerW": power,
        "EnergyWH": energy,
        "Frequency": frequency,
        "PowerFactor": powerFactor,
    }


    return [headers, data];
}

//use cors
app.use(cors());

//use body-parser
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('You got a GET request!');
}
);

app.post('/relay', (req, res) => {
    console.log(`POST request received at ${new Date()}`);

    let msg = req.body.message;

    let msgBody = msg.split(',').map(x => x.trim())
    console.log(msgBody); //will be an array of values separated by comma

    console.log(msgBody);
    let [header, data] = breakDownMessageBodyArrIntoHeaderAndDate(msgBody);
    console.log(header);
    console.log(data);
    
    /*Send it to backend server*/
    axios.post(`${API_url}/${data.DeviceID}`, data, {headers: header})
        .then((response) => {
            console.log(response.data);
            res.send('Success').status(200);
    })
        .catch((error) => {
            console.log(error);
            res.send('Error').status(500);
    });
});

//HTTP service
const port_http = process.env.PORT || 3000;
app.listen(port_http, () => {
    console.log('http server running at ' + port_http)
})