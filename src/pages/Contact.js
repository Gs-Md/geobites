import React, { useState } from "react";
import "../styles/Contact.css";

const Contact = () => {
  const [form, setForm] = useState({ name: "", subject: "", email: "", description: "" });
  const [status, setStatus] = useState("");

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch("http://localhost:4000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send. Please try again.");
      setStatus("✅ Message sent! We’ll get back to you soon.");
      setForm({ name: "", subject: "", email: "", description: "" });
    } catch (err) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="contact">
      <form className="form" onSubmit={onSubmit}>
        <div className="firstline"><h1>WE'RE ALL EARS</h1></div>
        <div className="secondline">
          <input type="text" name="name" placeholder="NAME" value={form.name} onChange={onChange} />
          <input type="text" name="subject" placeholder="SUBJECT" value={form.subject} onChange={onChange} />
        </div>
        <div className="thirdline">
          <input type="email" name="email" placeholder="EMAIL" value={form.email} onChange={onChange} />
        </div>
        <div className="fourthline">
          <textarea
            name="description"
            placeholder="WHATS ON YOUR MIND?"
            rows="5"
            cols="30"
            value={form.description}
            onChange={onChange}
          ></textarea>
        </div>
        <div className="fifthline">
          <button type="submit">SEND</button>
        </div>
        {status && <p style={{ marginTop: 12, fontWeight: 600 }}>{status}</p>}
        <div className="sixthline">
          <p>
            YOU CAN ALSO EMAIL:<br />
            CONTACT@EMAIL.COM OR CALL <br />
            US ON: 03/100200
          </p>
        </div>
      </form>
    </div>
  );
};

export default Contact;