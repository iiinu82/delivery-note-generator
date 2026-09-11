// ... existing code ...
import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase/config"; // 💡 Firebase接続をインポート
import { collection, getDocs, query, orderBy } from "firebase/firestore"; // 💡 Firestoreの取得関数
export function ProductSelectArea({
  productInputRef,
  invoiceItems,
  onAddIem,
  onRemoveItem,
  onResetItems,
}) {
  const [products, setProducts] = useState([]); // 💡 Firebaseから取得する商品リスト
  const [productCodeInput, setProductCodeInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // 各ドロップダウンアイテムのDOMを参照するref配列
  const itemRefs = useRef([]);
  // 数量入力欄のref
  const quantityInputRef = useRef(null);
  // 💡 1. 画面を開いたときに、Firebaseから商品データを取得する
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 💡 商品コード（code）の昇順で並び替えるクエリを作成
        const q = query(collection(db, "products"), orderBy("code", "asc"));
        const querySnapshot = await getDocs(q);

        const productList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("商品データの取得に失敗しました: ", error);
      }
    };
    fetchProducts();
  }, []);
  // 💡 2. 取得した商品リストから検索ワードで絞り込む
  const filteredProducts = products.filter((prod) => {
    if (!productCodeInput.trim()) return false;
    const term = productCodeInput.toLowerCase();
    return (
      prod.code.toLowerCase().includes(term) ||
      prod.name.toLowerCase().includes(term)
    );
  });
  // 選択インデックスが変わったとき、見える位置まで自動スクロール
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);
  // 商品を決定（選択）したときの処理 ➡ 数量入力へカーソルを飛ばす
  const handleSelectProduct = (product) => {
    const targetProduct =
      product ||
      products.find(
        (p) =>
          p.code.toLowerCase() === productCodeInput.toLowerCase() ||
          p.name === productCodeInput,
      );
    if (!targetProduct) {
      alert("該当する商品が見つかりません！");
      return;
    }
    setSelectedProduct(targetProduct);
    setProductCodeInput(targetProduct.name);
    setIsProductDropdownOpen(false);
    setSelectedIndex(-1);
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }, 0);
  };
  // 数量を入れて明細に登録する処理
  const handleRegisterItem = () => {
    if (!selectedProduct) {
      alert("商品が選択されていません！");
      return;
    }
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("有効な数量を入力してください！");
      return;
    }
    const newItem = {
      id: crypto.randomUUID(),
      code: selectedProduct.code,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: qty,
      amount: selectedProduct.price * qty,
    };
    onAddIem(newItem);
    // 状態をリセット
    setSelectedProduct(null);
    setProductCodeInput("");
    setQuantityInput(1);
    // 登録完了した瞬間、確実に商品入力欄へフォーカスを戻す
    setTimeout(() => {
      if (productInputRef.current) {
        productInputRef.current.focus();
      }
    }, 0);
  };
  // 商品コード入力欄でのキーボード操作
  const handleProductKeyDown = (e) => {
    if (!isProductDropdownOpen || filteredProducts.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectProduct();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredProducts.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
        handleSelectProduct(filteredProducts[selectedIndex]);
      } else if (filteredProducts.length === 1) {
        handleSelectProduct(filteredProducts[0]);
      } else {
        handleSelectProduct();
      }
    } else if (e.key === "Escape") {
      setIsProductDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };
  // 数量入力欄でのキーボード操作
  const handleQuantityKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setQuantityInput((prev) => Number(prev) + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setQuantityInput((prev) => (prev > 1 ? Number(prev) - 1 : 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleRegisterItem();
    }
  };
  return (
    <div className="productsContainer">
      <div className="productSelectTopArea">
        <h2>2. 商品・選択</h2>
        <button type="button" className="removebtn btnm" onClick={onResetItems}>
          登録商品を全て削除
        </button>
      </div>
      <div
        className="searchBoxWrapper"
        style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
      >
        <div style={{ flex: 2, position: "relative" }}>
          <label className="label">商品コード または 商品名：</label>
          <input
            ref={productInputRef}
            type="text"
            className="searchInput"
            placeholder="例: P001 (下キーで候補選択)"
            value={productCodeInput}
            onChange={(e) => {
              setProductCodeInput(e.target.value);
              setIsProductDropdownOpen(true);
              setSelectedIndex(-1);
              setSelectedProduct(null);
            }}
            onFocus={() => setIsProductDropdownOpen(true)}
            onKeyDown={handleProductKeyDown}
            disabled={selectedProduct !== null}
          />
          {/* 予測候補リスト */}
          {isProductDropdownOpen &&
            !selectedProduct &&
            filteredProducts.length > 0 && (
              <div className="dropdownList">
                {filteredProducts.map((prod, index) => (
                  <div
                    key={prod.id}
                    ref={(el) => (itemRefs.current[index] = el)}
                    className={`dropdownItem ${
                      index === selectedIndex ? "activeItem" : ""
                    }`}
                    onClick={() => handleSelectProduct(prod)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="dropdownCode">[{prod.code}]</span>
                    <span className="dropdownName">{prod.name}</span>
                    <span className="dropdownDep">
                      ¥{prod.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">数量 (上下で増減)：</label>
          <input
            ref={quantityInputRef}
            type="number"
            className="searchInput"
            min={1}
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            onKeyDown={handleQuantityKeyDown}
          />
        </div>
        <div>
          <button
            type="button"
            className="submitbtn btnl"
            onClick={handleRegisterItem}
          >
            登録
          </button>
        </div>
      </div>
      {selectedProduct && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "13px",
            color: "#78a6be",
            fontWeight: "bold",
          }}
        >
          選択中: {selectedProduct.name} （単価: ¥
          {selectedProduct.price.toLocaleString()}）
          ※数量を入れてEnterまたは登録ボタン
        </p>
      )}
      {/* 追加された明細のリスト（テーブル） */}
      <div style={{ marginTop: "24px" }}>
        <h3>明細一覧</h3>
        {invoiceItems.length === 0 ? (
          <p className="noSelectionText">※ 商品が追加されていません</p>
        ) : (
          <div style={{ marginTop: "12px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 60px 90px 60px",
                fontWeight: "bold",
                padding: "8px 0",
                borderBottom: "2px solid #ccc",
                fontSize: "13px",
              }}
            >
              <div>コード</div>
              <div>商品名</div>
              <div>数量</div>
              <div>小計</div>
              <div>操作</div>
            </div>
            {invoiceItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 60px 90px 60px",
                  padding: "10px 0",
                  borderBottom: "1px solid #f0f0f0",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <div>{item.code}</div>
                <div>{item.name}</div>
                <div>{item.quantity}</div>
                <div>¥{item.amount.toLocaleString()}</div>
                <div>
                  <button
                    className="removebtn btns"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: "16px",
                textAlign: "right",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              合計金額: ¥
              {invoiceItems
                .reduce((sum, item) => sum + item.amount, 0)
                .toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
