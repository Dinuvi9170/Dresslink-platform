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
        <Route path="gigs/:gigId" element={<Gigs />} />
        <Route path="register" element={<Register />} />
        <Route path="scheduleAppoint/:gigId" element={<ScheduleAppoint />} />
        <Route path="chatNow/:professionalId" element={<ChatNow />} />
        <Route path="chat/:professionalId" element={<ChatNow />} />
        <Route path="suppliers/:supplierId" element={<Suppliergig />} />  
      </Route>
        
    </Routes>
  );
}
export default App;