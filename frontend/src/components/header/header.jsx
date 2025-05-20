import React, { useState, useEffect } from "react";
import "./header.css";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/logo.png";

const Header = ({ currentUser, setCurrentUser }) => {
  const [gigs, setGigs] = useState([]);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const isUser = currentUser && currentUser.email;
  const roles = currentUser?.role || [];
 
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await axios.get("http://localhost:3000/gigs");
        setGigs(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchGigs();
  }, []);


  const handleSignIn = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.trim().toLowerCase();
      
      // First, check if gigs is an array and has length
      if (Array.isArray(gigs) && gigs.length > 0) {
        // Look for a professional by name
        const foundGig = gigs.find(gig => {
          // Check professional name (safely)
          if (gig?.userId) {
            const fname = gig.userId.fname || "";
            const lname = gig.userId.lname || "";
            const fullName = (fname + " " + lname).toLowerCase();
            return fullName.includes(searchTermLower);
          } 
          // If the user data isn't in userId but directly in 'user'
          else if (gig?.user) {
            const fname = gig.user.fname || "";
            const lname = gig.user.lname || "";
            const fullName = (fname + " " + lname).toLowerCase();
            return fullName.includes(searchTermLower);
          }
          return false;
        });

        // If a match is found, navigate directly to the gig page
        if (foundGig) {
          console.log("Found gig by professional name:", foundGig);
          navigate(`/gigs/${foundGig._id}`);
          return;
        }

        // If no professional name match, look for a gig by title or description
        const foundGigByTitleOrDesc = gigs.find(gig => {
          // Check gig title
          const titleMatch = (gig?.title || "").toLowerCase();
          // Check description
          const descMatch = (gig?.description || gig?.desc || "").toLowerCase();
          
          return titleMatch.includes(searchTermLower) || descMatch.includes(searchTermLower);
        });

        if (foundGigByTitleOrDesc) {
          console.log("Found gig by title/desc:", foundGigByTitleOrDesc);
          
          navigate(`/gigs/${foundGigByTitleOrDesc._id}`);
          return;
        }
      }
      
      // If no direct match found, search via API
      const searchPath = '/professionals';
      const searchParams = new URLSearchParams();
      searchParams.append('search', searchTerm.trim());
      navigate(`${searchPath}?${searchParams.toString()}`);
    }
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
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            />
          </div>
          <button className="search_button" onClick= {handleSearch}>Search</button>
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
                      <Link to="/orders"><span>Orders</span></Link>
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
                      <Link to="/myOrder"><span>My Orders</span></Link>
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
