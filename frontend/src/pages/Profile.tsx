import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  console.log("User Data:", user); // Kiểm tra dữ liệu user

  if (!user) {
    return <div>Loading...</div>;
  }

  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate("/login", {
        replace: true,
      });
    }
  })

  const handleSignOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    signOut();
  };

  const { email, verified, createdAt, playerName } = user;
  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1>Profile Page</h1>
        <h2>{playerName}</h2>
        <h2>{email}</h2>
        <h2>{verified}</h2>
        <h2>{createdAt}</h2>
        <Link to="/sandbox"
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >Sandbox</Link>
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleSignOut}>
          Logout
        </button>
      </div>
    </>
  );
};

export default Profile;