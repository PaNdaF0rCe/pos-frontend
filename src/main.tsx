import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MobileBar from "./components/MobileBar";
import { Analytics } from "@vercel/analytics/react";
import POSPage from "./pages/pos";
import OrdersPage from "./pages/orders";
import ManageItemsPage from "./pages/manage-items";
import CategoriesPage from "./pages/categories";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Analytics />
      <main className="p-4 md:p-6 flex gap-4 bg-neutral-100 h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0 pb-16 md:pb-0 h-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<POSPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/admin" element={<ManageItemsPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
          </Routes>
        </div>
        <MobileBar />
      </main>
    </BrowserRouter>
  </React.StrictMode>
);
