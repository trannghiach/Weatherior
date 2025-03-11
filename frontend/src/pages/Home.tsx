import { useDispatch, useSelector } from 'react-redux';
import { login, register, logout } from '../store/slices/authSlice';
import { useUserProfile } from '../hooks/useUserData';
import { RootState, AppDispatch } from '../store';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, loading, error } = useSelector((state: RootState) => state.auth);

  const { data: profile } = useUserProfile();

  const handleLogin = () => {
    dispatch(login({ email: 'user@example.com', password: 'password' }));
  };

  const handleRegister = () => {
    dispatch(
      register({
        email: 'user@example.com',
        password: 'password',
        name: 'Test User',
      })
    );
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <h1>Welcome, {user?.name}</h1>
          <div>Profile: {JSON.stringify(profile)}</div>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </>
      )}
    </div>
  );
};

export default Home;