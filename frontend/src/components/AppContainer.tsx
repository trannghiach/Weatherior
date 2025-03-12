import { useSelector } from "react-redux"
import { Navigate, Outlet } from "react-router-dom"
import { RootState } from "../store";

const AppContainer = () => {
  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  return (
    <>
        {loading && <div>Loading...</div>}
        {error && <div>{error}</div>}
        {!user ? <Navigate to="/login" replace state={{ redirectUrl: window.location.pathname }} />
         : (
          <Outlet />
         )}
    </>
  )
}

export default AppContainer