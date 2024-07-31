import './App.css'
import CreateCsvForm from "./components/CreateCsvForm.tsx";
import Header from "./components/Header.tsx";
import {Container, Divider, Stack} from "@mui/material";
import PromptForm from "./components/PromptForm.tsx";

function App() {
  return (
    <Stack spacing={4} alignItems="center">
      <Header />
      <Container>
        <Stack spacing={5}>
          <PromptForm />
          <Divider />
          <CreateCsvForm />
        </Stack>
      </Container>
    </Stack>
  )
}

export default App
