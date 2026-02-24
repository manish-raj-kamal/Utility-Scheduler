import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-head">
        <h1>Profile</h1>
        <p className="muted">Your trust and usage profile.</p>
      </div>

      <div className="panel profile-grid">
        <div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <p>Flat: {user?.flatNumber}</p>
          <p>Role: {user?.role}</p>
        </div>
        <div>
          <p><strong>Trust Score:</strong> {user?.trustScore ?? 0}</p>
          <p><strong>Total Usage Hours:</strong> {user?.totalUsageHours ?? 0}</p>
          <p><strong>Penalty Count:</strong> {user?.penaltyCount ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
