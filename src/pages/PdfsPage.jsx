import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import "./PdfsPage.css";
import { InvoiceModal } from "../components/InvoiceModal";

export function PdfsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✏️ 編集モーダル用の状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editDateStr, setEditDateStr] = useState("");

  // 🖨️ 印刷プレビューモーダル用の状態
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const invoiceList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoices(invoiceList);
    } catch (error) {
      console.error("納品書データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // 🗑️ 削除処理
  const handleDelete = async (id) => {
    if (!window.confirm("この納品書データを削除してもよろしいですか？")) return;
    try {
      await deleteDoc(doc(db, "invoices", id));
      setInvoices(invoices.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error("削除に失敗しました:", error);
      alert("削除に失敗しました。");
    }
  };

  // 📝 「変更」ボタン押下
  const handleOpenEditModal = (inv) => {
    setEditingInvoice(JSON.parse(JSON.stringify(inv)));

    if (inv.createdAt?.toDate) {
      const date = inv.createdAt.toDate();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setEditDateStr(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setEditDateStr("");
    }

    setIsEditModalOpen(true);
  };

  // 🖨️ 「PDF作成（印刷）」ボタン押下
  const handleOpenPrintModal = (inv) => {
    setPrintingInvoice(inv);
    setIsPrintModalOpen(true);
  };

  // 🔢 モーダル内：商品の数量変更
  const handleQuantityChange = (index, newQty) => {
    const qty = parseInt(newQty) || 0;
    const updatedItems = [...editingInvoice.items];
    updatedItems[index].quantity = qty;
    updatedItems[index].amount = updatedItems[index].price * qty;

    const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);

    setEditingInvoice({
      ...editingInvoice,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  // ❌ モーダル内：商品を明細から削除
  const handleRemoveItem = (index) => {
    const updatedItems = editingInvoice.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);

    setEditingInvoice({
      ...editingInvoice,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  // 💾 変更を保存
  const handleSaveEdit = async () => {
    try {
      const docRef = doc(db, "invoices", editingInvoice.id);

      const newTimestamp = editDateStr
        ? Timestamp.fromDate(new Date(editDateStr))
        : editingInvoice.createdAt;

      await updateDoc(docRef, {
        createdAt: newTimestamp,
        items: editingInvoice.items,
        totalAmount: editingInvoice.totalAmount,
        itemCount: editingInvoice.items.length,
      });

      setIsEditModalOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error("更新に失敗しました:", error);
      alert("更新に失敗しました。");
    }
  };

  if (loading) {
    return <div className="pdfsContainer">読み込み中...</div>;
  }

  return (
    <div className="pdfsContainer">
      <div className="pdfsInner">
        <h2 className="title">PDF管理 (作成済み納品書一覧)</h2>
        {invoices.length === 0 ? (
          <p className="emptyMessage">保存された納品書はありません。</p>
        ) : (
          <table className="pdfsTable">
            <thead>
              <tr>
                <th>発行日時</th>
                <th>顧客名</th>
                <th className="alignCenter">商品の種類数</th>
                <th className="alignRight">合計金額</th>
                <th className="alignCenter">操作</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const dateStr = inv.createdAt?.toDate
                  ? inv.createdAt.toDate().toLocaleString("ja-JP")
                  : "日時不明";
                const customerName = inv.customer?.name || "（宛先未選択）";
                const itemCount = inv.items ? inv.items.length : 0;
                const subtotal =
                  inv.items && inv.items.length > 0
                    ? inv.items.reduce(
                        (sum, item) => sum + (item.amount || 0),
                        0,
                      )
                    : inv.totalAmount || 0;

                return (
                  <tr key={inv.id} className="pdfsTableRow">
                    <td>{dateStr}</td>
                    <td>{customerName}</td>
                    <td className="alignCenter">{itemCount}種類</td>
                    <td className="alignRight">¥{subtotal.toLocaleString()}</td>
                    <td className="alignCenter">
                      <div className="actionButtons">
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="editbtn btnm"
                        >
                          変更
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="removebtn btnm"
                        >
                          削除
                        </button>
                        <button
                          onClick={() => handleOpenPrintModal(inv)}
                          className="openbtn btnm"
                        >
                          PDF作成（印刷）
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 💡 編集モーダル */}
      {isEditModalOpen && editingInvoice && (
        <div
          className="modalOverlay"
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingInvoice(null);
          }}
        >
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h3>納品書の内容変更</h3>

            <div className="formGroup">
              <label className="formLabel">発行日時:</label>
              <input
                type="datetime-local"
                value={editDateStr}
                onChange={(e) => setEditDateStr(e.target.value)}
                className="formInput"
              />
            </div>

            <p className="customerInfo">
              <strong>顧客名:</strong>{" "}
              {editingInvoice.customer?.name || "（未選択）"}
            </p>

            <h4>明細一覧</h4>
            <table className="editItemsTable">
              <thead>
                <tr>
                  <th>商品名</th>
                  <th>単価</th>
                  <th>数量</th>
                  <th>小計</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {editingInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>¥{item.price.toLocaleString()}</td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        className="qtyInput"
                        min="1"
                      />
                    </td>
                    <td>¥{item.amount.toLocaleString()}</td>
                    <td>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="removebtn btns"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modalTotal">
              合計金額: ¥{editingInvoice.totalAmount.toLocaleString()}
            </div>

            <div className="modalActions">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingInvoice(null);
                }}
                className="editbtn btnm"
              >
                キャンセル
              </button>
              <button onClick={handleSaveEdit} className="submitbtn btnm">
                変更を保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isPrintModalOpen && printingInvoice && (
        <InvoiceModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintingInvoice(null);
          }}
          onPrint={() => window.print()}
          selectedCustomer={printingInvoice.customer}
          invoiceItems={printingInvoice.items}
          invoiceDate={printingInvoice.createdAt} // 💡 記録された日時を渡す
          onInvoiceSaved={fetchInvoices}
        />
      )}
    </div>
  );
}
