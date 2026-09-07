// TODO: Design ShopControlPage — collections manager, featured products, staff cart
export default function ShopControlPage({
  activeTab,
  adminData,
  products,
  setCollectionFormOpen,
  setEditingProduct,
  setImagePreview,
  setSecondaryImagePreview,
  setProductFormOpen,
  setSelectedItem,
  staffCart,
  setStaffCart,
  setStaffCartOpen,
}) {
  return (
    <div className="admin-page-stub">
      <h2>Shop</h2>
      <p>Collections, featured products and staff ordering will be built here.</p>
    </div>
  );
}
