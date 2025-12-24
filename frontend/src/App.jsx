import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

function App() {
  const [msg, setMsg] = useState("");
  const [emailList, setEmailList] = useState([]);
  const [status, setStatus] = useState(false);
  const [error, setError] = useState("");

  // Upload history (last file)
  const [lastFile, setLastFile] = useState(
    JSON.parse(localStorage.getItem("lastFile")) || null
  );

  // Email logs
  const [logs, setLogs] = useState(
    JSON.parse(localStorage.getItem("emailLogs")) || []
  );

  /* ---------------- MESSAGE ---------------- */
  const handleMessageChange = (e) => {
    setMsg(e.target.value);
  };

  /* ---------------- FILE UPLOAD ---------------- */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileDetails = {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      date: new Date().toLocaleString(),
    };

    setLastFile(fileDetails);
    localStorage.setItem("lastFile", JSON.stringify(fileDetails));

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: "A" });

      const emails = jsonData
        .map((item) => item.A)
        .filter(
          (email) =>
            email &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );

      setEmailList(emails);
      setError("");
    };

    reader.readAsBinaryString(file);
  };

  /* ---------------- SEND EMAIL ---------------- */
  const handleSend = async () => {
    if (!msg.trim()) {
      setError("Message cannot be empty");
      return;
    }

    if (emailList.length === 0) {
      setError("Upload a valid Excel file");
      return;
    }

    try {
      setStatus(true);
      setError("");

      const res = await axios.post(
        "https://bulk-mail-p29c.onrender.com/sendmail",
        { msg, emailList }
      );

      const logEntry = {
        time: new Date().toLocaleString(),
        totalEmails: emailList.length,
        status: res.data.success ? "Success" : "Failed",
      };

      const updatedLogs = [logEntry, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("emailLogs", JSON.stringify(updatedLogs));

      alert("Emails processed successfully ✅");
      setMsg("");
      setEmailList([]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);

      const failedLog = {
        time: new Date().toLocaleString(),
        totalEmails: emailList.length,
        status: "Failed",
      };

      const updatedLogs = [failedLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("emailLogs", JSON.stringify(updatedLogs));
    } finally {
      setStatus(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">

      {/* HEADER */}
      <div className="max-w-5xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold text-teal-600">
          BulkMail Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Minimal • Excel-based • Bulk email sender
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6">

        {/* MESSAGE */}
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Email Message
        </label>
        <textarea
          value={msg}
          onChange={handleMessageChange}
          rows={5}
          placeholder="Write your email content here..."
          className="w-full border rounded-lg px-3 py-2 focus:ring-2
                     focus:ring-teal-500 outline-none"
        />

        {/* FILE UPLOAD */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Upload Excel File
          </label>

          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500"
          />
        </div>

        {/* LAST UPLOAD */}
        {lastFile && (
          <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm">
            <p><b>Last File:</b> {lastFile.name}</p>
            <p>Size: {lastFile.size}</p>
            <p>Uploaded: {lastFile.date}</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <p className="mt-4 text-red-500 text-sm">
            ⚠ {error}
          </p>
        )}

        {/* SEND BUTTON */}
        <button
          onClick={handleSend}
          disabled={status}
          className="w-full mt-6 py-2.5 rounded-lg font-semibold text-white
                     bg-teal-600 hover:bg-teal-700 transition
                     disabled:opacity-60"
        >
          {status ? "Sending..." : "Send Emails"}
        </button>
      </div>

      {/* EMAIL LOGS */}
      <div className="max-w-3xl mx-auto mt-8 bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Email Logs
        </h2>

        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No email activity yet
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Time</th>
                <th>Total Emails</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="border-b last:border-none">
                  <td className="py-2">{log.time}</td>
                  <td>{log.totalEmails}</td>
                  <td
                    className={
                      log.status === "Success"
                        ? "text-teal-600 font-medium"
                        : "text-red-500 font-medium"
                    }
                  >
                    {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER */}
      <p className="text-center text-xs text-gray-400 mt-6">
        ⚠ Some emails may go to spam. Ask users to check inbox.
      </p>
    </div>
  );
}

export default App;
