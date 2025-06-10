import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Badge,
  TextField
} from '@mui/material';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const API_URL = "http://localhost:8000/api/meldingen";
const MELDING_INTERVAL = 15000; // 15 seconden per melding 
const politieBlauw = "#003082";

// Helper voor urgentie-kleuren
const urgentieKleur = urgentie => {
  switch ((urgentie || '').toLowerCase()) {
    case "hoog":
    case "hoge urgentie":
      return { label: "Hoog", color: "#e53935", text: "white" };
    case "middel":
    case "middel urgentie":
      return { label: "Middel", color: "#ffb300", text: "black" };
    case "laag":
    case "lage urgentie":
      return { label: "Laag", color: "#1976d2", text: "white" };
    default:
      return { label: urgentie || "Onbekend", color: "#bdbdbd", text: "black" };
  }
};

// Robuuste veld-ophaler
function getField(obj, ...keys) {
  for (let key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
    // Probeer verschillende varianten:
    const norm = key.toLowerCase().replace(/[^a-z]/g, "");
    for (let k in obj) {
      if (
        k.toLowerCase().replace(/[^a-z]/g, "") === norm &&
        obj[k] !== undefined &&
        obj[k] !== null &&
        obj[k] !== ""
      ) {
        return obj[k];
      }
    }
  }
  return "-";
}

// Unieke waarden voor filters
const uniqueValues = (array, field) => {
  return [...new Set(array.map(x => getField(x, field)).filter(Boolean))];
};

const Dashboard = () => {
  // Simulatie state
  const [alleMeldingen, setAlleMeldingen] = useState([]);
  const [zichtbareMeldingen, setZichtbareMeldingen] = useState([]);
  const [popMelding, setPopMelding] = useState(null);
  const [noodgevallen, setNoodgevallen] = useState([]);
  const [geenNoodgevallen, setGeenNoodgevallen] = useState([]);
  const meldingIndex = useRef(0);

  // Filter state
  const [filterUrgentie, setFilterUrgentie] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterApparaat, setFilterApparaat] = useState('');
  const [search, setSearch] = useState('');

  // Ophalen alle meldingen 1x
  useEffect(() => {
    axios.get(API_URL).then((response) => {
      setAlleMeldingen(response.data);
      setZichtbareMeldingen([]);
      setNoodgevallen([]);
      setGeenNoodgevallen([]);
      meldingIndex.current = 0;
    });
  }, []);

  // Simuleer meldingen binnenkomst
  useEffect(() => {
    if (alleMeldingen.length === 0) return;
    const interval = setInterval(() => {
      if (meldingIndex.current < alleMeldingen.length) {
        const nieuwe = alleMeldingen[meldingIndex.current];
        setZichtbareMeldingen(prev => [nieuwe, ...prev].slice(0, 30)); // Max 30 in lijst
        setPopMelding(nieuwe);
        meldingIndex.current++;
      } else {
        clearInterval(interval);
      }
    }, MELDING_INTERVAL);
    return () => clearInterval(interval);
  }, [alleMeldingen]);

  // Pop-up keuze verwerken
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

  // Unieke waarden voor filters (op basis van zichtbareMeldingen)
  const typeOpties = useMemo(() => uniqueValues(zichtbareMeldingen, "melding_type"), [zichtbareMeldingen]);
  const urgentieOpties = useMemo(() => uniqueValues(zichtbareMeldingen, "urgentie"), [zichtbareMeldingen]);
  const apparaatOpties = useMemo(() => uniqueValues(zichtbareMeldingen, "apparaat"), [zichtbareMeldingen]);

  // Filtering
  const gefilterd = useMemo(() => {
    let result = [...zichtbareMeldingen];

    if (filterUrgentie) result = result.filter(m =>
      (getField(m, "urgentie") || "").toLowerCase() === filterUrgentie.toLowerCase()
    );
    if (filterType) result = result.filter(m =>
      (getField(m, "melding_type") || "").toLowerCase() === filterType.toLowerCase()
    );
    if (filterApparaat) result = result.filter(m =>
      (getField(m, "apparaat") || "").toLowerCase() === filterApparaat.toLowerCase()
    );
    if (search) result = result.filter(m =>
      Object.values(m).join(" ").toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [zichtbareMeldingen, filterUrgentie, filterType, filterApparaat, search]);

  // Meldingen per type (voor badge)
  const meldingenPerType = useMemo(() => {
    const counts = {};
    zichtbareMeldingen.forEach(m => {
      const t = getField(m, "melding_type") || "Onbekend";
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [zichtbareMeldingen]);

  return (
    <Container maxWidth="xl" sx={{
      bgcolor: politieBlauw,
      minHeight: "100vh",
      py: 3,
      px: { xs: 0, md: 6 }
    }}>
      {/* Header met logo's */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Avatar src="/Politie_logo.png" variant="square" sx={{ width: 72, height: 72, bgcolor: 'white' }}>
          <LocalPoliceIcon fontSize="large" />
        </Avatar>
        <Typography variant="h4" color="white" fontWeight="bold">
          Meldkamer Overzicht
        </Typography>
        <Avatar src="/lms_logo_rgb_246h.png" variant="square" sx={{ width: 72, height: 72, bgcolor: 'white' }}>
          <NotificationsActiveIcon fontSize="large" />
        </Avatar>
      </Stack>

      {/* Filtersectie */}
      <Box sx={{
        bgcolor: "#fff",
        borderRadius: 3,
        p: 3,
        mb: 3,
        boxShadow: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        gap: 2,
        justifyContent: "center"
      }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="urgentie-label">Urgentie</InputLabel>
          <Select
            labelId="urgentie-label"
            value={filterUrgentie}
            label="Urgentie"
            onChange={e => setFilterUrgentie(e.target.value)}
          >
            <MenuItem value="">Alle urgenties</MenuItem>
            {urgentieOpties.map((u, i) => <MenuItem key={i} value={u}>{u}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="type-label">Type melding</InputLabel>
          <Select
            labelId="type-label"
            value={filterType}
            label="Type melding"
            onChange={e => setFilterType(e.target.value)}
          >
            <MenuItem value="">Alle typen</MenuItem>
            {typeOpties.map((t, i) => (
              <MenuItem key={i} value={t}>
                {t} <Badge color="primary" badgeContent={meldingenPerType[t] || 0} sx={{ ml: 1 }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="apparaat-label">Apparaat</InputLabel>
          <Select
            labelId="apparaat-label"
            value={filterApparaat}
            label="Apparaat"
            onChange={e => setFilterApparaat(e.target.value)}
          >
            <MenuItem value="">Alle apparaten</MenuItem>
            {apparaatOpties.map((a, i) => <MenuItem key={i} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          sx={{ minWidth: 240 }}
          label="Zoeken in alle velden"
          variant="outlined"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <span role="img" aria-label="zoeken" style={{ marginRight: 4 }}>🔎</span>
            ),
          }}
        />
      </Box>

      {/* Aantallen per type */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2}>
          {Object.entries(meldingenPerType).map(([type, count]) => (
            <Chip
              key={type}
              label={`${type}: ${count}`}
              color="primary"
              sx={{ bgcolor: politieBlauw, color: "white", fontWeight: "bold" }}
            />
          ))}
        </Stack>
      </Box>

      {/* Overzicht nieuw binnengekomen meldingen */}
      <Typography variant="h5" sx={{ color: "white", mb: 2, mt: 3 }}>
        Nieuw binnengekomen meldingen
      </Typography>
      <Grid container spacing={3}>
        {gefilterd.map((melding, idx) => {
          const urgentieInfo = urgentieKleur(getField(melding, "urgentie"));
          return (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Chip
                      label={urgentieInfo.label}
                      sx={{
                        bgcolor: urgentieInfo.color,
                        color: urgentieInfo.text,
                        fontWeight: "bold",
                        mr: 1
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {getField(melding, "melding_type")}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {getField(melding, "tekst")}
                  </Typography>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip label={`Apparaat: ${getField(melding, "apparaat")}`} />
                    <Chip label={`Locatie: ${getField(melding, "locatie")}`} />
                  </Stack>
                  <Button
                    sx={{ mt: 1 }}
                    variant="contained"
                    color="primary"
                    onClick={() => setPopMelding(melding)}
                  >
                    Bekijk details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Categorie: Noodgevallen */}
      {noodgevallen.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" sx={{ color: "#e53935", mb: 2 }}>
            Noodgevallen
          </Typography>
          <Grid container spacing={3}>
            {noodgevallen.map((melding, idx) => (
              <Grid item xs={12} md={6} lg={4} key={idx}>
                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2, borderColor: "#e53935" }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Chip label="Noodgeval" color="error" sx={{ fontWeight: "bold", mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {getField(melding, "melding_type")}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {getField(melding, "tekst")}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1}>
                      <Chip label={`Apparaat: ${getField(melding, "apparaat")}`} />
                      <Chip label={`Locatie: ${getField(melding, "locatie")}`} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Categorie: Geen noodgeval */}
      {geenNoodgevallen.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" sx={{ color: "#1976d2", mb: 2 }}>
            Geen noodgeval
          </Typography>
          <Grid container spacing={3}>
            {geenNoodgevallen.map((melding, idx) => (
              <Grid item xs={12} md={6} lg={4} key={idx}>
                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2, borderColor: "#1976d2" }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Chip label="Geen noodgeval" sx={{ bgcolor: "#1976d2", color: "white", fontWeight: "bold", mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {getField(melding, "melding_type")}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {getField(melding, "tekst")}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1}>
                      <Chip label={`Apparaat: ${getField(melding, "apparaat")}`} />
                      <Chip label={`Locatie: ${getField(melding, "locatie")}`} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Popup voor binnengekomen melding */}
      <Dialog
        open={Boolean(popMelding)}
        onClose={() => setPopMelding(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nieuwe melding ontvangen</DialogTitle>
        <DialogContent dividers>
          {popMelding && (
            <Box>
              <Typography variant="subtitle1"><b>Type:</b> {getField(popMelding, "melding_type")}</Typography>
              <Typography variant="subtitle1"><b>Urgentie:</b> {getField(popMelding, "urgentie")}</Typography>
              <Typography variant="subtitle1"><b>Beschrijving:</b> {getField(popMelding, "tekst")}</Typography>
              <Typography variant="subtitle1"><b>Apparaat:</b> {getField(popMelding, "apparaat")}</Typography>
              <Typography variant="subtitle1"><b>Locatie:</b> {getField(popMelding, "locatie")}</Typography>
              <Typography variant="subtitle1"><b>Tijdstip:</b> {getField(popMelding, "tijdstip")}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleKeuze(true)} color="error" variant="contained">
            Noodgeval
          </Button>
          <Button onClick={() => handleKeuze(false)} color="primary" variant="outlined">
            Geen noodgeval
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
