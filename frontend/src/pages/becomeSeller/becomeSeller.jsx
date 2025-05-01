import React from 'react';
import "./becomeSeller.css";

const BecomeSeller = () => {
  return (
    <div className="become-seller">
      <div className="become-seller-img"/>
      <section className="hero-section">
        <h1>Start Selling on DressLink</h1>
        <p>Join our mission to connect tailors, designers, and material suppliers with a larger audience. Let your craft shine!</p>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <img src="https://cdn-icons-png.flaticon.com/512/753/753318.png" alt="Step 1" />
            <h3>1. Register / Login</h3>
            <p>Sign in to your DressLink account to start your journey as a seller.</p>
          </div>
          <div className="step">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="Step 2" />
            <h3>2. Create Your Gig</h3>
            <p>Fill in your service or product details, upload images, and set prices.</p>
          </div>
          <div className="step">
            <img src="https://cdn-icons-png.flaticon.com/512/929/929430.png" alt="Step 3" />
            <h3>3. Go Live</h3>
            <p>Your gig will appear on the marketplace. Start receiving inquiries and grow your business!</p>
          </div>
        </div>
      </section> 

      <section className="seller-options">
        <div className="card">
          <img src="https://cdn-icons-png.flaticon.com/512/4645/4645949.png" alt="Professional" />
          <h2>Become a Professional</h2>
          <p>
            Are you a tailor or designer? Offer custom clothing services, showcase your portfolio, and get discovered by rural and urban customers.
          </p>
          <button onClick={() => navigate('/create-gig/professional')}>Create Professional Gig</button>
        </div>

        <div className="card">
          <img src="https://cdn-icons-png.flaticon.com/512/4645/4645820.png" alt="Supplier" />
          <h2>Become a Supplier</h2>
          <p>
            Own a shop or provide tailoring materials? List your fabrics, threads, accessories and supply to professionals across the country.
          </p>
          <button onClick={() => navigate('/create-gig/supplier')}>Create Supplier Gig</button>
        </div>
      </section>
        
    </div>
  );
}       
export default BecomeSeller;