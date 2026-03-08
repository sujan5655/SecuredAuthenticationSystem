import { BrowserRouter, Routes, Route } from "react-router-dom";
import Captcha from "./pages/Captcha";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/Resetpassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/captcha" element={<Captcha />} />
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/" element={<Homepage />} />
         <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
  <Route path="/dashboard" element={<Dashboard/>} />
  <Route path="/admin-dashboard" element={<AdminDashboard/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
