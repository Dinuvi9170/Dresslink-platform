import React, {useState, useEffect} from "react";
import { Routes, Route } from "react-router-dom";
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

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

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
          
          // Set the current user from token data
          setCurrentUser({
            _id: decodedUser._id,
            fname: decodedUser.fname,
            lname: decodedUser.lname,
            email: decodedUser.email,
            role: decodedUser.role,
            image: decodedUser.image,
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
        <Route path="chatNow/:supplierId" element={<ChatNow />} />
        <Route path="suppliers/:supplierId" element={<Suppliergig />} /> 
        <Route path="createProfessionalgig" element={<CreateProfessional />} />
        <Route path="createSuppliergig" element={<CreateSupplier />} />
        
      </Route>
        
    </Routes>
  );
}
export default App;
