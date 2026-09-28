import { useRegisterSW } from 'virtual:pwa-register/react';

// A new version waits until the coach taps Reload; saved state is in localStorage, so it survives.
export const UpdateBar = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="update" role="status">
      <span>Update ready</span>
      <button className="ghost" onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  );
};
