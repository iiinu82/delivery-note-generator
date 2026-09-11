import "./Header.css";
import { Link } from "react-router-dom";

function Header() {
  return (
    <>
      <div className="header">
        <div className="mainTitle">納品書作成アプリ</div>
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
