import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { ToastProvider } from "./context/ToastContext";
import Footer from "./components/Footer";

import AuctionList from "./pages/AuctionList";
import AuctionDetail from "./pages/AuctionDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailSent from "./pages/VerifyEmailSent";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateAuction from "./pages/CreateAuction";
import MyAuctions from "./pages/MyAuctions";
import MyBids from "./pages/MyBids";
import SellerProfile from "./pages/SellerProfile";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import BuyerProfile from "./pages/BuyerProfile";
import WalletTopup from "./pages/WalletTopup";
import Terms from "./pages/Terms";
import PaymentCallback from "./pages/PaymentCallback";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                  element={<AuctionList />} />
          <Route path="/auction/:id"       element={<AuctionDetail />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/verify-email"      element={<VerifyEmail />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />
          <Route path="/create"            element={<CreateAuction />} />
          <Route path="/my-auctions"       element={<MyAuctions />} />
          <Route path="/my-bids"           element={<MyBids />} />
          <Route path="/seller/:id"        element={<SellerProfile />} />
          <Route path="/buyer/:id"         element={<BuyerProfile />} />
          <Route path="/profile"           element={<Profile />} />
          <Route path="/wallet"              element={<WalletTopup />} />
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/admin"             element={<Admin />} />
          <Route path="*"                  element={<NotFound />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;