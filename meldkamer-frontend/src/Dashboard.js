import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://meldkamer-back-end.onrender.com"}/meldingen`;
const MELDING_INTERVAL = 15000;

const Dashboard = () => {
  const [alleMeldingen, setAlleMeldingen] = useState([]);
  const [zichtbareMeldingen, setZichtbareMeldingen] = useState([]);
  const meldingIndex = useRef(0);

  useEffect(() => {
    axios.get(API_URL).then((response) => {
      console.log("Binnengekomen meldingen:", response.data);
      setAlleMeldingen(response.data);
      setZichtbareMeldingen([]);
      meldingIndex.current = 0;
    });
  }, []); // alleen bij eerste render uitvoeren

  useEffect(() => {
    if (alleMeldingen.length === 0) return;
    const interval = setInterval(() => {
      if (meldingIndex.current < alleMeldingen.length) {
        const nieuwe = alleMeldingen[meldingIndex.current];
        setZichtbareMeldingen(prev => [nieuwe, ...prev].slice(0, 50)); // max 50 kaarten
        meldingIndex.current++;
      } else {
        clearInterval(interval);
      }
    }, MELDING_INTERVAL);
    return () => clearInterval(interval);
  }, [alleMeldingen]);

  return (
    <div>
      <h1>Live meldingen</h1>
      <ul>
        {zichtbareMeldingen.map((m, i) => (
          <li key={i}>
            <strong>{m.melding_type}</strong> – {m.tekst} ({m.urgentie})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
