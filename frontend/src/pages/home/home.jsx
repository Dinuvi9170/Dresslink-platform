import React from 'react';
import Featured from '../../components/featured/featured.jsx';
import "./home.css";


const Home=() => {
  return (
    <div className="home">
      <Featured />
      <h1>Welcome to the Home Page</h1>
      <p>This is a simple home page.</p>
    </div>
  );
}
export default Home;