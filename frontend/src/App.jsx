import { useState } from "react"
import axios from "axios"
import * as XLSX from "xlsx"

function App() {

  const[msg,setmsg]=useState("")
  const [status,setstatus]=useState(false)
  const [emailList,setemailList]=useState("")

  const handleClick=(e)=>{
    setmsg(e.target.value)

  }

  const handleChange=(event)=>{
     const file = event.target.files[0]

    const reader = new FileReader()

    reader.onload = function(event){
        const data = event.target.result
        const workbook = XLSX.read(data,{type:"binary"})
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const emailList = XLSX.utils.sheet_to_json(worksheet,{header:"A"})
         const totalemail=emailList.map((item)=>{return item.A})
         setemailList(totalemail)
      
    }

    reader.readAsBinaryString(file);

  }


  const handleSend = () => {
  if (!msg || msg.trim().length === 0) {
    alert("Message cannot be empty!");
    return;
  }

  if (!emailList || emailList.length === 0) {
    alert("Email list cannot be empty!");
    return;
  }

  setstatus(true);

  // Ensure emailList is an array of strings
  const emailsArray = Array.isArray(emailList)
    ? emailList
    : emailList.split(",").map(e => e.trim());

  axios.post("https://bulk-mail-p29c.onrender.com/sendmail", { msg, emailList: emailsArray })
    .then((response) => {
      if (response.data.success) {
        alert("Email sent successfully");
        setmsg("");
      } else {
        alert("Failed to send: " + response.data.error);
      }
      setstatus(false);
    })
    .catch((error) => {
      alert("Error sending emails: " + (error.response?.data?.error || error.message));
      setstatus(false);
    });
};

  return (
    <>
<div className="min-h-screen bg-gradient-to-b from-[#b3e5fc] via-[#d0f2e8] to-[#e8f5e9]">
  {/* Top Bar */}
  <div className="md:flex justify-between items-center px-4 md:px-24 py-6">
    <h1 className="text-4xl md:text-6xl font-extrabold text-teal-900 tracking-tight">
      BulkMail
    </h1>
    <p className="text-teal-800 md:text-lg font-medium mt-2 md:mt-0 md:max-w-[420px]">
      Want to send marketing emails quickly? Upload your file & push your business!
    </p>
  </div>

  {/* Main Input Area */}
  <div className="flex flex-col items-center px-4 py-4">
    <textarea
      value={msg}
      onChange={handleClick}
      placeholder="Write your email content here..."
      className="w-full md:w-[80%] h-32 rounded-lg border border-transparent bg-white shadow-md px-4 py-3
                 focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800"
    />

    {/* Section Title */}
    <h2 className="text-teal-700 text-xl font-semibold mt-8 mb-3">
      Upload Email List
    </h2>

    <div className="bg-white w-full md:w-[550px] rounded-2xl shadow-lg p-6">
      {/* File Upload */}
      <label
        htmlFor="fileUpload"
        className="flex flex-col items-center justify-center border-2 border-dashed border-teal-400 
                   rounded-xl h-[170px] cursor-pointer hover:bg-teal-50 hover:border-teal-500
                   transition-all duration-200"
      >
        <input
          type="file"
          id="fileUpload"
          className="hidden"
          accept=".csv,.xlsx"
          onChange={handleChange}
        />
        <span className="text-5xl text-teal-500">📤</span>
        <p className="mt-2 text-gray-700 font-medium">Drag & Drop File</p>
        <p className="text-gray-400 text-sm">or click to browse</p>
      </label>

      {/* Email Count + Notes */}
      <div className="mt-4 flex justify-between items-center">
        <p className="text-gray-600 text-sm">
          Emails Found: <span className="font-semibold">{emailList.length}</span>
        </p>
        <p className="text-xs text-red-500">Excel only</p>
      </div>

      <p className="text-gray-400 text-xs mt-1">
        📌 Some mails may land in spam — ask users to check.
      </p>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={status}
        className="w-full py-2 mt-6 bg-teal-700 text-white font-semibold rounded-lg
                   hover:bg-teal-800 transition-all disabled:opacity-60"
      >
        {status ? "Sending..." : "Send Email"}
      </button>
    </div>
  </div>
</div>

     

    </>
  )
}

export default App
