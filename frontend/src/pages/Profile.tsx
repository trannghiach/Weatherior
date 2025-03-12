import { useUserProfile } from "../hooks/useUserData";

const Profile: React.FC = () => {
  const { data: user } = useUserProfile();
  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <h1>Profile Page</h1>
        <h2>{user?.username}</h2>
        <h2>{user?.email}</h2>
        <h2>{user?.verified}</h2>
      </div>
    </>
  );
};

export default Profile;