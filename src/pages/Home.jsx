import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../UI/Home.css";
import { API_URL } from '../Api'; // Import API_URL from Api.jsx

export default function Home( {onLogout} ) {
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
            }
        } catch (err) {
            console.error("Failed to fetch books:", err);
        }
    };


    useEffect(() => {
        fetchBooks();
    }, []);

    const handleUpload = async () => {
        if (!file || !title.trim() || !subject.trim()) return;

        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title);
        fd.append("subject", subject);

        setUploading(true);
        try {
            // ✅ Upload
            await axios.post(`${API_URL}api/books/`, fd, {
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
            setTitle("");
            setSubject("");
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
        setLoading(true);
        axios
            .post(`${API_URL}api/generate-questions/`, {
                prompt,
                book_id: selectedBook.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
                const { questions, answer } = res.data;

                let finalList = [];

                if (questions) {
                    finalList = Array.isArray(questions)
                        ? questions
                        : questions.split(/\n+/).filter((q) => q.trim());
                } else if (answer) {
                    // Split answer string by numbered pattern (1. ... 2. ... etc)
                    finalList = answer.split(/\n?\s*\d+\.\s+/)
                        .filter((q) => q.trim()) // Remove empty strings
                        .map((q, i) => `${q.trim()}`);
                }

                if (finalList.length === 0) {
                    finalList = ["⚠️ No output generated."];
                }

                setQuestions(finalList);
            })
            .catch(() => alert("Generation failed"))
            .finally(() => setLoading(false));
    };


    return (
        <div className="home-container">
            <div style={{ display: "flex", justifyContent: "flex-end", position: "fixed", top: 10, right: 20 }}>
                    <button className="logout-btn" onClick={onLogout}>
                        Logout
                    </button>
            </div>
            <div className="card">
                <h1 className="card-title">📘 AI-EduQuest <br></br> Ask Your Book Anything</h1>

                {/* Top Section */}
                <div className="top-row">
                    <button
                        className="btn upload-btn"
                        onClick={() => setShowModal(true)}
                        disabled={uploading}
                    >
                        {uploading ? "Uploading…" : "Upload Book"}
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

                {/* Prompt Form */}
                <form onSubmit={handleGenerate} className="form">
                    <textarea
                        className="prompt-input"
                        rows={6}
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

                {/* Results */}
                {questions.length > 0 && (
                    <div className="results">
                        <h2>{questions.length === 1 ? "Answer" : "Generated Questions"}</h2>
                        {questions.length === 1 ? (
                            <p>{questions[0]}</p>
                        ) : (
                            <ol className="question-list" >
                                {questions.map((q, i) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ol>
                        )}
                    </div>
                )}

            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3 className="modal-title">Upload New Book (.pdf file)</h3>
                        <div className="modal-form">
                            <input
                                type="text"
                                placeholder="Book Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="modal-input"
                            />
                            <input
                                type="text"
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="modal-input"
                            />
                            <div className="modal-input modal-file">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </div>
                            <div className="modal-buttons">
                                <button
                                    className="btn modal-upload-btn"
                                    onClick={handleUpload}
                                    disabled={uploading || !file || !title || !subject}
                                >
                                    {uploading ? "Uploading…" : "Upload"}
                                </button>
                                <button
                                    className="btn cancel-btn"
                                    onClick={() => setShowModal(false)}
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
