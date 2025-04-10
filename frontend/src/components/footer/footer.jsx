import React from "react";
import "./footer.css";
import Logo from "../../assets/Dresslink logo1.png";

const Footer = () => {
  return (
    <div className="footer">
      <div className="container">
        <div className="footer-details-main">
          <img className="Image" src={Logo} alt="logo"></img>

          <br></br>
          <br></br>
          <div className="footer-details-main-social">
            <img id="image" alt="Facebook"></img>
            <img id="image" alt="Twitter"></img>
            <img id="image" alt="Instagram"></img>
            <img id="image" alt="LinkedIn"></img>
            <img id="image" alt="YouTube"></img>
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
            <li>#</li>
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
            <li>Help cnter</li>
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
