export function CustomerEditModal({
  modalMode,
  formData,
  setFormData,
  handleSubmit,
  setModalMode,
  codeRef,
  nameRef,
  deptRef,
  personRef,
  postalCodeRef,
  addressRef,
  phoneRef,
  submitButtonRef,
}) {
  if (modalMode === null) return null;

  return (
    <div className="input-modal-overlay">
      <div className="invoiceModalContent" style={{ width: "500px" }}>
        <h2>{modalMode === "add" ? "新規顧客登録" : "顧客情報の変更"}</h2>
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
        >
          <div className="formGroup">
            <label className="label">顧客コード：</label>
            <input
              ref={codeRef}
              type="text"
              className="searchInput"
              placeholder="例: C016"
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
            <label className="label">企業名：</label>
            <input
              ref={nameRef}
              type="text"
              className="searchInput"
              placeholder="例: 株式会社サンプル"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  deptRef.current.focus();
                }
              }}
            />
          </div>
          <div className="formGroup" style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label className="label">部署名：</label>
              <input
                ref={deptRef}
                type="text"
                className="searchInput"
                placeholder="例: 営業部"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    personRef.current.focus();
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">担当者名：</label>
              <input
                ref={personRef}
                type="text"
                className="searchInput"
                placeholder="例: 田中 太郎"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPerson: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    postalCodeRef.current.focus();
                  }
                }}
              />
            </div>
          </div>
          <div className="formGroup">
            <label className="label">郵便番号：</label>
            <input
              ref={postalCodeRef}
              type="text"
              className="searchInput"
              placeholder="例: 100-0001"
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addressRef.current.focus();
                }
              }}
            />
          </div>
          <div className="formGroup">
            <label className="label">住所：</label>
            <input
              ref={addressRef}
              type="text"
              className="searchInput"
              placeholder="例: 東京都新宿区 1-1-1"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  phoneRef.current.focus();
                }
              }}
            />
          </div>
          <div className="formGroup">
            <label className="label">電話番号：</label>
            <input
              ref={phoneRef}
              type="text"
              className="searchInput"
              placeholder="例: 03-0000-0000"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
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
            style={{ justifyContent: "flex-end", marginTop: "20px" }}
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
  );
}
