import React, { useState, useEffect } from "react";
import "./header.css";
import { Link } from "react-router-dom";
import Logo from "../../assets/Dresslink logo1.png";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isUser, setIsUser] = useState(false);

  // Simulated current user object (toggle these to simulate login state)
  const Currentuser = {
    username: "John Doe",
    Seller: true,
  };

  useEffect(() => {
    if (Currentuser && Currentuser.username) {
      setIsUser(true);
      setIsSeller(Currentuser.Seller === true);
    }
  }, []);

  // Navigate to sign-in page if user isn't signed in yet
  const handleSignIn = (e) => {
    e.preventDefault();
    navigate("/signin");
  };

  return (
    <div className="header">
      <div className="container">
        <div className="header__logo">
          <Link to="/" className="link">
            <img src={Logo} alt="Logo" />
          </Link>
        </div>

        <div className="header__links">
          <Link to="/professionals" className="link">
            Professionals
          </Link>
          <Link to="/fabrics" className="link">
            Fabrics & Materials
          </Link>
          <Link to="/myfit" className="link">
            Preview My Fit  
          </Link>  

          {/* Show Become a Seller and Sign In only when user is not signed in */}
          {!isUser && (
            <>
              <a href="#become-seller">Become a Seller</a>
              <a
                href="#signin"
                onClick={(e) => {
                  handleSignIn;
                }}
              >
                Sign In
              </a>
              
            </>
          )}

          {/* If user is signed in */}
          {isUser && (
            <div className="user" onClick={() => setOpen(!open)}>
              <img
                src="./src/assets/user.png"
                alt="User"
                className="header__user-icon"
              />
              <span>{Currentuser.username}</span>
              {open && (
                <div className="options">
                  <span>My Products</span>
                  <span onClick={() => setIsUser(false)}>Logout</span>
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
