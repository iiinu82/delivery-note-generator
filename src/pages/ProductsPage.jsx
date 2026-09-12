import React, { useState, useRef, useEffect } from "react";
import { db } from "../firebase/config"; // 💡 Firebaseの接続をインポート
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore"; // 💡 Firestoreの操作関数（一括書き込み用 batch 含む）
import "./ProductsPage.css";

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // 読み込み中の状態
  // モーダルの状態 ("add" = 新規登録, "edit" = 編集, null = 閉じる)
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  // フォームの入力値の状態
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    price: "",
  });

  // 1フォーム連続入力用のRef
  const codeRef = useRef(null);
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const submitButtonRef = useRef(null);

  // CSVインポート用の隠しファイルinputへのRef
  const fileInputRef = useRef(null);

  // 💡 1. 画面を開いたときに、Firebaseから商品データをすべて取得する
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 💡 取得する際に 'code' の昇順（asc）で並び替えるクエリを作成
        const q = query(collection(db, "products"), orderBy("code", "asc"));
        const querySnapshot = await getDocs(q);

        const productList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("商品データの取得に失敗しました: ", error);
        alert("商品データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ➕ 新規登録モーダルを開く
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({ code: "", name: "", price: "" });
    setTimeout(() => {
      if (codeRef.current) codeRef.current.focus();
    }, 0);
  };

  // ✏️ 編集モーダルを開く
  const handleOpenEditModal = (product) => {
    setModalMode("edit");
    setEditingId(product.id);
    setFormData({
      code: product.code,
      name: product.name,
      price: product.price,
    });
    setTimeout(() => {
      if (codeRef.current) codeRef.current.focus();
    }, 0);
  };

  // 💡 2. 登録または更新の保存処理（Firebaseへ書き込み）
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || formData.price === "") {
      alert("すべての項目を入力してください！");
      return;
    }
    try {
      if (modalMode === "add") {
        // --- 新規追加 ---
        const newProductData = {
          code: formData.code,
          name: formData.name,
          price: Number(formData.price),
        };
        const docRef = await addDoc(collection(db, "products"), newProductData);
        // ステートを更新して画面に即時反映
        setProducts((prev) => [...prev, { id: docRef.id, ...newProductData }]);
      } else if (modalMode === "edit") {
        // --- 既存データの更新 ---
        const productRef = doc(db, "products", editingId);
        const updatedData = {
          code: formData.code,
          name: formData.name,
          price: Number(formData.price),
        };
        await updateDoc(productRef, updatedData);
        // ステートを更新して画面に即時反映
        setProducts((prev) =>
          prev.map((prod) =>
            prod.id === editingId ? { ...prod, ...updatedData } : prod,
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
        await deleteDoc(doc(db, "products", id));
        setProducts((prev) => prev.filter((prod) => prod.id !== id));
      } catch (error) {
        console.error("データの削除に失敗しました: ", error);
        alert("データの削除に失敗しました。");
      }
    }
  };

  // 📤 4. CSVエクスポート機能
  const handleExportCSV = () => {
    if (products.length === 0) {
      alert("エクスポートする商品データがありません。");
      return;
    }

    // ヘッダー行
    let csvContent = "\uFEFF" + "code,name,price\r\n";

    // データ行
    products.forEach((prod) => {
      // カンマやダブルクォーテーションが含まれる場合の対策としてダブルクォーテーションで囲む
      const escapedName = `"${(prod.name || "").replace(/"/g, '""')}"`;
      const row = `${prod.code},${escapedName},${prod.price}\r\n`;
      csvContent += row;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `products_${new Date().toISOString().slice(0, 10)}.csv`,
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
        "CSVファイルからデータをインポートすると現在表示されている商品データは失われます。よろしいですか？",
      )
    ) {
      e.target.value = ""; // 選択解除
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

        const newProducts = [];
        // 1行目はヘッダー想定なのでスキップ (i = 1)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // CSVのカンマ区切り解析（簡易版：ダブルクォーテーション考慮）
          const matches =
            line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");

          // 単純なsplitでパースする場合のフォールバック
          const cols = line
            .split(",")
            .map((val) => val.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

          if (cols.length >= 3) {
            const code = cols[0];
            const name = cols[1];
            const price = Number(cols[2]);

            if (code && name && !isNaN(price)) {
              newProducts.push({ code, name, price });
            }
          }
        }

        if (newProducts.length === 0) {
          alert("インポートできる有効な商品データがありませんでした。");
          return;
        }

        setLoading(true);

        // 既存のFirestore上のデータを全削除してから一括追加、または上書き保存
        // ここでは安全のため、既存コレクションのドキュメントをすべて削除して入れ替える処理
        const querySnapshot = await getDocs(collection(db, "products"));
        const batch = writeBatch(db);

        querySnapshot.docs.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();

        // 新しいデータを追加
        const freshProducts = [];
        for (const prod of newProducts) {
          const docRef = await addDoc(collection(db, "products"), prod);
          freshProducts.push({ id: docRef.id, ...prod });
        }

        setProducts(freshProducts);
        alert(`${freshProducts.length件} の商品をインポートしました！`);
      } catch (error) {
        console.error("CSVインポートエラー:", error);
        alert("CSVの読み込みまたはインポートに失敗しました。");
      } finally {
        setLoading(false);
        e.target.value = ""; // ファイル選択をリセット
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="productsArea">
      {/* ヘッダーエリア */}
      <div className="productHeaderArea">
        <div>
          <h1 className="title" style={{ margin: 0 }}>
            商品管理
          </h1>
          <p>登録されている商品一覧 ({products.length}件)</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="submitbtn btnl" onClick={handleOpenAddModal}>
            + 新規商品登録
          </button>

          {/* CSVインポート・エクスポートボタン */}
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
      {/* リスト表示テーブル */}
      <div className="list">
        <div className="gridTitle">
          <div>商品コード</div>
          <div>商品名</div>
          <div>単価 (円)</div>
          <div style={{ textAlign: "center" }}>操作</div>
        </div>
        {loading ? (
          <p style={{ textAlign: "center", padding: "20px" }}>読み込み中...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>
            商品が登録されていません
          </p>
        ) : (
          products.map((product) => (
            <div className="product" key={product.id}>
              <div>{product.code}</div>
              <div>{product.name}</div>
              <div>¥{product.price.toLocaleString()}</div>
              {/* 変更・削除ボタン */}
              <div className="productActionButtons">
                <button
                  className="editbtn btnm"
                  onClick={() => handleOpenEditModal(product)}
                >
                  変更
                </button>
                <button
                  className="removebtn btnm"
                  onClick={() => handleDelete(product.id, product.name)}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* 新規登録・編集共用モーダル */}
      {modalMode !== null && (
        <div className="input-modal-overlay" onClick={() => setModalMode(null)}>
          <div
            className="invoiceModalContent"
            style={{ width: "450px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{modalMode === "add" ? "新規商品登録" : "商品情報の変更"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
            >
              <div className="formGroup">
                <label className="label">商品コード：</label>
                <input
                  ref={codeRef}
                  type="text"
                  className="searchInput"
                  placeholder="例: P031"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      nameRef.current.focus();
                    }
                  }}
                />
              </div>
              <div className="formGroup">
                <label className="label">商品名：</label>
                <input
                  ref={nameRef}
                  type="text"
                  className="searchInput"
                  placeholder="例: ホッチキス（大型）"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      priceRef.current.focus();
                    }
                  }}
                />
              </div>
              <div className="formGroup">
                <label className="label">単価 (円)：</label>
                <input
                  ref={priceRef}
                  type="number"
                  className="searchInput"
                  placeholder="例: 1200"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitButtonRef.current.focus();
                    }
                  }}
                />
              </div>
              <div
                className="modalButtons"
                style={{ justifyContent: "flex-end", marginTop: "30px" }}
              >
                <button
                  type="button"
                  className="editbtn btnl"
                  onClick={() => setModalMode(null)}
                >
                  キャンセル
                </button>
                <button
                  ref={submitButtonRef}
                  type="submit"
                  className="submitbtn btnl"
                >
                  {modalMode === "add" ? "登録" : "更新"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
