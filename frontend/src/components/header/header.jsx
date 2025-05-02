import React, { useState } from "react";
import "./header.css";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";

const Header = ({ currentUser, setCurrentUser }) => {

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isUser = currentUser && currentUser.email;
  
  const handleSignIn = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="header">
      <div className="container">
        {/* Left Logo */}
        <div className="header__left">
          <Link to="/" className="link1">
            <img src={Logo} className="logo" alt="Logo" />
          </Link>
        </div>

        {/* Search bar */}
        <div className="search">
          <div className="search_input">
            <input type="text" placeholder="Search..." />
          </div>
          <button className="search_button">Search</button>
        </div>

        {/* Right-side links */}
        <div className="header__links">
          <Link to="/professionals" className="link">Professionals</Link>
          <Link to="/fabrics" className="link">Fabrics & Materials</Link>
          <Link to="/myfit" className="link">Preview My Fit</Link>

          {!isUser ? (
            <>
              <Link to="/becomeSeller" className="link">Become a Seller</Link>
              <a href="#" className="link" onClick={handleSignIn}>Sign In</a>
            </>
          ) : (
            <div className="user" onClick={() => setOpen(!open)}>
              <img
                src={currentUser.image}
                alt="User"
                className="header__user-icon"
              />
              <span>{currentUser.fname}</span>
              <span>{currentUser.lname}</span>
              {open && (
                <div className="options">
                  <span>My Products</span>
                  <Link to= "/becomeSeller"><span>Become Seller</span></Link>
                  <span onClick={handleLogout}>Logout</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
