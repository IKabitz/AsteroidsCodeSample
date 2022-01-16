import logo from './asteroid.jpg';
import './App.css';
import AsteroidSearch from './AsteroidSearch';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Ian's Near Earth Object Finder
        </p>
        <p className="Main-text">
          This web page allows you to search the NASA Near Earth Object database for Asteroids that approach near the Earth! <br/>
          Enter the Start Date and End Date for the time window that the object approached in <br/>
          Then, enter the Distance in Kilometers from the earth that the object had it's closest approach within <br/>
          Don't forget to enter the secret key Ian gave you!
        </p>
          <AsteroidSearch/>
      </header>
    </div>
  );
}

export default App;
