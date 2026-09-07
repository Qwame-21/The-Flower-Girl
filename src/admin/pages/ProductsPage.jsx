// TODO: Design ProductsPage — product table, visibility toggle, promotions, add/edit/delete
export default function ProductsPage({
  activeTab,
  productQuery,
  setProductQuery,
  filteredProducts,
  setSelectedItem,
  setEditingProduct,
  setImagePreview,
  setSecondaryImagePreview,
  setProductFormOpen,
  setPendingDelete,
  adminData,
}) {
  return (
    <div className="admin-page-stub">
      <h2>Products</h2>
      <p>Product catalogue, pricing, inventory and promotions will be built here.</p>
    </div>
  );
}
