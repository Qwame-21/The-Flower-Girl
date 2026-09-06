import { readAdminData, writeAdminData } from '../api/adminStore';

export default function ContentPage({
  activeTab,
  adminData,
  settingsMessage,
  setSettingsMessage,
  setSelectedItem,
}) {
  return (
    <>
      <header className="admin-page-heading">
        <div>
          <small>Storefront · {activeTab}</small>
          <h2>Content</h2>
          <p>Edit the customer-facing message for this section and keep changes in the shared storefront store.</p>
        </div>
      </header>
      <form
        className="content-editor"
        key={activeTab}
        onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const field = activeTab === 'Homepage' ? 'homepageFeature' : activeTab === 'Policies' ? 'orderPolicy' : 'announcement';
          writeAdminData({ ...readAdminData(), content: { ...readAdminData().content, [field]: form.get('content') } });
          setSettingsMessage(`${activeTab} content published to the storefront.`);
        }}
      >
        <small>{activeTab} editor</small>
        <h3>
          {activeTab === 'Homepage'
            ? 'Featured collection message'
            : activeTab === 'Policies'
            ? 'Customer order policy'
            : 'Store announcement'}
        </h3>
        <textarea
          name="content"
          required
          defaultValue={
            activeTab === 'Homepage'
              ? adminData.content.homepageFeature
              : activeTab === 'Policies'
              ? adminData.content.orderPolicy
              : adminData.content.announcement
          }
        />
        <div>
          <button type="submit">Save and publish</button>
          <button
            type="button"
            onClick={event => {
              const value = event.currentTarget.form.elements.content.value;
              setSelectedItem({
                type: 'content-preview',
                title: `${activeTab} preview`,
                status: 'Unpublished preview',
                detail: value,
              });
            }}
          >
            Preview
          </button>
        </div>
        {settingsMessage && <p>{settingsMessage}</p>}
      </form>
    </>
  );
}
