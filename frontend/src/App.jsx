import React, {useState, useEffect} from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
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


const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Routes>
      <Route path="/" element={<Layout currentUser={currentUser} setCurrentUser={setCurrentUser} />}>
        <Route index element={<Home />} />
        <Route path="professionals" element={<Professionals />} />
        <Route path="fabrics" element={<Fabrics />} /> 
        <Route path="myfit" element={<Myfit />} />
        <Route path="becomeSeller" element={<BecomeSeller />} />
        <Route path="login" element={<Login setCurrentUser={setCurrentUser}/>}/>
        <Route path="gigs" element={<Gigs />} />
        <Route path="register" element={<Register />} />
        {/* Add more routes as needed */}
               
          
      </Route>
        
    </Routes>
  );
}
export default App;