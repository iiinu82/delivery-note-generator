import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase/config"; // 💡 Firebase接続をインポート
import { collection, getDocs, query, orderBy } from "firebase/firestore"; // 💡 Firestoreの取得関数

export function CustomerSelect({ selectedCustomer, onSelectCustomer }) {
  const [customers, setCustomers] = useState([]); // 💡 Firebaseから取得する顧客リスト
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 各ドロップダウンアイテムのDOM要素を参照するためのref配列
  const itemRefs = useRef([]);

  // 💡 1. 画面を開いたときに、Firebaseから顧客データを取得する
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // 💡 顧客コード（code）の昇順で並び替えるクエリを作成
        const q = query(collection(db, "customers"), orderBy("code", "asc"));
        const querySnapshot = await getDocs(q);

        const customerList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setCustomers(customerList);
      } catch (error) {
        console.error("顧客データの取得に失敗しました: ", error);
      }
    };
    fetchCustomers();
  }, []);

  // 💡 2. 取得した顧客リストから検索ワードで絞り込む
  const filteredCustomers = customers.filter((cust) => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      cust.code.toLowerCase().includes(term) ||
      cust.name.toLowerCase().includes(term) ||
      (cust.phone && cust.phone.includes(term))
    );
  });

  // 選択インデックスが変わったとき、そのアイテムが見える位置まで自動スクロールさせる
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || filteredCustomers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCustomers.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCustomers.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredCustomers.length) {
        handleSelectCustomer(filteredCustomers[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="customerContainer">
      <h2>1. 顧客選択</h2>
      <div className="searchBoxWrapper">
        <label className="label">企業名 または 顧客コードで検索：</label>
        <input
          type="text"
          className="searchInput"
          placeholder="例: A商事 または C001 (下キーで候補へ移動)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isDropdownOpen && filteredCustomers.length > 0 && (
          <div className="dropdownList">
            {filteredCustomers.map((cust, index) => (
              <div
                key={cust.id}
                ref={(el) => (itemRefs.current[index] = el)}
                className={`dropdownItem ${
                  index === selectedIndex ? "activeItem" : ""
                }`}
                onClick={() => handleSelectCustomer(cust)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="dropdownCode">[{cust.code}]</span>
                <span className="dropdownName">{cust.name}</span>
                <span className="dropdownDep">({cust.department})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer ? (
        <div className="selectedCustomerCard">
          <h3>選択中の宛先</h3>
          <p className="targetName">
            {selectedCustomer.name}
            {"　"}
            {selectedCustomer.department} 御中
          </p>
          <p>ご担当：{selectedCustomer.contactPerson} 様</p>
          <p>
            〒{selectedCustomer.postalCode} {selectedCustomer.address}
          </p>
          <p>TEL: {selectedCustomer.phone}</p>
          <button
            className="clearbtn"
            onClick={() => {
              onSelectCustomer(null);
              setSearchTerm("");
            }}
          >
            選択を解除
          </button>
        </div>
      ) : (
        <p className="noSelectionText">※ 顧客が選択されていません</p>
      )}
    </div>
  );
}
