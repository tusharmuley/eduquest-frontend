import { useState, useEffect } from "react";
import Home from "./pages/Home";
import LoginSignup from "./components/LoginSignup";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (token) setIsAuthenticated(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setIsAuthenticated(false);
    };

    return (
        <div>
            {isAuthenticated ? (
                <Home onLogout={handleLogout} />
            ) : (
                <LoginSignup onAuthSuccess={() => setIsAuthenticated(true)} />
            )}
        </div>
    );
}

export default App;
