import { useEffect, useState } from "react";

export default function IPGuard({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    async function checkIP() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();

        const allowedIPs = [
          "5.77.194.211"
        ];

        setAllowed(allowedIPs.includes(data.ip));
      } catch {
        setAllowed(false);
      }
    }

    checkIP();
  }, []);

  if (allowed === null) {
    return <h1>Checking access...</h1>;
  }

  if (!allowed) {
    return <h1>Access Denied</h1>;
  }

  return children;
}