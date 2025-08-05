import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../UI/Home.css";
import { API_URL } from '../Api'; // Import API_URL from Api.jsx

export default function Home({ onLogout }) {
    // console.log("Home component rendered",API_URL);
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [alertMessage, setAlertMessage] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [chatHistory, setChatHistory] = useState([]);



    const token = localStorage.getItem("access"); // get JWT access token

    const placeholderPrompts = [
        "Generate 10 exam questions...",
        "Summarize this book...",
        "Create MCQs from chapter 3...",
        "What is this book about...?",
        "Generate fill-in-the-blank questions...",
        "List definitions from the book..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholderPrompts.length);
        }, 2000); // change every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchChatHistory = async (bookId) => {
        try {
            const res = await axios.get(`${API_URL}api/chats_history/${bookId}/chat/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChatHistory(res.data.messages || []);
        } catch (err) {
            console.error("Failed to load chat history", err);
            setChatHistory([]);
        }
    };

    const handleClearChat = async () => {
        if (!selectedBook) return;

        const confirmClear = window.confirm("Are you sure you want to clear this chat?");
        if (!confirmClear) return;

        try {
            await axios.delete(`${API_URL}api/chats_history/${selectedBook.id}/chat/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChatHistory([]);
        } catch (err) {
            alert("Failed to clear chat.");
        }
    };





    const dropdownRef = useRef();

    // Close dropdown on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, []);


    const fetchBooks = async () => {
        try {
            const res = await axios.get(`${API_URL}api/books/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setBooks(res.data);
            if (res.data.length && !selectedBook) {
                setSelectedBook(res.data[0]);
                fetchChatHistory(res.data[0].id);  // ✅ load chat
            }
        } catch (err) {
            console.error("Failed to fetch books:", err);
        }
    };


    useEffect(() => {
        fetchBooks();
    }, []);


    const handleUpload = async () => {
        if (!title.trim()) return;

        if (!file && !websiteUrl.trim()) {
            alert("Upload a file OR provide a website URL.");
            return;
        }

        const fd = new FormData();
        fd.append("title", title);
        if (file) fd.append("file", file);
        if (websiteUrl.trim()) fd.append("website_url", websiteUrl.trim());

        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}api/books/`, fd, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            await fetchBooks();
            setAlertMessage("✅ Book uploaded successfully!");
            setTimeout(() => setAlertMessage(""), 3000);

        } catch {
            alert("Upload failed");
        } finally {
            setUploading(false);
            setShowModal(false);
            setFile(null);
            setWebsiteUrl("");
            setTitle("");
        }
    };



    const handleDeleteBook = async (bookId) => {
        const confirmed = window.confirm("Are you sure you want to delete this book? This action cannot be undone.");
        if (!confirmed) return;

        try {
            // ✅ Delete
            await axios.delete(`${API_URL}api/books/?book_id=${bookId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            await fetchBooks();
            if (selectedBook?.id === bookId) {
                setSelectedBook(null);
            }
            setAlertMessage("✅ Book Deleted successfully!");
            setTimeout(() => setAlertMessage(""), 3000);
        } catch {
            alert("Delete failed");
        }
    };


    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || !selectedBook) {
            return alert("Select a book & enter a prompt");
        }

        const newHistory = [...chatHistory, { role: "user", text: prompt }];
        setChatHistory(newHistory); // optimistic update
        setPrompt("");
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}api/generate-questions/`, {
                prompt,
                book_id: selectedBook.id,
                history: newHistory,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // const answer = res.data.answer || "⚠️ No answer generated.";
            const answer = res.data.answer || "⚠️ No answer generated.";
            const citations = res.data.citations || [];

            setChatHistory(prev => [...prev, { role: "ai", text: answer, citations }]);
            // setChatHistory(prev => [...prev, { role: "ai", text: answer }]);
            setQuestions([]);  // clear old question style output
        } catch {
            alert("Generation failed");
            setChatHistory(prev => [...prev, { role: "ai", text: "⚠️ Error generating response." }]);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="home-container">
            <div style={{ display: "flex", justifyContent: "flex-end", position: "fixed", top: 10, right: 20 }}>
                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </div>
            <div className="card">
                <h1 className="card-title">📘 SmartCorp AI – RAG <br></br> Ask Your data Anything</h1>

                {/* Top Section */}
                <div className="top-row">
                    <button
                        className="btn upload-btn"
                        onClick={() => {
                            setShowModal(true)
                            setFile({});        // 👈 force file tab to be default
                            setWebsiteUrl("");
                        }
                        }
                        disabled={uploading}
                    >
                        {uploading ? "Uploading…" : "Upload"}
                    </button>

                    <div className="custom-select" ref={dropdownRef}>
                        <div
                            className="select-display"
                            onClick={() => setDropdownOpen((o) => !o)}
                        >
                            {selectedBook ? selectedBook.title : "Select a book"}
                            <span className="arrow">{dropdownOpen ? "▲" : "▼"}</span>
                        </div>
                        {dropdownOpen && (
                            <ul className="select-options">
                                {books.map((b) => (
                                    <li key={b.id} className="option">
                                        <span
                                            onClick={() => {
                                                setSelectedBook(b);
                                                fetchChatHistory(b.id);  // ✅ load previous chat
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            {b.title}
                                        </span>
                                        <button
                                            className="delete-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteBook(b.id);
                                            }}
                                        >
                                            X
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Results */}
                {chatHistory.length > 0 && (
                    <div className="chat-box">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2>🧠 Conversation</h2>
                            </div>
                            <button className="btn reset-btn" onClick={() => handleClearChat()}>
                                🔄 Reset Conversation
                            </button>
                        </div>
                        <div className="chat-messages">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`chat-msg ${msg.role}`}>
                                    <strong>{msg.role === "user" ? "🧑 You" : "🤖 AI"}:</strong> {msg.text}
                                    {msg.role === "ai" && msg.citations && msg.citations.length > 0 && (
                                        <div className="citations">
                                            <strong>📚 Citations:</strong>
                                            <ul>
                                                {msg.citations.map((chunk, idx) => (
                                                    <li key={idx}>🔎 <i>{chunk}</i></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                            ))}
                        </div>
                    </div>
                )}
                {/* Prompt Form */}
                <form onSubmit={handleGenerate} className="form">
                    <textarea
                        className="prompt-input"
                        rows={3}
                        placeholder={placeholderPrompts[placeholderIndex]}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />

                    <button
                        type="submit"
                        className="btn generate-btn"
                        disabled={loading}
                    >
                        {loading ? "Generating…" : "Generate"}
                    </button>
                </form>


            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3 className="modal-title">Upload New</h3>

                        {/* TABS */}
                        <div className="modal-tabs">
                            <button
                                className={`tab-btn ${file ? "active" : ""}`}
                                onClick={() => {
                                    setWebsiteUrl("");
                                    setFile({}); // Dummy object to force tab switch
                                }}
                            >
                                📁 File Upload
                            </button>
                            <button
                                className={`tab-btn ${websiteUrl ? "active" : ""}`}
                                onClick={() => {
                                    setFile(null);
                                    setWebsiteUrl("https://"); // prefill
                                }}
                            >
                                🌐 Website URL
                            </button>
                        </div>

                        {/* FORM */}
                        <div className="modal-form">
                            <label className="modal-label">📘 Title</label>
                            <input
                                type="text"
                                placeholder="Enter book title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="modal-input"
                            />

                            {/* FILE UPLOAD TAB */}
                            {file && (
                                <>
                                    <label className="modal-label">Select a file (.pdf, .docx, .csv, .xlsx)</label>
                                    <div className="modal-input modal-file">
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.xlsx,.xls,.csv"
                                            onChange={(e) => setFile(e.target.files[0])}
                                        />
                                    </div>
                                </>
                            )}

                            {/* WEBSITE TAB */}
                            {websiteUrl && (
                                <>
                                    <label className="modal-label">Enter website URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://example.com"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="modal-input"
                                    />
                                </>
                            )}

                            <div className="modal-buttons">
                                <button
                                    className="btn modal-upload-btn"
                                    onClick={handleUpload}
                                    disabled={uploading || (!file && !websiteUrl) || !title}
                                >
                                    {uploading ? "Uploading…" : "Upload"}
                                </button>
                                <button
                                    className="btn cancel-btn"
                                    onClick={() => {
                                        setShowModal(false);
                                        setFile(null);
                                        setWebsiteUrl("");
                                        setTitle("");
                                    }}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {alertMessage && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                    zIndex: 1000,
                    transition: "opacity 0.3s ease"
                }}>
                    {alertMessage}
                </div>
            )}


        </div>
    );
}
