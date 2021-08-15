const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const fetch = require("cross-fetch");
const console = require('console');
module.exports.getSuggestions = async (req, res) => {
    var params = req.query
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };
    fetch("https://raw.githubusercontent.com/keubikhq/backend-task/master/data/cities_canada-usa.tsv", requestOptions)
        .then(response => response.text())
        .then(result => tsvJSON(result))
        .then(json => getCities(json, params))
        .then(suggestions => res.send({
            suggestions: suggestions
        }))
        .catch(error => res.send({
            error: error,
            message: "went wrong"
        }));
};


const tsvJSON = (tsv) => {
    const lines = tsv.split('\n');
    const headers = lines.slice(0, 1)[0].split('\t');
    return lines.slice(1, lines.length).map(line => {
        const data = line.split('\t');
        return headers.reduce((obj, nextKey, index) => {
            obj[nextKey] = data[index];
            return obj;
        }, {});
    });
}

const getCities = (json, params) => {
    var citiesArray = []
    for (var i = 0; i < json.length; i++) {
        if (params.q && json[i].name && json[i].name.toLowerCase().includes(params.q.toLowerCase()) && params.latitude && params.longitude && json[i].lat && json[i].long) {
            citiesArray.push({
                "name": json[i].name,
                "latitude": json[i].lat,
                "longitude": json[i].long,
                // "distance": distance(params.latitude, params.longitude, json[i].lat, json[i].long, "K"),
                "score": calculateLocationScore(json[i], params.latitude, params.longitude)
            })
        } else if (!params.q && params.latitude && params.longitude && json[i].lat && json[i].long) {
            citiesArray.push({
                "name": json[i].name,
                "latitude": json[i].lat,
                "longitude": json[i].long,
                //"distance": distance(params.latitude, params.longitude, json[i].lat, json[i].long, "K"),
                "score": calculateLocationScore(json[i], params.latitude, params.longitude)
            })
        } else if (params.q && json[i].name && !params.latitude && !params.longitude) {
            citiesArray.push({
                "name": json[i].name,
                "latitude": json[i].lat,
                "longitude": json[i].long,
                // "distance": distance(params.latitude, params.longitude, json[i].lat, json[i].long, "K"),
                "score": calculateStringScore(params.q, json[i].name)
            })
        }
    }
    return citiesArray.sort(function (a, b) {
        return b.score - a.score;
    });;
}

// function distance(lat1, lon1, lat2, lon2, unit) {
//     var radlat1 = Math.PI * parseInt(lat1) / 180
//     var radlat2 = Math.PI * parseInt(lat2) / 180
//     var theta = parseInt(lon1) - parseInt(lon2)
//     var radtheta = Math.PI * theta / 180
//     var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
//     if (dist > 1) {
//         dist = 1;
//     }
//     dist = Math.acos(dist)
//     dist = dist * 180 / Math.PI
//     dist = dist * 60 * 1.1515
//     console.log(dist)
//     if (unit == "K") { dist = dist * 1.609344 }
//     if (unit == "N") { dist = dist * 0.8684 }
//     return dist
// }

function calculateLocationScore(location, latitude, longitude) {
    const lat = Math.abs(parseInt(location.lat) - parseInt(latitude));
    const long = Math.abs(parseInt(location.long) - parseInt(longitude));
    let score = 10 - (lat + long) / 2;
    score = score > 0 ? score / 10 : 0;  //Math.round(score)
    return score;
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function calculateStringScore(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}