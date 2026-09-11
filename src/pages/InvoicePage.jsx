import { useEffect, useRef, useState } from "react";
import "./InvoicePage.css";
import { CustomerSelect } from "../components/CustomerSelect";
import { ProductSelectArea } from "../components/ProductSelect";
import { InvoiceModal } from "../components/InvoiceModal";

export function InvoicePage() {
  const productInputRef = useRef(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);

    // 💡 顧客が決定したら、少しだけ遅延（または即座に）させて商品入力欄へカーソルを移動
    setTimeout(() => {
      if (productInputRef.current) {
        productInputRef.current.focus();
      }
    }, 0);
  };

  // 商品セレクトエリアのリセットボタン
  const handleResetItems = () => {
    if (invoiceItems.length === 0) return;
    if (
      window.confirm("追加された明細をすべてリセットしてもよろしいですか？")
    ) {
      setInvoiceItems([]); // 明細のステートを空の配列にする
    }
  };

  // 明細の追加
  const handleAddItem = (newItem) => {
    setInvoiceItems((prev) => [...prev, newItem]);
  };

  // 明細の削除
  const handleRemoveItem = (id) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 印刷を実行する関数
  const handlePrint = () => {
    window.print();
  };

  // 1. 顧客データの永続化
  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    const saved = localStorage.getItem("invoice_customer");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("invoice_customer", JSON.stringify(selectedCustomer));
  }, [selectedCustomer]);

  // 2. 明細リストの永続化
  const [invoiceItems, setInvoiceItems] = useState(() => {
    const saved = localStorage.getItem("invoice_items");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("invoice_items", JSON.stringify(invoiceItems));
  }, [invoiceItems]);

  return (
    <div className="invoiceBody">
      <div className="invoiceTopArea">
        <p className="title">納品書作成</p>{" "}
        {/* 💡 納品書プレビューを開くボタン */}
        <button
          className="openbtn btnl"
          onClick={() => setIsInvoiceModalOpen(true)}
          disabled={!selectedCustomer || invoiceItems.length === 0} // 顧客未選択または明細0件の時は押せない
        >
          納品書PDFプレビュー作成
        </button>
      </div>
      <div className="invoiceLayout">
        {/* 左側：顧客選択エリア */}
        <CustomerSelect
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
        />

        {/* 右側：商品選択・明細エリア*/}
        <ProductSelectArea
          productInputRef={productInputRef}
          invoiceItems={invoiceItems}
          onAddIem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onResetItems={handleResetItems}
        />
      </div>
      {/* 💡 納品書モーダルの配置 */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onPrint={handlePrint}
        selectedCustomer={selectedCustomer}
        invoiceItems={invoiceItems}
      />
    </div>
  );
}
