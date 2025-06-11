import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Container, Grid, Card, CardContent, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar, Stack, Chip, Select,
  MenuItem, InputLabel, FormControl, Badge, TextField
} from '@mui/material';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://meldkamer-back-end.onrender.com"}/meldingen`;
const MELDING_INTERVAL = 15000;
const politieBlauw = "#003082";

const urgentieKleur = urgentie => {
  switch ((urgentie || '').toLowerCase()) {
    case "hoog": return { label: "Hoog", color: "#e53935", text: "white" };
    case "middel": return { label: "Middel", color: "#ffb300", text: "black" };
    case "laag": return { label: "Laag", color: "#1976d2", text: "white" };
    default: return { label: urgentie || "Onbekend", color: "#bdbdbd", text: "black" };
  }
};

function getField(obj, ...keys) {
  for (let key of keys) {
    if (obj[key]) return obj[key];
    const norm = key.toLowerCase().replace(/[^a-z]/g, "");
    for (let k in obj) {
      if (k.toLowerCase().replace(/[^a-z]/g, "") === norm && obj[k]) {
        return obj[k];
      }
    }
  }
  return "-";
}

const uniqueValues = (array, field) => {
  return [...new Set(array.map(x => getField(x, field)).filter(Boolean))];
};

const Dashboard = () => {
  const [alleMeldingen, setAlleMeldingen] = useState([]);
  const [zichtbareMeldingen, setZichtbareMeldingen] = useState([]);
  const [popMelding, setPopMelding] = useState(null);
  const [noodgevallen, setNoodgevallen] = useState([]);
  const [geenNoodgevallen, setGeenNoodgevallen] = useState([]);
  const meldingIndex = useRef(0);

  const [filterUrgentie, setFilterUrgentie] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterApparaat, setFilterApparaat] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(API_URL).then((response) => {
      console.log("Binnengekomen meldingen:", response.data);
      setAlleMeldingen(response.data);
      setZichtbareMeldingen([]);
      setNoodgevallen([]);
      setGeenNoodgevallen([]);
      meldingIndex.current = 0;
    });
  }, []);

  useEffect(() => {
    if (alleMeldingen.length === 0) return;
    const interval = setInterval(() => {
      if (meldingIndex.current < alleMeldingen.length) {
        const nieuwe = alleMeldingen[meldingIndex.current];
        setZichtbareMeldingen(prev => [nieuwe, ...prev].slice(0, 50));
        setPopMelding(nieuwe);
        meldingIndex.current++;
      } else {
        clearInterval(interval);
      }
    }, MELDING_INTERVAL);
    return () => clearInterval(interval);
  }, [alleMeldingen]);

  const handleKeuze = (isNoodgeval) => {
    if (popMelding) {
      if (isNoodgeval) {
        setNoodgevallen(prev => [popMelding, ...prev]);
      } else {
        setGeenNoodgevallen(prev => [popMelding, ...prev]);
      }
      setZichtbareMeldingen(prev => prev.filter(m => m !== popMelding));
      setPopMelding(null);
    }
  };

  const typeOpties = useMemo(() => uniqueValues(zichtbareMeldingen, "melding_type"), [zichtbareMeldingen]);
  const urgentieOpties = useMemo(() => uniqueValues(zichtbareMeldingen, "urgentie"), [zichtbareMeldingen]);
  const apparaatOpties = useMemo(() => uniqueValues(zichtbareMeldingen, "apparaat"), [zichtbareMeldingen]);

  const gefilterd = useMemo(() => {
    let result = [...zichtbareMeldingen];
    if (filterUrgentie) result = result.filter(m => (getField(m, "urgentie") || "").toLowerCase() === filterUrgentie.toLowerCase());
    if (filterType) result = result.filter(m => (getField(m, "melding_type") || "").toLowerCase() === filterType.toLowerCase());
    if (filterApparaat) result = result.filter(m => (getField(m, "apparaat") || "").toLowerCase() === filterApparaat.toLowerCase());
    if (search) result = result.filter(m => Object.values(m).join(" ").toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [zichtbareMeldingen, filterUrgentie, filterType, filterApparaat, search]);

  return (
    <Container maxWidth="xl" sx={{ bgcolor: politieBlauw, minHeight: "100vh", py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Avatar src="/Politie_logo.png" variant="square" sx={{ width: 72, height: 72, bgcolor: 'white' }}>
          <LocalPoliceIcon fontSize="large" />
        </Avatar>
        <Typography variant="h4" color="white" fontWeight="bold">Meldkamer Overzicht</Typography>
        <Avatar src="/lms_logo_rgb_246h.png" variant="square" sx={{ width: 72, height: 72, bgcolor: 'white' }}>
          <NotificationsActiveIcon fontSize="large" />
        </Avatar>
      </Stack>

      <Box sx={{ bgcolor: "#fff", borderRadius: 3, p: 3, mb: 3, boxShadow: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="urgentie-label">Urgentie</InputLabel>
          <Select labelId="urgentie-label" value={filterUrgentie} label="Urgentie" onChange={e => setFilterUrgentie(e.target.value)}>
            <MenuItem value="">Alle urgenties</MenuItem>
            {urgentieOpties.map((u, i) => <MenuItem key={i} value={u}>{u}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="type-label">Type melding</InputLabel>
          <Select labelId="type-label" value={filterType} label="Type melding" onChange={e => setFilterType(e.target.value)}>
            <MenuItem value="">Alle typen</MenuItem>
            {typeOpties.map((t, i) => <MenuItem key={i} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="apparaat-label">Apparaat</InputLabel>
          <Select labelId="apparaat-label" value={filterApparaat} label="Apparaat" onChange={e => setFilterApparaat(e.target.value)}>
            <MenuItem value="">Alle apparaten</MenuItem>
            {apparaatOpties.map((a, i) => <MenuItem key={i} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Zoeken" value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
      </Box>

      <Grid container spacing={3}>
        {gefilterd.map((melding, idx) => {
          const urgentieInfo = urgentieKleur(getField(melding, "urgentie"));
          return (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Chip label={urgentieInfo.label} sx={{ bgcolor: urgentieInfo.color, color: urgentieInfo.text, fontWeight: "bold" }} />
                    <Typography variant="h6">{getField(melding, "melding_type")}</Typography>
                  </Stack>
                  <Typography variant="body2" mb={1}>{getField(melding, "tekst")}</Typography>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip label={`Apparaat: ${getField(melding, "apparaat")}`} />
                    <Chip label={`Locatie: ${getField(melding, "locatie")}`} />
                  </Stack>
                  <Button variant="contained" onClick={() => setPopMelding(melding)}>Bekijk details</Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={Boolean(popMelding)} onClose={() => setPopMelding(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Nieuwe melding ontvangen</DialogTitle>
        <DialogContent dividers>
          {popMelding && (
            <Box>
              <Typography><b>Type:</b> {getField(popMelding, "melding_type")}</Typography>
              <Typography><b>Urgentie:</b> {getField(popMelding, "urgentie")}</Typography>
              <Typography><b>Beschrijving:</b> {getField(popMelding, "tekst")}</Typography>
              <Typography><b>Apparaat:</b> {getField(popMelding, "apparaat")}</Typography>
              <Typography><b>Locatie:</b> {getField(popMelding, "locatie")}</Typography>
              <Typography><b>Tijdstip:</b> {getField(popMelding, "tijdstip")}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleKeuze(true)} color="error" variant="contained">Noodgeval</Button>
          <Button onClick={() => handleKeuze(false)} color="primary" variant="outlined">Geen noodgeval</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
