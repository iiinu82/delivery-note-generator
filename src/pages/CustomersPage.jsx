import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase/config"; // 💡 Firebase接続をインポート
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore"; // 💡 Firestoreの操作関数（一括書き込み用 batch 含む）

import "./CustomersPage.css";
import { CustomerEditModal } from "../components/CustomerEditModal";

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true); // 読み込み中の状態
  // モーダルの状態 ("add" = 新規登録, "edit" = 編集, null = 閉じる)
  const [modalMode, setModalMode] = useState(null);
  // 編集中の顧客IDを保持
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    department: "",
    contactPerson: "",
    postalCode: "", // 💡 郵便番号
    address: "",
    phone: "",
  });

  const codeRef = useRef(null);
  const nameRef = useRef(null);
  const deptRef = useRef(null);
  const personRef = useRef(null);
  const postalCodeRef = useRef(null); // 💡 郵便番号用のRef
  const addressRef = useRef(null);
  const phoneRef = useRef(null);
  const submitButtonRef = useRef(null);

  // CSVインポート用の隠しファイルinputへのRef
  const fileInputRef = useRef(null);

  // 💡 1. 画面を開いたときに、Firebaseから顧客データをすべて取得する
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, "customers"), orderBy("code", "asc"));
        const querySnapshot = await getDocs(q);
        const customerList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id, // FirestoreのドキュメントID
          ...docSnap.data(),
        }));
        setCustomers(customerList);
      } catch (error) {
        console.error("顧客データの取得に失敗しました: ", error);
        alert("顧客データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // ➕ 新規登録モーダルを開く
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      department: "",
      contactPerson: "",
      postalCode: "",
      address: "",
      phone: "",
    });
    setTimeout(() => {
      if (codeRef.current) codeRef.current.focus();
    }, 0);
  };

  // ✏️ 編集モーダルを開く
  const handleOpenEditModal = (customer) => {
    setModalMode("edit");
    setEditingId(customer.id);
    setFormData({
      code: customer.code,
      name: customer.name,
      department: customer.department || "",
      contactPerson: customer.contactPerson || "",
      postalCode: customer.postalCode || "",
      address: customer.address || "",
      phone: customer.phone || "",
    });
    setTimeout(() => {
      if (codeRef.current) codeRef.current.focus();
    }, 0);
  };

  // 💡 2. 登録または更新の保存処理（Firebaseへ書き込み）
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert("顧客コードと企業名は必須です！");
      return;
    }
    try {
      if (modalMode === "add") {
        // --- 新規追加 ---
        const newCustomerData = {
          ...formData,
          contactPerson: formData.contactPerson || "担当者未設定",
        };
        const docRef = await addDoc(
          collection(db, "customers"),
          newCustomerData,
        );
        // ステートを更新して画面に即時反映
        setCustomers((prev) => [
          ...prev,
          { id: docRef.id, ...newCustomerData },
        ]);
      } else if (modalMode === "edit") {
        // --- 既存データの更新 ---
        const customerRef = doc(db, "customers", editingId);
        const updatedData = {
          ...formData,
          contactPerson: formData.contactPerson || "担当者未設定",
        };
        await updateDoc(customerRef, updatedData);
        // ステートを更新して画面に即時反映
        setCustomers((prev) =>
          prev.map((cust) =>
            cust.id === editingId ? { ...cust, ...updatedData } : cust,
          ),
        );
      }
      setModalMode(null);
    } catch (error) {
      console.error("データの保存に失敗しました: ", error);
      alert("データの保存に失敗しました。");
    }
  };

  // 💡 3. 削除機能（Firebaseから削除）
  const handleDelete = async (id, name) => {
    if (window.confirm(`「${name}」のデータを削除しますか？`)) {
      try {
        await deleteDoc(doc(db, "customers", id));
        setCustomers((prev) => prev.filter((cust) => cust.id !== id));
      } catch (error) {
        console.error("データの削除に失敗しました: ", error);
        alert("データの削除に失敗しました。");
      }
    }
  };

  // 📤 4. CSVエクスポート機能
  const handleExportCSV = () => {
    if (customers.length === 0) {
      alert("エクスポートする顧客データがありません。");
      return;
    }
    let csvContent =
      "\uFEFF" +
      "code,name,department,contactPerson,postalCode,address,phone\r\n";
    customers.forEach((cust) => {
      const escapeCsv = (val) => `"${(val || "").replace(/"/g, '""')}"`;
      const row =
        [
          escapeCsv(cust.code),
          escapeCsv(cust.name),
          escapeCsv(cust.department),
          escapeCsv(cust.contactPerson),
          escapeCsv(cust.postalCode),
          escapeCsv(cust.address),
          escapeCsv(cust.phone),
        ].join(",") + "\r\n";
      csvContent += row;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `customers_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 📥 5. CSVインポート機能
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !window.confirm(
        "CSVファイルからデータをインポートすると現在表示されている顧客データは失われます。よろしいですか？",
      )
    ) {
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text
          .split(/\r\n|\n/)
          .filter((line) => line.trim() !== "");
        if (lines.length <= 1) {
          alert("有効なCSVデータが見つかりません。");
          return;
        }
        const newCustomers = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const cols = [];
          let insideQuote = false;
          let currentVal = "";
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"') {
              if (insideQuote && line[charIndex + 1] === '"') {
                currentVal += '"';
                charIndex++;
              } else {
                insideQuote = !insideQuote;
              }
            } else if (char === "," && !insideQuote) {
              cols.push(
                currentVal.trim().replace(/^"|"$/g, "").replace(/""/g, '"'),
              );
              currentVal = "";
            } else {
              currentVal += char;
            }
          }
          cols.push(
            currentVal.trim().replace(/^"|"$/g, "").replace(/""/g, '"'),
          );
          if (cols.length >= 2 && cols[0] && cols[1]) {
            newCustomers.push({
              code: cols[0],
              name: cols[1],
              department: cols[2] || "",
              contactPerson: cols[3] || "担当者未設定",
              postalCode: cols[4] || "",
              address: cols[5] || "",
              phone: cols[6] || "",
            });
          }
        }
        if (newCustomers.length === 0) {
          alert("インポートできる有効な顧客データがありませんでした。");
          return;
        }
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "customers"));
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();
        const freshCustomers = [];
        for (const cust of newCustomers) {
          const docRef = await addDoc(collection(db, "customers"), cust);
          freshCustomers.push({ id: docRef.id, ...cust });
        }
        setCustomers(freshCustomers);
        alert(`${freshCustomers.length}件の顧客データをインポートしました！`);
      } catch (error) {
        console.error("CSVインポートエラー:", error);
        alert("CSVの読み込みまたはインポートに失敗しました。");
      } finally {
        setLoading(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="customerArea">
      <div className="customerHeaderArea">
        <div>
          <h1 className="title" style={{ margin: 0 }}>
            顧客管理
          </h1>
          <p>登録されている顧客一覧 ({customers.length}件)</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="submitbtn btnl" onClick={handleOpenAddModal}>
            + 新規顧客登録
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <div className="importbtnArea">
            <button
              className="openbtn btnm"
              onClick={() => fileInputRef.current.click()}
            >
              CSVからインポート
            </button>
            <button className="openbtn btnm" onClick={handleExportCSV}>
              CSVにエクスポート
            </button>
          </div>
        </div>
      </div>
      <div className="customerListContainer">
        <div className="customerGridTitle">
          <div>顧客コード</div>
          <div>企業名</div>
          <div>部署・担当者</div>
          <div>住所</div>
          <div>電話番号</div>
          <div style={{ textAlign: "center" }}>操作</div>
        </div>
        {loading ? (
          <p style={{ textAlign: "center", padding: "20px" }}>読み込み中...</p>
        ) : customers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>
            顧客が登録されていません
          </p>
        ) : (
          customers.map((customer) => (
            <div className="customerRow" key={customer.id}>
              <div>{customer.code}</div>
              <div className="customerName">{customer.name}</div>
              <div>
                {customer.department} <br />
                <span className="subText">({customer.contactPerson})</span>
              </div>
              <div>
                {customer.postalCode ? `〒${customer.postalCode} ` : ""}
                {customer.address}
              </div>
              <div>{customer.phone}</div>
              <div className="customerActionButtons">
                <button
                  className="editbtn btnm"
                  onClick={() => handleOpenEditModal(customer)}
                >
                  変更
                </button>
                <button
                  className="removebtn btnm"
                  onClick={() => handleDelete(customer.id, customer.name)}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 💡 コンポーネント化した編集モーダルを呼び出し */}
      <CustomerEditModal
        modalMode={modalMode}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        setModalMode={setModalMode}
        codeRef={codeRef}
        nameRef={nameRef}
        deptRef={deptRef}
        personRef={personRef}
        postalCodeRef={postalCodeRef}
        addressRef={addressRef}
        phoneRef={phoneRef}
        submitButtonRef={submitButtonRef}
      />
    </div>
  );
}
