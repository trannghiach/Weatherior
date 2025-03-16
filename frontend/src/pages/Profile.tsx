import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";


const Profile: React.FC = () => {
  const { user } = useAuth();

  console.log("User Data:", user); // Kiểm tra dữ liệu user

  if (!user) {
    return <div>Loading...</div>;
  }

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
      </div>
    </>
  );
};

export default Profile;