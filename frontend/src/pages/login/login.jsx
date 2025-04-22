import React, {useState} from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./login.css";

const SignIn = ({setCurrentUser}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/user/login", {
        email,
        password,
      });
      const { token, user } = response.data;

      // Store token in localStorage;
      localStorage.setItem("token",token);

      // Make sure user object includes image from the response
      const userWithImage = {
        ...user,
        image: user.image // Default image if none provided
      };
      console.log(user.fname, user.lname, user.email, user.image, user.role);

      // Set user in global state
      setCurrentUser(userWithImage);

      alert("Login successful!");
      navigate("/"); 

    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid email or password. Please try again.");
    }
  }

  return (
    <div className="signin-container">
      <h3>Sign In to DressLink</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label><br />
          <input type="email" id="email" name="email" placeholder="Email"  value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password</label><br />
          <input type="password" id="password" name="password" placeholder="Password"  value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
            <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
            <Link to="/register" className="register">Create new account</Link>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default SignIn;
