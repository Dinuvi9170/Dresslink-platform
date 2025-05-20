import React, {useState, useEffect} from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Layout from "./layout";
import Home from "./pages/home/home";
import Professionals from "./pages/professionals/professionals";
import Fabrics from "./pages/fabrics/fabrics";
import Myfit from "./pages/myfit/myfit";
import BecomeSeller from "./pages/becomeSeller/becomeSeller";
import Login from "./pages/login/login"
import Gigs from "./pages/gigs/gigs";
import Register from "./pages/register/register";
import ScheduleAppoint from "./pages/scheduleAppoint/scheduleAppoint";
import ChatNow from "./pages/chatNow/chatNow";
import Suppliergig from "./pages/suppliergig/suppliergig";
import CreateProfessional from "./pages/createProfessionalgig/createProfessional";
import CreateSupplier from "./pages/createSuppliergig/createSupplier";
import {jwtDecode} from "jwt-decode";
import ManageGigs from "./pages/manageGigs/manageGigs";
import EditSupplier from "./pages/editSupplierGig/editSupplier";
import EditProf from "./pages/editProfessionalGig/editprof";
import Profile from "./pages/profile/profile";
import ManageAppoints from "./pages/manageAppoints/manageAppoints";
import Appointments from "./pages/appointments/appointments";
import Messages from "./pages/messages/messages";
import HireForm from "./pages/hireMe/hireMe";
import Orders from "./pages/orders/orders";
import MyOrder from "./pages/myOrder/myOrder";

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  

  // Restore user from token when app loads or refreshes
  useEffect(() => {
    const restoreUser = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode the JWT token
          const decodedUser = jwtDecode(token);
          
          // Check if token has expired
          const currentTime = Date.now() / 1000;
          if (decodedUser.exp && decodedUser.exp < currentTime) {
            // Token has expired, remove it
            localStorage.removeItem('token');
            return;
          }
          // Add timestamp to image URL to prevent caching
          const imageUrl = decodedUser.image ? 
            `${decodedUser.image.split('?')[0]}?t=${Date.now()}` : 
            decodedUser.image;
        
          
          // Set the current user from token data
          setCurrentUser({
            _id: decodedUser._id,
            fname: decodedUser.fname,
            lname: decodedUser.lname,
            email: decodedUser.email,
            role: decodedUser.role,
            image: imageUrl,
            address: decodedUser.address
          });
        } catch (error) {
          console.error("Error restoring user session:", error);
          localStorage.removeItem('token');
        }
      }
    };
    
    restoreUser();
  }, []);

  useEffect(() => {
    // Skip automatic scrolling to top on page changes
    window.history.scrollRestoration = "manual";
    const savedScrollPosition = sessionStorage.getItem(`scroll-${location.pathname}`);
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
    } else {
      // For new page visits, scroll to top
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Save scroll position when navigating between pages
  useEffect(() => {
    const handleSaveScroll = () => {
      sessionStorage.setItem(`scroll-${location.pathname}`, window.scrollY.toString());
    };

    // Save scroll position when user navigates within the app
    return () => {
      handleSaveScroll();
    };
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Layout currentUser={currentUser} setCurrentUser={setCurrentUser} />}>
        <Route index element={<Home />} />
        <Route path="professionals" element={<Professionals />} />        
        <Route path="fabrics" element={<Fabrics />} />
        <Route path="myfit" element={<Myfit />} />
        <Route path="becomeSeller" element={<BecomeSeller />} />
        <Route path="login" element={<Login setCurrentUser={setCurrentUser}/>}/>
        <Route path="gigs/:gigId" element={<Gigs />} />
        <Route path="register" element={<Register />} />
        <Route path="scheduleAppoint/:gigId" element={<ScheduleAppoint />} />
        <Route path="chatNow/:professionalId" element={<ChatNow />} />
        <Route path="chatNow/supplier/:supplierId" element={<ChatNow />} />
        <Route path="suppliers/:supplierId" element={<Suppliergig />} />
        <Route path="createProfessioonalgig" element={<CreateProfessional />} />
        <Route path="createSuppliergig" element={<CreateSupplier />} />
        <Route path="manageGigs" element={<ManageGigs />} />
        <Route path="editSupplierGig/:profileId" element={<EditSupplier />} />
        <Route path="editProfessionalGig/:profileId" element={<EditProf/>} />
        <Route path="profile" element={<Profile currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="manageAppoints" element={<ManageAppoints />} /> 
        <Route path="appointments" element={<Appointments />} /> 
        <Route path="messages" element={<Messages/>} />
        <Route path="hireMe/:gigId" element={<HireForm currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
        <Route path="orders" element={<Orders />} />
        <Route path="myOrder" element={<MyOrder/>} />
      </Route>
        
    </Routes>
  );
}
export default App;
