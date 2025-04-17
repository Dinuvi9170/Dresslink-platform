import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./layout";
import Home from "./pages/home/home";
import Professionals from "./pages/professionals/professionals";
import Fabrics from "./pages/fabrics/fabrics";
import Myfit from "./pages/myfit/myfit";


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="professionals" element={<Professionals />} />
        <Route path="fabrics" element={<Fabrics />} /> 
        <Route path="myfit" element={<Myfit />} />
        {/* Add more routes as needed */}
        
      
      </Route>
        
    </Routes>
  );
}
export default App;