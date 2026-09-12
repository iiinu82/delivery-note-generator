import "./Header.css";
import { Link } from "react-router-dom";
import logoImage from "../assets/delivery-note-maker.png";

function Header() {
  return (
    <>
      <div className="header">
        <a href="https://delivery-note-generator-cwy6.vercel.app/">
          <div className="mainImage">
            <img src={logoImage} />
          </div>
        </a>

        <div className="tabArea">
          <Link to="/" className="tab">
            納品書作成
          </Link>
          <Link to="/products" className="tab">
            商品管理
          </Link>
          <Link to="/customers" className="tab">
            顧客管理
          </Link>
          <Link to="/pdfs" className="tab">
            PDF管理
          </Link>
        </div>
      </div>
    </>
  );
}

export default Header;
