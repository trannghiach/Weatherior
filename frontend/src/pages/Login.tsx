import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, LoginInput } from "../lib/api";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const redirectUrl = location.state?.redirectUrl || "/";

  const {
    mutate: signIn,
    isPending,
    isError,
    error,
  } = useMutation({
      mutationFn: login,
      onSuccess: () => {
        navigate(redirectUrl, {
          replace: true,
        });
      }
  });

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center pb-36">
        <p className="text-3xl font-semibold">Login</p>
        <div className="sm:w-xs mt-5 flex flex-col justify-center items-center px-8 py-6 rounded-2xl shadow-xl shadow-gray-400">
          { isError && <p className="text-red-500 text-sm"> {error?.message || "Unknown Error"} </p> }
          <p className="me-auto text-sm mb-0.5 mt-3">Email</p>
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
          {!isPending && (
            <button
              onClick={() => signIn(input)}
              disabled={input.email === "" || input.password.length < 8}
              className="mt-4 bg-cyan-700 px-12 text-white p-2 
                          cursor-pointer rounded-md 
                          disabled:opacity-55 disabled:cursor-not-allowed
                          hover:bg-cyan-600 "
            >
              Login
            </button>
          )}
          <Link to={"/register"} className="text-xs text-cyan-700 mt-1.5">
            Register
          </Link>
        </div>
      </div>
    </>
  );
};

export default Login;
