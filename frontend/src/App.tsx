import { Route, Routes, useNavigate } from "react-router-dom"
import AppContainer from './components/AppContainer';
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { setNavigate } from "./lib/navigate";
import Sandbox from "./pages/Sandbox";

function App() {
  const navigate = useNavigate();
  setNavigate(navigate);

  return (
    <>
      <Routes>
        <Route path="/" element={<AppContainer />}>
          <Route index element={<Profile />} />
          <Route path="/sandbox" element={<Sandbox />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  )
}

export default App
