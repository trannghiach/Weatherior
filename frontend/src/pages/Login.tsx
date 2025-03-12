import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../store/slices/authSlice";
import { AppDispatch } from "../store";
import { Link, useLocation, useNavigate } from "react-router-dom";

type LoginInput = {
  email: string;
  password: string;
};

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const redirectUrl = location.state?.redirectUrl || "/";

  const handleLogin = () => {
    dispatch(login(input)).then((result) => {
      if (login.fulfilled.match(result)) {
        navigate(redirectUrl, { replace: true });
      } else if (login.rejected.match(result)) {
        alert(result.payload as string);
      } else {
        alert("Unknown error");
      }
    });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center pb-36">
        <p className="text-3xl font-semibold">Login</p>
        <div className="sm:w-xs mt-5 flex flex-col justify-center items-center px-8 py-6 rounded-2xl shadow-xl shadow-gray-400">
          <p className="me-auto text-sm mb-0.5">Email</p>
          <input
            value={input.email}
            type="text"
            onChange={(e) => setInput({ ...input, email: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md"
          />

          <p className="text-sm me-auto mb-0.5 mt-3">Password</p>
          <input
            value={input.password}
            type="password"
            onChange={(e) => setInput({ ...input, password: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md"
          />
          <p className="text-xs text-cyan-700 mt-2 sm:ms-auto">
            Forgot password?
          </p>
          <button
            onClick={handleLogin}
            disabled={input.email === "" || input.password.length < 8}
            className="mt-4 bg-cyan-700 px-12 text-white p-2 
                        cursor-pointer rounded-md 
                        disabled:opacity-55 disabled:cursor-not-allowed
                        hover:bg-cyan-600 "
          >
            Login
          </button>
          <Link to={"/register"} className="text-xs text-cyan-700 mt-1.5">
            Register
          </Link>
        </div>
      </div>
    </>
  );
};

export default Login;
