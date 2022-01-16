const https = require('https');
const AWS = require('aws-sdk');

exports.handler = async (event, context, callback) => {

    // Get Secret API Key Value
    var secretManager = new AWS.SecretsManager();
    
    var apiSecret = await secretManager.getSecretValue({
      SecretId: 'arn:aws:secretsmanager:us-east-1:299234259904:secret:asteroidsAPIKey-jt3sqt'
      }).promise();
    
    const apiKey = apiSecret['SecretString'];
   
   // Validate arguments
    var dataString = '';
    var dateStart = '';
    var dateEnd = '';
    var rangeKM = 0;
    var validResult = {
        valid: true,
        missingValues: ['']
    }
    
    if (event.body) {
        let body = JSON.parse(event.body);
        
        if (body.dateStart) {
            dateStart = body.dateStart;
        }
        else {
            validResult.valid = false;
            validResult.missingValues.push('dateStart');
        }
        
        if (body.dateEnd) {
            dateEnd = body.dateEnd;
        }
        else {
            validResult.valid = false;
            validResult.missingValues.push('dateEnd');
        }
        
        if (body.within) {
            var within = body.within;
            if (within.value) {
                rangeKM = parseFloat(within.value);
            }
            else {
                validResult.valid = false;
                validResult.missingValues.push('within.value');
            }
            
            if (!(within.units && within.units === "kilometers")) {
                // The lambda response must return CORS headers to avoid CORS exceptions
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin' : '*',
                        'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Credentials' : true,
                        "Access-Control-Allow-Methods": "OPTIONS,POST"
                    },                     
                    body: JSON.stringify({
                        error: true,
                        errorMessage: "within.units must be present, and can only be 'kilometers'"
                    })
                }
            }
            
        }
        else {
            validResult.valid = false;
            validResult.missingValues.push('within');
        }         
    }
    else {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin' : '*',
                'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Credentials' : true,
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },                     
            body: JSON.stringify({
                error: true,
                errorMessage: "request body expected"
            })
        }
    }    
    
    if (!validResult.valid) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin' : '*',
                'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Credentials' : true,
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },            
            body: JSON.stringify({
                error: true,
                errorMessage: "You are missing the following arguments: " + validResult.missingValues.join()
            })
        }
    }
   
    // Compute the search periods necessary to complete the search
    const searchPeriods = computeSearchPeriods(dateStart, dateEnd);
    var asteroidsWithinDistance = new Set();
    
    // Search in each search period and keep the results in a set to avoid duplicate asteroid names
    for (var searchPeriod of searchPeriods) {
        var currSearchPeriodAsteroids = new Set(await initAsteroidsSearch(apiKey, rangeKM, searchPeriod.dateStart, searchPeriod.dateEnd));
        currSearchPeriodAsteroids.forEach(asteroidsWithinDistance.add, asteroidsWithinDistance)
    }
        
    return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Credentials' : true,
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        body: JSON.stringify({
            asteroids: Array.from(asteroidsWithinDistance)
        })
    }

};

function computeSearchPeriods(dateStart, dateEnd) {
    var currStart = new Date(dateStart);
    
    var end = new Date(dateEnd);
    
    var numDaysDifference = (end - currStart) / (1000 * 3600 * 24);
    
    if (numDaysDifference > 6) {
        // Compute multiple search periods
        var numSearchPeriods = numDaysDifference / 6;
        console.log("Num search periods: " + numSearchPeriods)
        var searchPeriods = [];
        var currEnd = new Date(currStart);
        currEnd.setDate(currStart.getDate() + 6);
        for (var i=0; i < numSearchPeriods; i++) {
            console.log("currStart: " + currStart + " currEnd: " + currEnd);
            var searchPeriod = {
                dateStart: currStart.toISOString().slice(0,10),
                dateEnd: currEnd.toISOString().slice(0,10)
            }
            
            // Append new search period
            searchPeriods.push(searchPeriod);
            
            // Update start and end for new search period
            currStart.setDate(currStart.getDate() + 6);
            currEnd.setDate(currEnd.getDate() + 6);
            
            // If current end advanced beyond orig end
            if (currEnd > end) {
                currEnd.setDate(end.getDate())
            }
        }
        
        return searchPeriods;
    }
    else {
        // Otherwise, just return the one
        return [{
            dateStart: dateStart,
            dateEnd: dateEnd
        }]
    }
}

async function initAsteroidsSearch(apiKey, rangeKM, dateStart, dateEnd) {
    
    var url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${dateStart}&end_date=${dateEnd}&api_key=${apiKey}`;
    let dataString = '';
    const response = await new Promise((resolve, reject) => {
        const req = https.get(url, function(res) {
          res.on('data', chunk => {
            dataString += chunk;
          });
          res.on('end', () => {
            resolve(handleAsteroids(dataString, rangeKM, dateStart, dateEnd));
          });
        });
        
        req.on('error', (e) => {
          throw new Error('Something went wrong!');
        });
    });
    
    return response;
}

function handleAsteroids(lastDataString, rangeKM, dateStart, dateEnd) {
    // Parse response data
    var asteroidData = JSON.parse(lastDataString);
    var asteroidSet = new Set();
    
    // Search through near earth object data
    for (var key in asteroidData.near_earth_objects) {
        if (asteroidData.near_earth_objects.hasOwnProperty(key)) {
            var occurenceDate = asteroidData.near_earth_objects[key];
            
            // Search Near Earth Objects in each occurenceDate
            for (var nearEarthObject of occurenceDate) {
                
                // Search Approaches in each Near Earth Object
                for (var approach of nearEarthObject.close_approach_data) {
                    var missKM = parseFloat(approach.miss_distance.kilometers);
                    if (missKM <= rangeKM) {
                        asteroidSet.add(nearEarthObject.name);
                    }
                }
            }
        }
    }
    
    return asteroidSet;
}
