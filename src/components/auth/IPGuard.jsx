import { useEffect, useState } from "react";

const ALLOWED_IPS = ["5.77.194.211"];

export default function IPGuard({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    async function checkIP() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setAllowed(ALLOWED_IPS.includes(data.ip));
      } catch {
        setAllowed(false);
      }
    }
    checkIP();
  }, []);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <div className="lpfa-page">
        <div className="lpfa-card">
          <div className="lpfa-body">
            <p className="lpfa-error">Available only on the LPFA school network.</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
