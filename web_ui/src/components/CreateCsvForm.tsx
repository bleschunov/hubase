import {
  Box,
  Link,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { CreateCsvOptions } from "../models/CreateCsvOptions.ts";
import { useState } from "react";

interface IFormInput {
  companies: string;
  sites: string;
  positions: string;
}

interface IRow {
  name: string;
  position: string;
  searched_company: string;
  inferenced_company: string;
  original_url: string;
  short_original_url: string;
  source: string;
  download_link: string;
}

const MAX_CHAR_COUNT = 25;

const CreateCsvForm = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      companies: "Мосстрой",
      sites: "sbis.ru",
      positions: "директор\nруководитель\nначальник\nглава",
    },
  });

  const [csvDownloadLink, setCsvDownloadLink] = useState("");
  const [rows, setRows] = useState<IRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const logMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const onSubmitWs: SubmitHandler<IFormInput> = async (payload_data) => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n"),
      access_token: import.meta.env.VITE_ACCESS_TOKEN,
    };
    const ws = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}/csv/progress`);
    setLoading(true);
    logMessage("Подключение к серверу...");

    ws.onopen = () => {
      logMessage("Соединение установлено, отправка данных...");
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      try {
        const row: IRow = JSON.parse(event.data);
        setCsvDownloadLink(row.download_link);
        setRows((prev) => [row, ...prev]);
        logMessage("Данные успешно загружены.");
      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
        logMessage(`Ошибка при обработке данных: ${errorMessage}`);
      }
    };

    ws.onerror = (event) => {
      console.error(event);
      const errorMessage = event instanceof ErrorEvent && event.message ? event.message : "Неизвестная ошибка";
      logMessage(`Ошибка соединения с сервером: ${errorMessage}`);
    };

    ws.onclose = () => {
      setLoading(false);
    };
  };

  const truncateString = (str: string, num: number) => {
    if (str.length <= num) {
      return str;
    }
    return str.slice(0, num) + "...";
  };

  return (
    <Stack spacing={3}>
      <form onSubmit={handleSubmit(onSubmitWs)}>
        <Stack spacing={2}>
          <Controller
            name="companies"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-textarea"
                label="Компании"
                placeholder="Север Минералс"
                multiline
                rows={4}
              />
            )}
          />
          <Controller
            name="sites"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-textarea"
                label="Сайты для поиска"
                placeholder="cfo-russia.ru"
                multiline
                rows={4}
              />
            )}
          />
          <Controller
            name="positions"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-textarea"
                label="Должности"
                placeholder="Директор"
                multiline
                rows={4}
              />
            )}
          />
          <LoadingButton loading={loading} variant="contained" type="submit">
            Отправить
          </LoadingButton>
        </Stack>
      </form>
      {csvDownloadLink !== "" && !loading ? (
        <Link href={csvDownloadLink}>Скачать CSV</Link>
      ) : (
        <Box>Здесь будет ссылка для скачивания...</Box>
      )}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell>Искомая компания</TableCell>
              <TableCell>Реальная компания</TableCell>
              <TableCell>Ссылка на источник</TableCell>
              <TableCell>Пруф из источника</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.position}</TableCell>
                <TableCell>{row.searched_company}</TableCell>
                <TableCell>{row.inferenced_company}</TableCell>
                <TableCell>
                  <Link href={row.original_url}>{row.short_original_url}</Link>
                </TableCell>
                <TableCell>{truncateString(row.source, MAX_CHAR_COUNT)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} message={snackbarMessage} />
    </Stack>
  );
};

export default CreateCsvForm;

