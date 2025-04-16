import React from 'react';
import Featured from '../../components/featured/featured.jsx';
import Benefits from '../../components/benefits/benefits.jsx';
import CatCards from '../../components/catCards/catCards.jsx';
import categories from '../../components/catergories.jsx';
import Landing1 from '../../assets/landing1.png';
import "./home.css";

const Home=() => {
  return (
    <div className="home">
      <div className="home-container">
        <div className="home-left">
          <h1>Bringing Tailoring Dreams to Life</h1>
          <p><span className='line'> Unlock exclusive features, connect with professionals and explore</span><span> a variety of materials tailored to your needs.</span></p>
          <button className='btn'>Get Started</button>
        </div>
        <div className="home-right">
          <img src={Landing1} alt="home" className='home-img' />
        </div>
      </div>
      <CatCards item={categories}/>
      <Featured />
      <Benefits/>

    </div>
  );
}
export default Home;