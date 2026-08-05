import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get("http://localhost:5000/api/health")
      .then((res) => setMessage(res.data.message))
      .catch(() => setMessage("Backend not reachable"));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Time Capsule</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;