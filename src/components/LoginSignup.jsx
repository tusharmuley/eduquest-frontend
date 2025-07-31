// src/components/LoginSignup.js
import { useState } from "react";
import axios from "axios";
import "../UI/Home.css"; // reuse styles from Home
import { API_URL } from '../Api'; // Import API_URL from Api.jsx

export default function LoginSignup({ onAuthSuccess }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isSignup) {
                // Step 1: Sign up
                await axios.post(`${API_URL}auth_api/signup/`, {
                    username,
                    email,
                    password,
                });

                // Step 2: Auto-login
                const loginRes = await axios.post(`${API_URL}auth_api/login/`, {
                    username,
                    password,
                });

                const { access, refresh } = loginRes.data;
                localStorage.setItem("access", access);
                localStorage.setItem("refresh", refresh);
                onAuthSuccess();
            } else {
                // Just login
                const loginRes = await axios.post(`${API_URL}auth_api/login/`, {
                    username,
                    password,
                });

                const { access, refresh } = loginRes.data;
                localStorage.setItem("access", access);
                localStorage.setItem("refresh", refresh);
                onAuthSuccess();
            }
        } catch (err) {
            console.error(err);
            setError("❌ Authentication failed");
        }
    };

    return (
        <div className="home-container">
            <div className="modal">
                <h2 className="modal-title">{isSignup ? "Sign Up" : "Login"} to EduQuest</h2>

                <form onSubmit={handleSubmit} className="modal-form">
                    <input
                        type="text"
                        className="modal-input"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    {isSignup && (
                        <input
                            type="email"
                            className="modal-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="password"
                        className="modal-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="modal-upload-btn">
                        {isSignup ? "Sign Up" : "Login"}
                    </button>
                </form>

                {error && <p className="error-msg" style={{ color: "red", marginTop: "10px" }}>{error}</p>}

                <p
                    onClick={() =>{
                                    setIsSignup(!isSignup);
                                    setUsername("");
                                    setEmail("");
                                    setPassword("");
                                }
                            }
                    style={{
                        marginTop: "14px",
                        textAlign: "center",
                        color: "#6366f1",
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                >
                    {isSignup ? "Already have an account? Login" : "Don't have an account? Signup"}
                </p>
            </div>
        </div>
    );
}
