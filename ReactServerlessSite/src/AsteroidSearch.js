import React, { useState } from 'react'
import './AsteroidSearch.css'

function AsteroidSearch() {

    const [formData, setFormData] = useState({
        startDate: "",
        endDate: "",
        withinKM: 0,
        apiKey: ""
    })

    const [searchResults, setSearchResults] = useState([])

    function handleSubmit(event) {
        event.preventDefault();
        var req = new XMLHttpRequest();


        req.addEventListener('load', () => {
            var response = JSON.parse(req.responseText);
            if (req.status === 400) {
                alert(response.errorMessage);
            }
            if (req.status === 403) {
                alert("Either the secret key isn't valid, or you forgot to add it!")
            }
            if (req.status === 500) {
                alert("Internal Error!");
            }
            if (req.status === 200) {
                setSearchResults(response.asteroids);
            }
        });

        req.open('POST', 'https://3rcspsivnh.execute-api.us-east-1.amazonaws.com/v1/nearearthobjects');
        req.setRequestHeader('x-api-key', formData.apiKey);
        const reqBody = {
            dateStart: formData.startDate,
            dateEnd: formData.endDate,
            within: {
                value: parseFloat(formData.withinKM),
                units: "kilometers"
            }
        }
        req.send(JSON.stringify(reqBody))
    }

    function Asteroids() {
        if (searchResults.length > 0) {
            return (
                <div className='Search-Results'>
                    <p>Asteroids that came within the <br/> specified kilometers of earth</p>
                    <table>
                        <tbody>
                            {searchResults.map((result) => <tr>
                                <td key={result}>
                                    <div> {result} </div>
                                </td>
                            </tr> )}
                        </tbody>
                    </table>
                </div>
            )
        }
        else {
            return (
                <div>
                    <p>There are no search results!</p>
                </div>
            )
        }
    }

    return (
        <div>
            <form className='Search-Form' onSubmit={handleSubmit}>
                <label>
                    Start Date
                    <input className='Search-Date' type="date" id="startDate" value={formData.startDate} 
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </label>
                <label>
                    End Date
                    <input className='Search-Date' type="date" id="endDate" value={formData.endDate} 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </label>
                <label>
                    Distance from Earth in KM
                    <input type="text" id="withinKM" value={formData.withinKM} 
                    onChange={(e) => setFormData({...formData, withinKM: e.target.value})} />
                </label>
                <label>
                    The secret key that Ian gave you
                    <input type="password" id="apiKey" value={formData.apiKey} 
                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})} />
                </label>            
                <input type="submit" value="Submit" />
            </form>
            <Asteroids/>
        </div>
    );

}

export default AsteroidSearch;