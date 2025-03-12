import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../store/slices/authSlice";
import { AppDispatch } from "../store";
import { Link, useNavigate } from "react-router-dom";

type RegisterInput = {
  email: string;
  password: string;
  confirmPassword: string;
  playerName: string;
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = useState<RegisterInput>({
    email: "",
    password: "",
    confirmPassword: "",
    playerName: "",
  });

  const handleLogin = () => {
    dispatch(register(input)).then((result) => {
      if (register.fulfilled.match(result)) {
        navigate("/", { replace: true });
      } else if (register.rejected.match(result)) {
        alert(result.payload as string);
      } else {
        alert("Unknown error");
      }
    });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center pb-36">
        <p className="text-3xl font-semibold">Register</p>
        <div className="w-xs mt-5 flex flex-col justify-center items-center px-8 py-6 rounded-2xl shadow-xl shadow-gray-400">
          <p className="text-sm me-auto mb-0.5">Email</p>
          <input
            value={input.email}
            type="text"
            onChange={(e) => setInput({ ...input, email: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md"
          />

          <p className="text-sm me-auto mb-0.5 mt-3">Player Name</p>
          <input
            value={input.playerName}
            type="text"
            onChange={(e) => setInput({ ...input, playerName: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md"
          />

          <p className="text-sm me-auto mb-0.5 mt-3">Password</p>
          <input
            value={input.password}
            type="password"
            onChange={(e) => setInput({ ...input, password: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded-md"
          />

          <p className="text-sm me-auto mb-0.5 mt-3">Confirm Password</p>
          <input
            value={input.confirmPassword}
            type="password"
            onChange={(e) =>
              setInput({ ...input, confirmPassword: e.target.value })
            }
            className="w-full border border-gray-300 p-2 rounded-md"
          />

          <p className="text-xs text-cyan-700 mt-2 sm:ms-auto">
            Forgot password?
          </p>

          <button
            onClick={handleLogin}
            disabled={
              input.email === "" ||
              input.playerName === "" ||
              input.password.length < 8 ||
              input.password !== input.confirmPassword
            }
            className="mt-4 bg-cyan-700 px-12 text-white p-2 
                        cursor-pointer rounded-md 
                        disabled:opacity-55 disabled:cursor-not-allowed
                        hover:bg-cyan-600 "
          >
            Register
          </button>
          <Link to={"/login"} className="text-xs text-cyan-700 mt-1.5">
            Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default Register;
