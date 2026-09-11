import "./App.css";
import Header from "./components/Header";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InvoicePage } from "./pages/InvoicePage";
import { ProductsPage } from "./pages/ProductsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { PdfsPage } from "./pages/PdfsPage";

function App() {
  return (
    <>
      <BrowserRouter>
        {/* 共通のナビゲーション */}
        <Header />

        {/* URLによって切り替わるページエリア */}
        <Routes>
          <Route path="/" element={<InvoicePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/pdfs" element={<PdfsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
