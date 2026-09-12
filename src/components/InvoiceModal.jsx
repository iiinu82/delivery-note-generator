import "./InvoiceModal.css";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function InvoiceModal({
  isOpen,
  onClose,
  onPrint,
  selectedCustomer,
  invoiceItems,
  invoiceDate,
}) {
  if (!isOpen) return null;

  // 合計金額（税抜）の計算
  const subtotalAmount = invoiceItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  // 💡 消費税（10%）と税込金額の計算（関数は増やさずシンプルに算出）
  const taxAmount = Math.floor(subtotalAmount * 0.1);
  const totalAmountWithTax = subtotalAmount + taxAmount;

  // 表示する日付の決定
  let displayDate;
  if (invoiceDate?.toDate) {
    displayDate = invoiceDate.toDate().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else if (invoiceDate) {
    displayDate = invoiceDate;
  } else {
    displayDate = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const handleSaveAndPrint = async () => {
    try {
      const invoiceData = {
        customer: selectedCustomer,
        items: invoiceItems,
        totalAmount: totalAmountWithTax, // 保存データとしては税込合計を保持
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "invoices"), invoiceData);
      console.log("Firebaseへの保存が完了しました！");
      onPrint();
      onClose();
    } catch (error) {
      console.error("保存に失敗しました: ", error);
      alert("保存に失敗しました。");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invoiceModalContent" onClick={(e) => e.stopPropagation()}>
        {/* 🖨️ 印刷対象エリア（納品書シート） */}
        <div className="invoiceSheet">
          <h1 className="invoiceTitle">納 品 書</h1>

          <div className="invoiceHeaderInfo">
            <div>
              <p className="invoiceCustomerName">
                {selectedCustomer
                  ? `${selectedCustomer.name} 御中`
                  : "（宛先未選択）"}
              </p>
              {selectedCustomer && (
                <>
                  <p className="invoiceAddress">
                    〒{selectedCustomer.postalCode} {selectedCustomer.address}
                  </p>
                  <p className="invoiceContact">
                    担当: {selectedCustomer.contactPerson} 様
                  </p>
                </>
              )}
            </div>
            <div className="invoiceIssuerInfo">
              <p>発行日: {displayDate}</p>
              <p className="issuerName">株式会社 ニイガタ商事</p>
              <p className="issuerAddress">新潟県新潟市中央区女池 1-2-3</p>
            </div>
          </div>

          {/* 明細テーブル */}
          <table className="invoiceTable">
            <thead>
              <tr>
                <th className="thName">商品名</th>
                <th className="thPrice">単価</th>
                <th className="thQty">数量</th>
                <th className="thSubtotal">小計</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="emptyMessage">
                    明細がありません
                  </td>
                </tr>
              ) : (
                invoiceItems.map((item) => (
                  <tr key={item.id} className="invoiceTableRow">
                    <td>{item.name}</td>
                    <td className="alignRight">
                      ¥{item.price.toLocaleString()}
                    </td>
                    <td className="alignRight">{item.quantity}</td>
                    <td className="alignRight">
                      ¥{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 💡 実務的な金額内訳と、大きく目立つご請求金額（税込） */}
          <div className="invoiceTotalSection">
            <div className="syoukei">
              小計（税抜）: ¥{subtotalAmount.toLocaleString()}
            </div>
            <div className="syouhizei">
              消費税（10%）: ¥{taxAmount.toLocaleString()}
            </div>
            <div className="goukei">
              ご請求金額（税込）: ¥{totalAmountWithTax.toLocaleString()}
            </div>
          </div>
        </div>

        {/* モーダル下部の操作ボタン */}
        <div className="modalButtons no-print">
          <button className="removebtn btnl" onClick={onClose}>
            キャンセル
          </button>
          <button className="openbtn btnl" onClick={handleSaveAndPrint}>
            PDF作成（印刷）
          </button>
        </div>
      </div>
    </div>
  );
}
