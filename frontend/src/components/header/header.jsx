import React, { useState } from "react";
import "./header.css";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";

const Header = ({ currentUser, setCurrentUser }) => {

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isUser = currentUser && currentUser.email;
  const roles = currentUser?.role || [];

  
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
              <span>{currentUser.fname} {currentUser.lname}</span>
              {open && (
                <div className="options">
                  <Link to="/profile"><span>My Profile</span></Link>
                  <Link to="/messages"><span>Messages</span></Link>
                  {/* Role-Based Options */}
                  {roles.includes("professional") && (
                    <>
                      <Link to="/createProfessioonalgig"><span>Create Gig</span></Link>
                      <Link to="/manageGigs"><span>My Gigs</span></Link>
                      <Link to="/manageAppoints"><span>Manage Appointments</span></Link>
                    </>
                  )}
                  {roles.includes("supplier") && (
                    <>
                      <Link to="/appointments"><span>Appointments</span></Link>
                      <Link to="/createSuppliergig"><span>Create Gig</span></Link>
                      <Link to="/manageGigs"><span>My gigs</span></Link>
                    </>
                  )}
                  {roles.includes("customer") && (
                    <>
                      <Link to="/appointments"><span>Appointments</span></Link>
                      <Link to="/orders"><span>My Orders</span></Link>
                    </>
                  )}
                  <span className="logout" onClick={handleLogout}>Logout</span>
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
