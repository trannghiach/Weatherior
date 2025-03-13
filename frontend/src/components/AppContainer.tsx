
import { Navigate, Outlet } from "react-router-dom"
import useAuth from "../hooks/useAuth"

const AppContainer = () => {
  const { user, isLoading } = useAuth()
  return (
    <>
        {isLoading ? (
            <div>Loading...</div>
        ) : user ? (
            <Outlet />
        ) : (
            <Navigate 
              to="/login"
              replace
              state={{ redirectUrl: window.location.pathname }} />
        )}
    </>
  )
}

export default AppContainer