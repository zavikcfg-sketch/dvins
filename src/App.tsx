import { useEffect } from "react";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Admin from "./pages/Admin";
import { useRoute } from "./router";
import { startSync } from "./store/sync";

export default function App() {
  const route = useRoute();

  useEffect(() => {
    startSync(); // подтягиваем данные с сервера + периодический опрос
  }, []);

  // Admin has its own full-screen chrome (no public nav)
  if (route === "admin") {
    return (
      <div className="min-h-screen bg-[#faf8f5] font-sans text-[#1e293b] antialiased">
        <Admin />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] font-sans text-[#1e293b] antialiased">
      <Nav route={route} />
      {route === "rooms" ? <Rooms /> : <Home />}
    </div>
  );
}
