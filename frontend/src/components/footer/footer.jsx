import React from "react";
import "./footer.css";
import Logo from "../../assets/Dresslink logo1.png";
import Facebook from "../../assets/facebook.png";
import Twitter from "../../assets/twitter.png";
import Instagram from "../../assets/instagram.png";
import Youtube from "../../assets/YouTube.png";  

const Footer = () => {
  return (
    <div className="footer">
      <div className="container">
        <div className="footer-details-main">
          <img className="Image" src={Logo} alt="logo"></img>

          <br></br>
          <br></br>
          <div className="footer-details-main-social">
            <img src={Facebook} id="image" alt="Facebook"></img>
            <img src={Twitter} id="image" alt="Twitter"></img>
            <img src={Instagram} id="image" alt="Instagram"></img>
            <img src={Youtube} id="image" alt="YouTube"></img>
          </div>
        </div>
        <div className="footer-details">
          <ul>
            <li>
              <span className="page">Pages</span>
            </li>
            <li>Home</li>
            <li>Professionals</li>
            <li>Fabrics & Materials</li>
            <li>Preview My Fit</li>
          </ul>
        </div>
        <div className="footer-details">
          <ul>
            <li>
              <span>Know Us</span>
            </li>
            <li>About</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div className="footer-details">
          <ul>
            <li>
              <span>Support</span>
            </li>
            <li>Getting Started</li>
            <li>Help center</li>
          </ul>
        </div>
      </div>
      <div id="footer-end">
        <br></br>
        <br></br>
        <br></br>
        <p>
          Copyright © 2025 DressLink | All Rights Reserved | Terms and
          Conditions | Privacy Policy
        </p>
      </div>
    </div>
  );
};
export default Footer;
