import { chars } from "../json/chars";
import Card from "../components/Card"

const Sandbox: React.FC = () => {
  return (
    <>
      <div className="flex flex-wrap gap-12 justify-center items-center h-screen bg-amber-50">
        {chars.map((char, index) => (
          <Card key={index} name={char.name} imgUrl={char.imgSrc} />
        ))}
      </div>
    </>
  )
}

export default Sandbox