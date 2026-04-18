import { Button } from "react-bootstrap";
import { BsGithub } from "react-icons/bs";

function Home(){
    
    // const handleStart = () => {
        // 
        // 
    // }
    return (
        <div className="flex items-center h-screen">
            <div className="block ml-[20px]">
                <h1>僕が考えた<br />最強のエンジニアたち</h1>
                <Button className="bg-black border-white text-white">
                    <div className="flex items-center text-xl">
                        <BsGithub className="mr-2" />GitHubで始める
                    </div>
                </Button>
            </div>
        </div>
    );
}

export default Home;