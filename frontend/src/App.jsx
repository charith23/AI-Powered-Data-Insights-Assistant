import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function App() {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hello! Ask me about your data 📊" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [
          ...prev,
          { 
            type: "bot", 
            text: `Generated SQL: ${data.sql}`,
            tableData: data.data
          }
        ]);
      } else {
        setMessages(prev => [...prev, { type: "bot", text: `Error ❌: ${data.error}` }]);
      }

    } catch (err) {
      setMessages(prev => [...prev, { type: "bot", text: "Network Error ❌ Make sure backend is running." }]);
    }
  };

  // 🛠️ Helper function to safely extract chart keys
  const getChartKeys = (data) => {
    if (!data || data.length === 0) return null;
    const keys = Object.keys(data[0]);
    if (keys.length < 2) return null; // We need at least 2 columns to make a chart
    return { xAxis: keys[0], yAxis: keys[1] };
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto", fontFamily: "sans-serif" }}>
      <h2>AI Data Assistant 🚀</h2>

      <div style={{
        border: "1px solid #ccc",
        padding: "20px",
        height: "600px",
        overflowY: "auto",
        marginBottom: "10px",
        borderRadius: "8px",
        backgroundColor: "#fafafa"
      }}>
        {messages.map((msg, index) => {
          const chartKeys = getChartKeys(msg.tableData);

          return (
            <div key={index} style={{ textAlign: msg.type === "user" ? "right" : "left", margin: "15px 0" }}>
              
              {/* Chat Bubble */}
              {msg.text && (
                <div style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: msg.type === "user" ? "#007bff" : "#e9ecef",
                  color: msg.type === "user" ? "white" : "black",
                  maxWidth: "85%",
                  wordWrap: "break-word",
                  textAlign: "left"
                }}>
                  {msg.text}
                </div>
              )}

              {/* 📊 DYNAMIC CHART RENDERING */}
              {chartKeys && (
                <div style={{ height: "250px", width: "100%", marginTop: "15px", backgroundColor: "white", padding: "10px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={msg.tableData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chartKeys.xAxis} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey={chartKeys.yAxis} fill="#007bff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Dynamic Data Table */}
              {msg.tableData && msg.tableData.length > 0 && (
                <div style={{ marginTop: "15px", overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#343a40", color: "white", textAlign: "left" }}>
                        {Object.keys(msg.tableData[0]).map((key) => (
                          <th key={key} style={{ padding: "8px 12px", border: "1px solid #ddd" }}>{key.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.tableData.map((row, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} style={{ padding: "8px 12px", border: "1px solid #ddd" }}>{val !== null ? val.toString() : "0"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="e.g. Show me total sales by region..."
          style={{ flex: 1, padding: "12px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px" }}
        />
        <button onClick={handleSend} style={{ padding: "12px 24px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;