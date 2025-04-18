import React from "react";
import "./login.css";

const SignIn = () => {
  return (
    <div className="signin-container">
      <h3>Sign In to DressLink</h3>
      <form>
        <div>
          <label htmlFor="email">Email</label><br />
          <input type="email" id="email" name="email" placeholder="Email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label><br />
          <input type="password" id="password" name="password" placeholder="Password" required />
        </div>
        <div>
            <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
            <a href="/register" className="register">Create new account</a>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default SignIn;
