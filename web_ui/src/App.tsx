import './App.css'
import CreateCsvForm from "./components/CreateCsvForm.tsx";
import Header from "./components/Header.tsx";
import {Container, Stack} from "@mui/material";

function App() {
  return (
    <Stack spacing={4} alignItems="center">
      <Header />
      <Container>
        <CreateCsvForm />
      </Container>
    </Stack>
  )
}

export default App
