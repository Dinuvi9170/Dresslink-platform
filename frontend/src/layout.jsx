import Header from "./components/header/header";
//import NavBar from "./Components/NavBar/NavBar";
import Footer from "./components/footer/footer";
import { Outlet } from "react-router-dom";

import "./App.css";

function Layout({ currentUser, setCurrentUser }) {
  
  return (
    <div>
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser}  />
      <main>

        <section>
          <Outlet />
        </section>

        {/* ------------- Footer -------------------- */}
        <Footer />
        {/* ------------- Footer End -------------------- */}
      </main>
    </div>
  );
}

export default Layout;
